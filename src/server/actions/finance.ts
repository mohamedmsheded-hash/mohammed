"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ReceiptVoucherSchema = z.object({
  organization_id: z.string().uuid(),
  cashbox_id: z.string().uuid("يجب اختيار الخزينة"),
  customer_id: z.string().uuid().nullable().optional(),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ السند غير صحيح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من الصفر"),
  payment_method: z.string().default("CASH"),
  notes: z.string().optional(),
  received_by: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000000"),
});

export type ReceiptVoucherInput = z.input<typeof ReceiptVoucherSchema>;

/**
 * Creates an immutable receipt voucher, adds cash to cashbox, and reduces customer balance.
 */
export async function createReceiptVoucherAction(input: ReceiptVoucherInput) {
  const validated = ReceiptVoucherSchema.parse(input);
  const supabase = await createClient();

  // 1. Generate sequential receipt number
  const { data: nextNum } = await supabase.rpc("get_next_document_number", {
    p_org_id: validated.organization_id,
    p_doc_type: "REC",
    p_prefix: "REC",
  });

  const receiptNumber = nextNum || `REC-${Date.now()}`;

  // 2. Insert Receipt Voucher
  const { data: voucher, error: vchErr } = await supabase
    .from("receipts")
    .insert({
      organization_id: validated.organization_id,
      cashbox_id: validated.cashbox_id,
      customer_id: validated.customer_id || null,
      receipt_number: receiptNumber,
      receipt_date: validated.receipt_date,
      amount: validated.amount,
      payment_method: validated.payment_method,
      notes: validated.notes || null,
      received_by: validated.received_by,
    })
    .select("id, receipt_number")
    .single();

  if (vchErr || !voucher) {
    throw new Error(`فشل إنشاء سند القبض: ${vchErr?.message}`);
  }

  // 3. Record Append-only Cash Movement
  const { error: movErr } = await supabase.from("cash_movements").insert({
    organization_id: validated.organization_id,
    cashbox_id: validated.cashbox_id,
    movement_type: "RECEIPT",
    amount: validated.amount,
    source_doc_type: "RECEIPT_VOUCHER",
    source_doc_id: voucher.id,
    notes: validated.notes || `تحصيل عميل بسند رقم ${voucher.receipt_number}`,
    created_by: validated.received_by,
  });

  if (movErr) throw new Error(`فشل تسجيل حركة الخزينة: ${movErr.message}`);

  // 4. Update Cashbox Balance
  const { data: box } = await supabase
    .from("cashboxes")
    .select("current_balance")
    .eq("id", validated.cashbox_id)
    .single();

  if (box) {
    await supabase
      .from("cashboxes")
      .update({ current_balance: box.current_balance + validated.amount })
      .eq("id", validated.cashbox_id);
  }

  // 5. Reduce Customer Balance (if linked)
  if (validated.customer_id) {
    const { data: cust } = await supabase
      .from("customers")
      .select("current_balance")
      .eq("id", validated.customer_id)
      .single();

    if (cust) {
      await supabase
        .from("customers")
        .update({ current_balance: cust.current_balance - validated.amount })
        .eq("id", validated.customer_id);
    }
  }

  revalidatePath("/finance");
  revalidatePath("/customers");
  revalidatePath("/");

  return { success: true, voucherId: voucher.id, receiptNumber: voucher.receipt_number };
}

const PaymentVoucherSchema = z.object({
  organization_id: z.string().uuid(),
  cashbox_id: z.string().uuid("يجب اختيار الخزينة"),
  supplier_id: z.string().uuid().nullable().optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ السند غير صحيح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من الصفر"),
  payment_method: z.string().default("CASH"),
  notes: z.string().min(3, "بيان الصرف وملاحظات الدفع مطلوبة"),
  paid_by: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000000"),
});

export type PaymentVoucherInput = z.input<typeof PaymentVoucherSchema>;

/**
 * Creates an immutable payment voucher, deducts cash, and updates supplier balance.
 */
export async function createPaymentVoucherAction(input: PaymentVoucherInput) {
  const validated = PaymentVoucherSchema.parse(input);
  const supabase = await createClient();

  // 1. Verify cashbox balance
  const { data: box } = await supabase
    .from("cashboxes")
    .select("current_balance")
    .eq("id", validated.cashbox_id)
    .single();

  if (!box || box.current_balance < validated.amount) {
    throw new Error(
      `رصيد الخزينة المتاح (${box?.current_balance || 0} ج.م) أقل من قيمة السند المراد صرفه (${validated.amount} ج.م)`
    );
  }

  // 2. Generate sequential payment number
  const { data: nextNum } = await supabase.rpc("get_next_document_number", {
    p_org_id: validated.organization_id,
    p_doc_type: "PAY",
    p_prefix: "PAY",
  });

  const paymentNumber = nextNum || `PAY-${Date.now()}`;

  // 3. Insert Payment Voucher
  const { data: voucher, error: vchErr } = await supabase
    .from("payments")
    .insert({
      organization_id: validated.organization_id,
      cashbox_id: validated.cashbox_id,
      supplier_id: validated.supplier_id || null,
      payment_number: paymentNumber,
      payment_date: validated.payment_date,
      amount: validated.amount,
      payment_method: validated.payment_method,
      notes: validated.notes,
      paid_by: validated.paid_by,
    })
    .select("id, payment_number")
    .single();

  if (vchErr || !voucher) {
    throw new Error(`فشل إنشاء سند الصرف: ${vchErr?.message}`);
  }

  // 4. Record Append-only Cash Movement (negative impact on box)
  await supabase.from("cash_movements").insert({
    organization_id: validated.organization_id,
    cashbox_id: validated.cashbox_id,
    movement_type: "PAYMENT",
    amount: validated.amount,
    source_doc_type: "PAYMENT_VOUCHER",
    source_doc_id: voucher.id,
    notes: validated.notes,
    created_by: validated.paid_by,
  });

  // 5. Update Cashbox Balance
  await supabase
    .from("cashboxes")
    .update({ current_balance: box.current_balance - validated.amount })
    .eq("id", validated.cashbox_id);

  // 6. Reduce Supplier Balance (if linked)
  if (validated.supplier_id) {
    const { data: sup } = await supabase
      .from("suppliers")
      .select("current_balance")
      .eq("id", validated.supplier_id)
      .single();

    if (sup) {
      await supabase
        .from("suppliers")
        .update({ current_balance: sup.current_balance - validated.amount })
        .eq("id", validated.supplier_id);
    }
  }

  revalidatePath("/finance");
  revalidatePath("/suppliers");
  revalidatePath("/");

  return { success: true, voucherId: voucher.id, paymentNumber: voucher.payment_number };
}

const CloseSessionSchema = z.object({
  organization_id: z.string().uuid(),
  cashbox_id: z.string().uuid(),
  expected_cash: z.number(),
  actual_cash_counted: z.number().min(0, "المبلغ الفعلي لا يمكن أن يكون سالباً"),
  notes: z.string().optional(),
  closed_by: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000000"),
});

export type CloseSessionInput = z.input<typeof CloseSessionSchema>;

/**
 * Closes shift/daily cash session and records cash reconciliation variance.
 */
export async function closeCashSessionAction(input: CloseSessionInput) {
  const validated = CloseSessionSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("cash_sessions").insert({
    organization_id: validated.organization_id,
    cashbox_id: validated.cashbox_id,
    opened_by: validated.closed_by,
    opened_at: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
    opening_cash: validated.expected_cash,
    closed_by: validated.closed_by,
    closed_at: new Date().toISOString(),
    expected_cash: validated.expected_cash,
    actual_cash_counted: validated.actual_cash_counted,
    notes: validated.notes || null,
  });

  if (error) {
    throw new Error(`فشل إغلاق الوردية والمطابقة: ${error.message}`);
  }

  revalidatePath("/finance");
  return { success: true };
}
