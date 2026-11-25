"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedProfile } from "@/lib/supabase/auth";

const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2),
  name_ar: z.string().trim().min(3),
  phone: z.string().trim().min(8),
  national_id: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  tax_id: z.string().trim().nullable().optional(),
  commercial_reg: z.string().trim().nullable().optional(),
  credit_limit: z.number().min(0).default(0),
  payment_terms_days: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.input<typeof CustomerSchema>;

export async function saveCustomerAction(input: CustomerInput) {
  const validated = CustomerSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();
  const row = {
    organization_id: profile.organization_id,
    code: validated.code.toUpperCase(),
    name_ar: validated.name_ar,
    phone: validated.phone,
    national_id: validated.national_id || null,
    address: validated.address || null,
    tax_id: validated.tax_id || null,
    commercial_reg: validated.commercial_reg || null,
    credit_limit: validated.credit_limit,
    payment_terms_days: validated.payment_terms_days,
    is_active: validated.is_active,
  };

  const query = validated.id
    ? supabase.from("customers").update(row).eq("id", validated.id).eq("organization_id", profile.organization_id).select("*").single()
    : supabase.from("customers").insert(row).select("*").single();
  const { data, error } = await query;
  if (error) throw new Error(`فشل حفظ العميل: ${error.message}`);

  revalidatePath("/customers");
  return { success: true, customer: data };
}

export async function deactivateCustomerAction(customerId: string) {
  const { supabase, profile } = await getAuthenticatedProfile();
  const { error } = await supabase
    .from("customers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", customerId)
    .eq("organization_id", profile.organization_id);
  if (error) throw new Error(`فشل إيقاف العميل: ${error.message}`);
  revalidatePath("/customers");
  return { success: true };
}

const SupplierSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2),
  name_ar: z.string().trim().min(3),
  supplier_type: z.string().trim().min(2).default("GENERAL"),
  phone: z.string().trim().min(8),
  address: z.string().trim().nullable().optional(),
  tax_id: z.string().trim().nullable().optional(),
  commercial_reg: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.input<typeof SupplierSchema>;

export async function saveSupplierAction(input: SupplierInput) {
  const validated = SupplierSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();
  const row = {
    organization_id: profile.organization_id,
    code: validated.code.toUpperCase(),
    name_ar: validated.name_ar,
    supplier_type: validated.supplier_type,
    phone: validated.phone,
    address: validated.address || null,
    tax_id: validated.tax_id || null,
    commercial_reg: validated.commercial_reg || null,
    is_active: validated.is_active,
  };

  const query = validated.id
    ? supabase.from("suppliers").update(row).eq("id", validated.id).eq("organization_id", profile.organization_id).select("*").single()
    : supabase.from("suppliers").insert(row).select("*").single();
  const { data, error } = await query;
  if (error) throw new Error(`فشل حفظ المورد: ${error.message}`);

  revalidatePath("/suppliers");
  return { success: true, supplier: data };
}

export async function deactivateSupplierAction(supplierId: string) {
  const { supabase, profile } = await getAuthenticatedProfile();
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", supplierId)
    .eq("organization_id", profile.organization_id);
  if (error) throw new Error(`فشل إيقاف المورد: ${error.message}`);
  revalidatePath("/suppliers");
  return { success: true };
}

export async function listCoreMastersAction() {
  const { supabase, profile } = await getAuthenticatedProfile();
  const [customers, suppliers, products, categories, units, warehouses, branches] = await Promise.all([
    supabase.from("customers").select("*").eq("organization_id", profile.organization_id).order("name_ar"),
    supabase.from("suppliers").select("*").eq("organization_id", profile.organization_id).order("name_ar"),
    supabase.from("products").select("*, product_categories(name_ar), units(name_ar)").eq("organization_id", profile.organization_id).order("name_ar"),
    supabase.from("product_categories").select("*").eq("organization_id", profile.organization_id).order("name_ar"),
    supabase.from("units").select("*").order("name_ar"),
    supabase.from("warehouses").select("*").eq("organization_id", profile.organization_id).order("name_ar"),
    supabase.from("branches").select("*").eq("organization_id", profile.organization_id).order("name_ar"),
  ]);

  for (const result of [customers, suppliers, products, categories, units, warehouses, branches]) {
    if (result.error) throw new Error(`فشل تحميل البيانات الأساسية: ${result.error.message}`);
  }

  return {
    customers: customers.data ?? [],
    suppliers: suppliers.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    units: units.data ?? [],
    warehouses: warehouses.data ?? [],
    branches: branches.data ?? [],
  };
}
