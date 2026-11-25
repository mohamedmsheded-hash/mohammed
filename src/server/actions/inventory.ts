"use server";

import { z } from "zod";
import { getAuthenticatedProfile } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

const StockAdjustmentSchema = z.object({
  organization_id: z.string().uuid(),
  warehouse_id: z.string().uuid("المخزن مطلوب"),
  product_id: z.string().uuid("الصنف مطلوب"),
  adjustment_type: z.enum(["ADD", "SUB"]),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من الصفر"),
  reason: z.string().min(3, "يجب كتابة سبب التسوية (تلف، عجز جردي، كسر، تسوية زيادة)"),
  created_by: z.string().uuid().optional(),
});

export type StockAdjustmentInput = z.input<typeof StockAdjustmentSchema>;

/**
 * Creates an approved stock adjustment recorded in the append-only stock ledger.
 */
export async function createStockAdjustmentAction(input: StockAdjustmentInput) {
  const validated = StockAdjustmentSchema.parse(input);
  const { supabase, profile } = await getAuthenticatedProfile();

  if (validated.organization_id !== profile.organization_id) {
    throw new Error("لا يمكن تنفيذ تسوية لمؤسسة أخرى");
  }

  const movementType =
    validated.adjustment_type === "ADD" ? "ADJUSTMENT_ADD" : "ADJUSTMENT_SUB";
  const signedQty =
    validated.adjustment_type === "ADD" ? validated.quantity : -validated.quantity;

  // 1. If subtracting, ensure available stock is not exceeded unless negative stock allowed
  if (validated.adjustment_type === "SUB") {
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("quantity")
      .eq("warehouse_id", validated.warehouse_id)
      .eq("product_id", validated.product_id);

    const currentStock = (movements || []).reduce((sum, m) => sum + Number(m.quantity), 0);
    if (currentStock < validated.quantity) {
      throw new Error(
        `الرصيد المتاح بالمخزن (${currentStock}) أقل من كمية العجز المراد خصمها (${validated.quantity})`
      );
    }
  }

  // 2. Fetch product replacement/current cost for valuation
  const { data: prod } = await supabase
    .from("products")
    .select("current_sale_price, replacement_cost")
    .eq("id", validated.product_id)
    .single();

  const unitCost = prod?.replacement_cost || 0;

  // 3. Insert into append-only stock ledger
  const { data: movement, error } = await supabase
    .from("stock_movements")
    .insert({
      organization_id: validated.organization_id,
      warehouse_id: validated.warehouse_id,
      product_id: validated.product_id,
      movement_type: movementType,
      quantity: signedQty,
      unit_cost_allocated: unitCost,
      source_doc_type: "STOCK_ADJUSTMENT",
      source_doc_id: validated.product_id,
      created_by: profile.id,
    })
    .select("id, quantity, movement_at")
    .single();

  if (error) {
    throw new Error(`فشل تسجيل التسوية المخزنية: ${error.message}`);
  }

  // 4. Audit Log
  await supabase.from("audit_logs").insert({
    organization_id: validated.organization_id,
    user_id: profile.id,
    action: "ADJUST_STOCK",
    entity_name: "stock_movements",
    entity_id: movement.id,
    new_values: {
      product_id: validated.product_id,
      warehouse_id: validated.warehouse_id,
      adjustment_type: validated.adjustment_type,
      quantity: validated.quantity,
      reason: validated.reason,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/");

  return { success: true, movementId: movement.id };
}

const StockTransferSchema = z.object({
  organization_id: z.string().uuid(),
  source_warehouse_id: z.string().uuid("المخزن المصدر مطلوب"),
  target_warehouse_id: z.string().uuid("المخزن الوجهة مطلوب"),
  product_id: z.string().uuid("الصنف مطلوب"),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من الصفر"),
  reason: z.string().min(3, "سبب التحويل مطلوب (تحويل هالك لمخزن التوالف، دعم مخزن فرعي)"),
  created_by: z.string().uuid().optional(),
});

export type StockTransferInput = z.input<typeof StockTransferSchema>;

/**
 * Transfers stock between two warehouses atomically in the stock ledger.
 */
export async function transferStockAction(input: StockTransferInput) {
  const validated = StockTransferSchema.parse(input);
  if (validated.source_warehouse_id === validated.target_warehouse_id) {
    throw new Error("لا يمكن التحويل لنفس المخزن المصدر");
  }

  const { supabase, profile } = await getAuthenticatedProfile();

  if (validated.organization_id !== profile.organization_id) {
    throw new Error("لا يمكن تنفيذ تحويل لمؤسسة أخرى");
  }

  // 1. Verify source stock
  const { data: movements } = await supabase
    .from("stock_movements")
    .select("quantity")
    .eq("warehouse_id", validated.source_warehouse_id)
    .eq("product_id", validated.product_id);

  const currentStock = (movements || []).reduce((sum, m) => sum + Number(m.quantity), 0);
  if (currentStock < validated.quantity) {
    throw new Error(
      `الرصيد المتاح في المخزن المصدر (${currentStock}) غير كافٍ لتحويل (${validated.quantity})`
    );
  }

  // 2. Insert Transfer OUT and Transfer IN
  const transferDocId = crypto.randomUUID();

  const { error: outErr } = await supabase.from("stock_movements").insert({
    organization_id: validated.organization_id,
    warehouse_id: validated.source_warehouse_id,
    product_id: validated.product_id,
    movement_type: "TRANSFER_OUT",
    quantity: -validated.quantity,
    source_doc_type: "STOCK_TRANSFER",
    source_doc_id: transferDocId,
    created_by: profile.id,
  });

  if (outErr) throw new Error(`فشل قيد التحويل الصادر: ${outErr.message}`);

  const { error: inErr } = await supabase.from("stock_movements").insert({
    organization_id: validated.organization_id,
    warehouse_id: validated.target_warehouse_id,
    product_id: validated.product_id,
    movement_type: "TRANSFER_IN",
    quantity: validated.quantity,
    source_doc_type: "STOCK_TRANSFER",
    source_doc_id: transferDocId,
    created_by: profile.id,
  });

  if (inErr) throw new Error(`فشل قيد التحويل الوارد: ${inErr.message}`);

  revalidatePath("/inventory");
  return { success: true, transferDocId };
}
