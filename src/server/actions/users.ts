"use server";

import { z } from "zod";
import { getAuthenticatedProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const { supabase, profile: actingProfile } = await getAuthenticatedProfile();

  if (validated.organization_id !== actingProfile.organization_id) {
    throw new Error("لا يمكن إنشاء موظف لمؤسسة أخرى");
  }

  if (actingProfile.role_code !== "ADMIN") {
    throw new Error("صلاحيات المدير العام مطلوبة لإنشاء الموظفين");
  }

  throw new Error("إنشاء حساب موظف يتطلب البريد وكلمة المرور. استخدم إنشاء مستخدم Supabase Auth ثم اربطه بملف الموظف");
}

export async function updateUserWarehouseAccess(
  userId: string,
  warehouseIds: string[]
) {
  const { supabase, profile: actingProfile } = await getAuthenticatedProfile();

  if (actingProfile.role_code !== "ADMIN") {
    throw new Error("صلاحيات المدير العام مطلوبة لتعديل صلاحيات المخازن");
  }

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
