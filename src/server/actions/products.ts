"use server";

import { z } from "zod";
import { getAuthenticatedProfile } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

const UpdatePriceSchema = z.object({
  productId: z.string().uuid("معرف الصنف غير صحيح"),
  priceType: z.enum(["SALE_PRICE", "REPLACEMENT_COST"]),
  newPrice: z.number().min(0, "السعر لا يمكن أن يكون سالباً"),
  reason: z.string().min(3, "يجب تحديد سبب تغيير السعر (مثال: زيادة أسعار المصنع)"),
  userId: z.string().uuid().optional(),
});

export type UpdatePriceInput = z.input<typeof UpdatePriceSchema>;

/**
 * Updates current product price and creates an immutable price history record.
 * Invariant: Updating current price NEVER changes historical invoices or historical COGS.
 */
export async function updateProductPriceAction(input: UpdatePriceInput) {
  const validated = UpdatePriceSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();

  // 1. Fetch current price
  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("id, code, name_ar, current_sale_price, replacement_cost")
    .eq("id", validated.productId)
    .single();

  if (fetchErr || !product) {
    throw new Error("لم يتم العثور على الصنف المحدد");
  }

  const oldPrice =
    validated.priceType === "SALE_PRICE"
      ? product.current_sale_price
      : product.replacement_cost;

  // 2. Insert into product_price_history (Immutable audit trail)
  const { error: histErr } = await supabase.from("product_price_history").insert({
    product_id: validated.productId,
    price_type: validated.priceType,
    old_price: oldPrice,
    new_price: validated.newPrice,
    reason: validated.reason,
    changed_by: profile.id,
    effective_at: new Date().toISOString(),
  });

  if (histErr) {
    throw new Error(`فشل تسجيل سجل تغير السعر: ${histErr.message}`);
  }

  // 3. Update current price on product table
  const updateData =
    validated.priceType === "SALE_PRICE"
      ? { current_sale_price: validated.newPrice, updated_at: new Date().toISOString() }
      : { replacement_cost: validated.newPrice, updated_at: new Date().toISOString() };

  const { error: updateErr } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", validated.productId);

  if (updateErr) {
    throw new Error(`فشل تحديث سعر الصنف: ${updateErr.message}`);
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");

  return {
    success: true,
    productId: validated.productId,
    oldPrice,
    newPrice: validated.newPrice,
  };
}

/**
 * Creates a new product with construction material specifications
 */
const CreateProductSchema = z.object({
  organization_id: z.string().uuid(),
  category_id: z.string().uuid("يجب اختيار تصنيف"),
  brand_id: z.string().uuid().nullable().optional(),
  code: z.string().min(2, "كود الصنف مطلوب"),
  barcode: z.string().nullable().optional(),
  name_ar: z.string().min(3, "اسم الصنف بالعربية مطلوب"),
  base_unit_id: z.string().uuid("يجب اختيار وحدة الأساس"),
  steel_diameter_mm: z.number().nullable().optional(),
  nominal_weight_per_m: z.number().nullable().optional(),
  bag_weight_kg: z.number().nullable().optional(),
  is_bulk: z.boolean().default(false),
  current_sale_price: z.number().min(0).default(0),
  replacement_cost: z.number().min(0).default(0),
  min_reorder_qty: z.number().min(0).default(0),
});

export type CreateProductInput = z.input<typeof CreateProductSchema>;

export async function createProductAction(input: CreateProductInput) {
  const validated = CreateProductSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();

  if (validated.organization_id !== profile.organization_id) {
    throw new Error("لا يمكن إضافة صنف لمؤسسة أخرى");
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: validated.organization_id,
      category_id: validated.category_id,
      brand_id: validated.brand_id || null,
      code: validated.code.toUpperCase().trim(),
      barcode: validated.barcode?.trim() || null,
      name_ar: validated.name_ar.trim(),
      base_unit_id: validated.base_unit_id,
      steel_diameter_mm: validated.steel_diameter_mm || null,
      nominal_weight_per_m: validated.nominal_weight_per_m || null,
      bag_weight_kg: validated.bag_weight_kg || null,
      is_bulk: validated.is_bulk,
      current_sale_price: validated.current_sale_price,
      replacement_cost: validated.replacement_cost,
      min_reorder_qty: validated.min_reorder_qty,
      is_active: true,
    })
    .select("id, code, name_ar")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`كود الصنف (${validated.code}) مسجل بالفعل لمادة أخرى`);
    }
    throw new Error(`فشل إضافة الصنف: ${error.message}`);
  }

  revalidatePath("/products");
  return { success: true, product: data };
}
