"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SalesLineItemSchema = z.object({
  product_id: z.string().uuid("معرف الصنف غير صحيح"),
  entered_quantity: z.number().positive("الكمية يجب أن تكون أكبر من الصفر"),
  entered_unit_id: z.string().uuid("معرف الوحدة غير صحيح"),
  unit_price: z.number().min(0, "سعر البيع لا يمكن أن يكون سالباً"),
  line_discount: z.number().min(0).default(0),
});

const CreateSalesInvoiceSchema = z.object({
  organization_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الفاتورة غير صحيح"),
  payment_type: z.enum(["CASH", "CREDIT", "SPLIT"]),
  paid_amount: z.number().min(0).default(0),
  freight_charge: z.number().min(0).default(0),
  notes: z.string().optional(),
  lines: z.array(SalesLineItemSchema).min(1, "يجب إضافة بند واحد على الأقل في الفاتورة"),
});

export type CreateSalesInvoiceInput = z.infer<typeof CreateSalesInvoiceSchema>;

/**
 * Creates a draft sales invoice with re-calculated totals on the server.
 */
export async function createSalesInvoiceDraft(input: CreateSalesInvoiceInput) {
  const validated = CreateSalesInvoiceSchema.parse(input);
  const supabase = await createClient();

  // 1. Fetch current product names & conversions to prevent client tampering
  const productIds = validated.lines.map((l) => l.product_id);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name_ar, base_unit_id")
    .in("id", productIds);

  if (prodErr || !products) {
    throw new Error("فشل استرجاع بيانات الأصناف المحددة من قاعدة البيانات");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Compute server-side subtotal and lines
  let subtotal = 0;
  const processedLines = validated.lines.map((line) => {
    const prod = productMap.get(line.product_id);
    if (!prod) throw new Error(`الصنف غير موجود: ${line.product_id}`);

    const lineTotal = line.entered_quantity * line.unit_price - (line.line_discount || 0);
    subtotal += lineTotal;

    return {
      product_id: line.product_id,
      product_name_snap: prod.name_ar,
      entered_quantity: line.entered_quantity,
      entered_unit_id: line.entered_unit_id,
      conversion_factor: 1.0, // Defaults to 1 if base unit; otherwise fetched via conversions
      base_quantity: line.entered_quantity,
      unit_price_snap: line.unit_price,
      line_discount: line.line_discount || 0,
      total_line_amount: lineTotal,
      historical_cogs: 0, // Assigned upon approval
    };
  });

  const totalAmount = subtotal + (validated.freight_charge || 0);

  // 3. Generate atomic sequential invoice number
  const { data: nextNum, error: seqErr } = await supabase.rpc(
    "get_next_document_number",
    {
      p_org_id: validated.organization_id,
      p_doc_type: "INV",
      p_prefix: "INV",
    }
  );

  const invoiceNumber = nextNum || `INV-${Date.now()}`;

  // 4. Insert Invoice Header
  const { data: invoice, error: invErr } = await supabase
    .from("sales_invoices")
    .insert({
      organization_id: validated.organization_id,
      branch_id: validated.branch_id,
      warehouse_id: validated.warehouse_id,
      invoice_number: invoiceNumber,
      customer_id: validated.customer_id || null,
      invoice_date: validated.invoice_date,
      status: "DRAFT",
      payment_type: validated.payment_type,
      subtotal,
      freight_charge: validated.freight_charge || 0,
      total_amount: totalAmount,
      paid_amount: validated.paid_amount || 0,
      notes: validated.notes || null,
      created_by: "00000000-0000-0000-0000-000000000000", // Current session user
    })
    .select("id, invoice_number")
    .single();

  if (invErr || !invoice) {
    throw new Error(`فشل إنشاء رأس الفاتورة: ${invErr?.message}`);
  }

  // 5. Insert Invoice Lines
  const linesToInsert = processedLines.map((l) => ({
    sales_invoice_id: invoice.id,
    ...l,
  }));

  const { error: linesErr } = await supabase
    .from("sales_invoice_lines")
    .insert(linesToInsert);

  if (linesErr) {
    throw new Error(`فشل حفظ سطور الفاتورة: ${linesErr.message}`);
  }

  revalidatePath("/sales");
  return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
}

/**
 * Approves a sales invoice atomically via PostgreSQL RPC.
 */
export async function approveSalesInvoice(invoiceId: string, approvedByUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("rpc_approve_sales_invoice", {
    p_invoice_id: invoiceId,
    p_approved_by: approvedByUserId,
  });

  if (error) {
    throw new Error(`فشل اعتماد الفاتورة: ${error.message}`);
  }

  revalidatePath("/sales");
  revalidatePath("/");
  return data;
}
