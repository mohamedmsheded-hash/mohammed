/**
 * Core Domain Types & Enums for Construction ERP
 */

export type CostMethod = "FIFO" | "MOVING_AVG";

export type StockMovementType =
  | "OPENING_BALANCE"
  | "PURCHASE_RECEIPT"
  | "SALES_ISSUE"
  | "SALES_RETURN"
  | "SUPPLIER_RETURN"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT_ADD"
  | "ADJUSTMENT_SUB"
  | "SCRAP_ISSUE";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "REVERSED";

export type PaymentType = "CASH" | "CREDIT" | "SPLIT";

export type DeliveryStatus =
  | "PREPARING"
  | "DISPATCHED"
  | "DELIVERED"
  | "RETURNED_PARTIAL"
  | "CANCELLED";

export type CashMovementType =
  | "RECEIPT"
  | "PAYMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT";

export interface Unit {
  id: string;
  code: "TON" | "BAG" | "M3" | "KG" | "PIECE" | string;
  name_ar: string;
  decimal_places: number;
}

export interface ProductCategory {
  id: string;
  organization_id: string;
  code: string;
  name_ar: string;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id: string;
  code: string;
  barcode?: string | null;
  name_ar: string;
  base_unit_id: string;
  base_unit?: Unit;
  steel_diameter_mm?: number | null;
  nominal_weight_per_m?: number | null;
  bag_weight_kg?: number | null;
  is_bulk: boolean;
  current_sale_price: number;
  replacement_cost: number;
  min_reorder_qty: number;
  is_active: boolean;
}

export interface UnitConversion {
  id: string;
  product_id: string;
  from_unit_id: string;
  to_unit_id: string;
  multiplier: number;
  version: number;
  is_active: boolean;
}

export interface CostLayer {
  id: string;
  organization_id: string;
  warehouse_id: string;
  product_id: string;
  initial_qty: number;
  remaining_qty: number;
  purchase_unit_price: number;
  landed_cost_unit: number;
  total_unit_cost: number;
  is_exhausted: boolean;
  received_at: string;
}

export interface CostAllocationResult {
  cost_layer_id: string;
  quantity_consumed: number;
  unit_cost: number;
  total_cost: number;
}

export interface SalesInvoiceLineInput {
  product_id: string;
  entered_quantity: number;
  entered_unit_id: string;
  unit_price: number;
  line_discount?: number;
}

export interface ApproveInvoiceResult {
  invoice_id: string;
  invoice_number: string;
  total_amount: number;
  total_historical_cogs: number;
  total_historical_profit: number;
  status: InvoiceStatus;
}
