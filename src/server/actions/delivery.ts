"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DeliveryLineSchema = z.object({
  sales_invoice_line_id: z.string().uuid(),
  quantity_to_deliver: z.number().positive("كمية التوصيل يجب أن تكون أكبر من صفر"),
});

const CreateDeliveryOrderSchema = z.object({
  sales_invoice_id: z.string().uuid("معرف الفاتورة مطلوب"),
  vehicle_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  destination_address: z.string().min(3, "عنوان الموقع أو وجهة التسليم مطلوبة"),
  recipient_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(DeliveryLineSchema).min(1, "يجب تحديد بند واحد على الأقل للتسليم"),
});

export type CreateDeliveryOrderInput = z.input<typeof CreateDeliveryOrderSchema>;

export async function createDeliveryOrder(input: CreateDeliveryOrderInput) {
  const validated = CreateDeliveryOrderSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("rpc_create_delivery_order", {
    p_invoice_id: validated.sales_invoice_id,
    p_vehicle_id: validated.vehicle_id || null,
    p_driver_id: validated.driver_id || null,
    p_destination_address: validated.destination_address,
    p_recipient_phone: validated.recipient_phone || null,
    p_notes: validated.notes || null,
    p_lines: validated.lines,
  });

  if (error) {
    throw new Error(`فشل إنشاء أمر التوصيل: ${error.message}`);
  }

  revalidatePath("/delivery");
  return data;
}

const UpdateDeliveryStatusSchema = z.object({
  delivery_id: z.string().uuid(),
  status: z.enum(["DISPATCHED", "DELIVERED", "CANCELLED"]),
  proof_of_delivery_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateDeliveryStatusInput = z.input<typeof UpdateDeliveryStatusSchema>;

export async function updateDeliveryStatus(input: UpdateDeliveryStatusInput) {
  const validated = UpdateDeliveryStatusSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("rpc_update_delivery_status", {
    p_delivery_id: validated.delivery_id,
    p_new_status: validated.status,
    p_proof_of_delivery_url: validated.proof_of_delivery_url || null,
    p_notes: validated.notes || null,
  });

  if (error) {
    throw new Error(`فشل تحديث حالة أمر التوصيل: ${error.message}`);
  }

  revalidatePath("/delivery");
  return data;
}
