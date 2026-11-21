"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const CreateUserSchema = z.object({
  organization_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(3, "الاسم بالكامل مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  role_code: z.enum(["ADMIN", "ACCOUNTANT", "WAREHOUSE_KEEPER", "CASHIER", "STAFF"]),
  max_discount_pct: z.number().min(0).max(100).default(0),
  warehouse_ids: z.array(z.string().uuid()).default([]),
});

export type CreateUserInput = z.input<typeof CreateUserSchema>;

export async function createUserProfile(input: CreateUserInput) {
  const validated = CreateUserSchema.parse(input);
  const supabase = await createClient();

  // Create profile (mocking auth user id for demo/seed scenarios)
  const fakeUserId = crypto.randomUUID();

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .insert({
      id: fakeUserId,
      organization_id: validated.organization_id,
      branch_id: validated.branch_id || null,
      full_name: validated.full_name,
      phone: validated.phone,
      role_code: validated.role_code,
      max_discount_pct: validated.max_discount_pct,
      is_active: true,
    })
    .select()
    .single();

  if (profErr) {
    throw new Error(`فشل إنشاء المستخدم: ${profErr.message}`);
  }

  // Assign warehouse access if warehouse keeper or restricted
  if (validated.warehouse_ids.length > 0) {
    const warehouseAccessRows = validated.warehouse_ids.map((whId) => ({
      user_id: fakeUserId,
      warehouse_id: whId,
      can_issue: true,
      can_receive: true,
    }));

    await supabase.from("user_warehouse_access").insert(warehouseAccessRows);
  }

  revalidatePath("/users");
  return profile;
}

export async function updateUserWarehouseAccess(
  userId: string,
  warehouseIds: string[]
) {
  const supabase = await createClient();

  // Remove existing
  await supabase.from("user_warehouse_access").delete().eq("user_id", userId);

  // Re-insert
  if (warehouseIds.length > 0) {
    const rows = warehouseIds.map((whId) => ({
      user_id: userId,
      warehouse_id: whId,
      can_issue: true,
      can_receive: true,
    }));
    await supabase.from("user_warehouse_access").insert(rows);
  }

  revalidatePath("/users");
  return { success: true };
}
