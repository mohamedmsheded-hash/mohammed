"use server";

import { z } from "zod";
import { getAuthenticatedProfile } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

const ReturnLineItemSchema = z.object({
  original_line_id: z.string().uuid("معرف بند الفاتورة غير صحيح"),
  returned_qty: z.number().positive("الكمية المرتجعة يجب أن تكون أكبر من الصفر"),
  is_damaged: z.boolean().default(false),
  custom_notes: z.string().optional(),
});

const ProcessSalesReturnSchema = z.object({
  original_invoice_id: z.string().uuid("معرف الفاتورة الأصلية مطلوب"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ المرتجع غير صحيح"),
  reason: z.string().min(3, "سبب المرتجع مطلوب بالتفصيل للتدقيق"),
  refund_method: z.enum(["CASH", "CREDIT"]),
  cashbox_id: z.string().uuid().optional().nullable(),
  approved_by: z.string().uuid("معرف المستخدم المعتمد مطلوب").optional(),
  lines: z.array(ReturnLineItemSchema).min(1, "يجب تحديد صنف واحد على الأقل للمرتجع"),
});

export type ProcessSalesReturnInput = z.input<typeof ProcessSalesReturnSchema>;

export async function processSalesReturn(input: ProcessSalesReturnInput) {
  const validated = ProcessSalesReturnSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();

  if (validated.refund_method === "CASH" && !validated.cashbox_id) {
    throw new Error("يجب تحديد الخزينة لصرف المرتجع النقدي");
  }

  if (validated.refund_method === "CASH" && !validated.cashbox_id) {
    throw new Error("يجب تحديد الخزينة لصرف المرتجع النقدي");
  }

  const { data, error } = await supabase.rpc("rpc_process_sales_return", {
    p_original_invoice_id: validated.original_invoice_id,
    p_return_date: validated.return_date,
    p_reason: validated.reason,
    p_refund_method: validated.refund_method,
    p_cashbox_id: validated.cashbox_id || null,
    p_approved_by: profile.id,
    p_lines: validated.lines,
  });

  if (error) {
    throw new Error(`فشل تسجيل واعتماد المرتجع: ${error.message}`);
  }

  revalidatePath("/returns");
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/finance");

  return data;
}
