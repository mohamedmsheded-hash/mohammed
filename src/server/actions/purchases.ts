"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PurchaseLineSchema = z.object({
  product_id: z.string().uuid("معرف الصنف غير صحيح"),
  received_qty: z.number().positive("الكمية يجب أن تكون أكبر من الصفر"),
  entered_unit_id: z.string().uuid("معرف الوحدة غير صحيح"),
  purchase_unit_price: z.number().min(0, "سعر الشراء لا يمكن أن يكون سالباً"),
});

const GoodsReceiptExpenseSchema = z.object({
  expense_type: z.enum(["FREIGHT", "UNLOADING_MASHAL", "WEIGHING"]),
  amount: z.number().positive("قيمة المصروف يجب أن تكون موجبة"),
  paid_to: z.string().optional(),
  notes: z.string().optional(),
});

const CreateGoodsReceiptSchema = z.object({
  organization_id: z.string().uuid(),
  warehouse_id: z.string().uuid("المخزن المستلم مطلوب"),
  supplier_id: z.string().uuid("المورد مطلوب"),
  supplier_invoice_ref: z.string().optional(),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الاستلام غير صحيح"),
  truck_plate: z.string().optional(),
  gross_weight_kg: z.number().optional(),
  tare_weight_kg: z.number().optional(),
  net_weight_kg: z.number().optional(),
  notes: z.string().optional(),
  lines: z.array(PurchaseLineSchema).min(1, "يجب إضافة صنف واحد على الأقل في إذن الاستلام"),
  expenses: z.array(GoodsReceiptExpenseSchema).default([]),
  received_by: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000000"),
});

export type CreateGoodsReceiptInput = z.input<typeof CreateGoodsReceiptSchema>;

/**
 * Creates a goods receipt with landed costs, generates open FIFO cost layers,
 * records positive stock movements, and updates supplier balance.
 */
export async function createGoodsReceiptAction(input: CreateGoodsReceiptInput) {
  const validated = CreateGoodsReceiptSchema.parse(input);
  const supabase = await createClient();

  // 1. Generate sequential receipt number
  const { data: nextNum } = await supabase.rpc("get_next_document_number", {
    p_org_id: validated.organization_id,
    p_doc_type: "GR",
    p_prefix: "GR",
  });

  const receiptNumber = nextNum || `GR-${Date.now()}`;

  // 2. Insert Goods Receipt Header
  const { data: receipt, error: rcptErr } = await supabase
    .from("goods_receipts")
    .insert({
      organization_id: validated.organization_id,
      warehouse_id: validated.warehouse_id,
      supplier_id: validated.supplier_id,
      receipt_number: receiptNumber,
      supplier_invoice_ref: validated.supplier_invoice_ref || null,
      receipt_date: validated.receipt_date,
      truck_plate: validated.truck_plate || null,
      gross_weight_kg: validated.gross_weight_kg || null,
      tare_weight_kg: validated.tare_weight_kg || null,
      net_weight_kg: validated.net_weight_kg || null,
      notes: validated.notes || null,
      received_by: validated.received_by,
    })
    .select("id, receipt_number")
    .single();

  if (rcptErr || !receipt) {
    throw new Error(`فشل إنشاء رأس إذن الاستلام: ${rcptErr?.message}`);
  }

  // 3. Insert Goods Receipt Lines
  const linesToInsert = validated.lines.map((line) => ({
    goods_receipt_id: receipt.id,
    product_id: line.product_id,
    received_qty_entered: line.received_qty,
    entered_unit_id: line.entered_unit_id,
    conversion_factor: 1.0,
    base_unit_qty: line.received_qty,
    purchase_unit_price: line.purchase_unit_price,
    allocated_freight_unit: 0,
    allocated_unloading_unit: 0,
    total_line_cost: line.received_qty * line.purchase_unit_price,
  }));

  const { error: linesErr } = await supabase
    .from("goods_receipt_lines")
    .insert(linesToInsert);

  if (linesErr) {
    throw new Error(`فشل تسجيل سطور الاستلام: ${linesErr.message}`);
  }

  // 4. Insert Landed Cost Expenses (if any)
  if (validated.expenses && validated.expenses.length > 0) {
    const expensesToInsert = validated.expenses.map((exp) => ({
      goods_receipt_id: receipt.id,
      expense_type: exp.expense_type,
      amount: exp.amount,
      paid_to: exp.paid_to || null,
      allocation_method: "BY_WEIGHT",
      notes: exp.notes || null,
    }));

    const { error: expErr } = await supabase
      .from("goods_receipt_expenses")
      .insert(expensesToInsert);

    if (expErr) {
      throw new Error(`فشل تسجيل مصاريف التوريد: ${expErr.message}`);
    }
  }

  // 5. Trigger Atomic Stored Procedure: allocate landed costs & generate FIFO layers
  const { data: rpcResult, error: rpcErr } = await supabase.rpc(
    "rpc_receive_goods_with_layers",
    {
      p_receipt_id: receipt.id,
    }
  );

  if (rpcErr) {
    throw new Error(`فشل ترحيل طبقات تكلفة الاستلام: ${rpcErr.message}`);
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true, receiptId: receipt.id, receiptNumber: receipt.receipt_number };
}
