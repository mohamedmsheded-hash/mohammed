"use client";

import React, { useState } from "react";
import {
  Boxes,
  Building,
  PlusCircle,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  X,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatQuantity, formatDate } from "@/lib/utils";
import { createStockAdjustmentAction, transferStockAction } from "@/server/actions/inventory";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  isScrap: boolean;
}

const warehouses: Warehouse[] = [
  { id: "c0000000-0000-0000-0000-000000000001", name: "مخزن الأسمنت والجبس المغطى", code: "WH-CEM", isScrap: false },
  { id: "c0000000-0000-0000-0000-000000000002", name: "ساحة تشوين حديد التسليح", code: "WH-STEEL", isScrap: false },
  { id: "c0000000-0000-0000-0000-000000000003", name: "مستودع التوالف والكسر والهالك", code: "WH-SCRAP", isScrap: true },
];

interface StockItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  baseUnit: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  minReorderQty: number;
  costValue: number;
}

const initialStockItems: StockItem[] = [
  {
    id: "stk-1",
    productId: "p0000000-0000-0000-0000-000000000001",
    code: "PRD-CEM-SWD",
    name: "أسمنت السويدي مقاوم 42.5",
    warehouseId: "c0000000-0000-0000-0000-000000000001",
    warehouseName: "مخزن الأسمنت والجبس المغطى",
    baseUnit: "شيكارة",
    onHandQty: 1000,
    reservedQty: 250,
    availableQty: 750,
    minReorderQty: 200,
    costValue: 130000,
  },
  {
    id: "stk-2",
    productId: "p0000000-0000-0000-0000-000000000002",
    code: "PRD-STL-EZZ-10",
    name: "حديد تسليح عز 10 مم",
    warehouseId: "c0000000-0000-0000-0000-000000000002",
    warehouseName: "ساحة تشوين حديد التسليح",
    baseUnit: "طن",
    onHandQty: 4.0,
    reservedQty: 0.0,
    availableQty: 4.0,
    minReorderQty: 15.0,
    costValue: 164800,
  },
  {
    id: "stk-3",
    productId: "p0000000-0000-0000-0000-000000000003",
    code: "PRD-STL-EZZ-12",
    name: "حديد تسليح عز 12 مم",
    warehouseId: "c0000000-0000-0000-0000-000000000002",
    warehouseName: "ساحة تشوين حديد التسليح",
    baseUnit: "طن",
    onHandQty: 28.5,
    reservedQty: 8.0,
    availableQty: 20.5,
    minReorderQty: 20.0,
    costValue: 1168500,
  },
  {
    id: "stk-4",
    productId: "p0000000-0000-0000-0000-000000000001",
    code: "PRD-CEM-SWD",
    name: "أسمنت السويدي مقاوم (شكاير مبللة معيبة)",
    warehouseId: "c0000000-0000-0000-0000-000000000003",
    warehouseName: "مستودع التوالف والكسر والهالك",
    baseUnit: "شيكارة",
    onHandQty: 14,
    reservedQty: 0,
    availableQty: 0,
    minReorderQty: 0,
    costValue: 1820,
  },
];

interface MovementRecord {
  id: string;
  date: string;
  productName: string;
  warehouseName: string;
  type: string;
  qty: number;
  unit: string;
  unitCost: number;
  sourceDoc: string;
}

const initialMovements: MovementRecord[] = [
  {
    id: "mov-1",
    date: "2026-11-21T11:45:00Z",
    productName: "أسمنت السويدي مقاوم 42.5",
    warehouseName: "مخزن الأسمنت والجبس المغطى",
    type: "SALES_ISSUE",
    qty: -50,
    unit: "شيكارة",
    unitCost: 130.0,
    sourceDoc: "فاتورة INV-2026-0041",
  },
  {
    id: "mov-2",
    date: "2026-11-21T10:15:00Z",
    productName: "أسمنت السويدي مقاوم 42.5",
    warehouseName: "مستودع التوالف والكسر والهالك",
    type: "TRANSFER_IN",
    qty: 14,
    unit: "شيكارة",
    unitCost: 130.0,
    sourceDoc: "تحويل هالك تلف رطوبة TRN-001",
  },
  {
    id: "mov-3",
    date: "2026-11-20T14:30:00Z",
    productName: "حديد تسليح عز 12 مم",
    warehouseName: "ساحة تشوين حديد التسليح",
    type: "PURCHASE_RECEIPT",
    qty: 28.5,
    unit: "طن",
    unitCost: 41000.0,
    sourceDoc: "إذن استلام GR-2026-0009",
  },
  {
    id: "mov-4",
    date: "2026-11-20T09:00:00Z",
    productName: "أسمنت السويدي مقاوم 42.5",
    warehouseName: "مخزن الأسمنت والجبس المغطى",
    type: "OPENING_BALANCE",
    qty: 1000,
    unit: "شيكارة",
    unitCost: 130.0,
    sourceDoc: "رصيد افتتاحي معتمد",
  },
];

export default function InventoryPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"BALANCES" | "LEDGER">("BALANCES");
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
  const [movements, setMovements] = useState<MovementRecord[]>(initialMovements);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
  const [selectedProductForAction, setSelectedProductForAction] = useState(stockItems[0].productId);
  const [actionWarehouseId, setActionWarehouseId] = useState(warehouses[0].id);
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses[2].id);
  const [actionQty, setActionQty] = useState("");
  const [adjustType, setAdjustType] = useState<"ADD" | "SUB">("SUB");
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStock = stockItems.filter((item) => {
    const matchesWh = selectedWarehouse === "ALL" || item.warehouseId === selectedWarehouse;
    const matchesSearch =
      item.name.includes(searchQuery) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWh && matchesSearch;
  });

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(actionQty);
    if (isNaN(qty) || qty <= 0) {
      alert("يرجى إدخال كمية صحيحة أكبر من الصفر");
      return;
    }

    if (!actionReason.trim()) {
      alert("يرجى كتابة سبب التسوية المخزنية");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStockAdjustmentAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        warehouse_id: actionWarehouseId,
        product_id: selectedProductForAction,
        adjustment_type: adjustType,
        quantity: qty,
        reason: actionReason,
      });

      // Update local state
      const targetProd = stockItems.find((s) => s.productId === selectedProductForAction);
      const newMovement: MovementRecord = {
        id: `mov-${Date.now()}`,
        date: new Date().toISOString(),
        productName: targetProd?.name || "صنف مسوى",
        warehouseName: warehouses.find((w) => w.id === actionWarehouseId)?.name || "مخزن",
        type: adjustType === "ADD" ? "ADJUSTMENT_ADD" : "ADJUSTMENT_SUB",
        qty: adjustType === "ADD" ? qty : -qty,
        unit: targetProd?.baseUnit || "وحدة",
        unitCost: 130.0,
        sourceDoc: `تسوية جردية: ${actionReason}`,
      };

      setMovements([newMovement, ...movements]);
      setStockItems((prev) =>
        prev.map((item) => {
          if (item.productId === selectedProductForAction && item.warehouseId === actionWarehouseId) {
            const diff = adjustType === "ADD" ? qty : -qty;
            return {
              ...item,
              onHandQty: item.onHandQty + diff,
              availableQty: item.availableQty + diff,
            };
          }
          return item;
        })
      );

      alert("تم اعتماد التسوية المخزنية وقيدها في دفتر حركات المخزون بنجاح.");
      setIsAdjustModalOpen(false);
      setActionQty("");
      setActionReason("");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(actionQty);
    if (isNaN(qty) || qty <= 0) {
      alert("يرجى إدخال كمية صحيحة");
      return;
    }

    if (actionWarehouseId === targetWarehouseId) {
      alert("المخزن المصدر والمخزن الوجهة متطابقان!");
      return;
    }

    setIsSubmitting(true);
    try {
      await transferStockAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        source_warehouse_id: actionWarehouseId,
        target_warehouse_id: targetWarehouseId,
        product_id: selectedProductForAction,
        quantity: qty,
        reason: actionReason || "تحويل مخزني داخلي",
      });

      alert("تم التحويل المخزني بنجاح بين المخازن المحددة.");
      setIsTransferModalOpen(false);
      setActionQty("");
      setActionReason("");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="المخزون والجرد" breadcrumb="المخزون">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            إدارة المخازن ودفتر الأستاذ المخزني (Stock Ledger)
          </h1>
          <p className="text-muted text-xs mt-1">
            متابعة أرصدة المخازن، الأرصدة المحجوزة والمتاحة، وسجل الحركات غير القابل للتعديل.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="default" onClick={() => setIsAdjustModalOpen(true)}>
            <SlidersHorizontal className="w-4 h-4" />
            <span>تسوية مخزنية</span>
          </Button>
          <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل بين المخازن</span>
          </Button>
          <Button variant="soft">
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير كشف الجرد</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي قيمة المخزون الدفتري"
          value={formatCurrency(1465120)}
          subtitle="محسوبة من أصل تكلفة الشراء والنولون"
          icon={<Boxes className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="الكميات المحجوزة للعملاء"
          value="258 وحدة"
          subtitle="محجوزة بفواتير قيد التسليم"
          icon={<AlertTriangle className="w-5 h-5 text-status-amber" />}
        />
        <StatCard
          title="مستودع التوالف والهالك"
          value="14 شيكارة معيبة"
          subtitle="معزولة محاسبياً عن البيع"
          icon={<Building className="w-5 h-5 text-status-red" />}
        />
        <StatCard
          title="دفتر حركات المخزون"
          value="4 حركات اليوم"
          subtitle="Append-Only موثقة بالكامل"
          icon={<History className="w-5 h-5 text-status-green" />}
        />
      </div>

      {/* Tabs and Filter Bar */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-card mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("BALANCES")}
              className={`px-4 py-2 rounded-element text-xs font-bold transition-colors ${
                activeTab === "BALANCES"
                  ? "bg-brand text-white shadow-btn"
                  : "bg-[#f8fafc] text-muted hover:text-foreground border border-border"
              }`}
            >
              أرصدة المخازن المتاحة
            </button>
            <button
              onClick={() => setActiveTab("LEDGER")}
              className={`px-4 py-2 rounded-element text-xs font-bold transition-colors ${
                activeTab === "LEDGER"
                  ? "bg-brand text-white shadow-btn"
                  : "bg-[#f8fafc] text-muted hover:text-foreground border border-border"
              }`}
            >
              دفتر الحركات التراكمي (Movement Log)
            </button>
          </div>

          {/* Warehouse Selector & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-[#f8fafc] border border-border rounded-element py-1.5 px-3 text-xs font-bold text-foreground outline-none focus:border-brand"
            >
              <option value="ALL">جميع المخازن والساحات</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isScrap ? "(توالف)" : ""}
                </option>
              ))}
            </select>

            <div className="relative w-48 hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن مادة..."
                className="w-full bg-[#f8fafc] border border-border rounded-element py-1.5 pr-8 pl-3 text-xs outline-none focus:border-brand"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Warehouse Balances */}
      {activeTab === "BALANCES" && (
        <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-muted border-b border-border">
                  <th className="py-3 px-4 font-bold">كود المادة</th>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">المخزن الحالي</th>
                  <th className="py-3 px-4 font-bold">الرصيد الفعلي</th>
                  <th className="py-3 px-4 font-bold">المحجوز</th>
                  <th className="py-3 px-4 font-bold">المتاح للبيع</th>
                  <th className="py-3 px-4 font-bold">الوحدة</th>
                  <th className="py-3 px-4 font-bold">حالة المخزون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStock.map((item) => {
                  const isLow = item.availableQty <= item.minReorderQty && item.minReorderQty > 0;
                  return (
                    <tr key={item.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-foreground">{item.code}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{item.name}</td>
                      <td className="py-3.5 px-4 text-muted flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-brand" />
                        <span>{item.warehouseName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-foreground">
                        {formatQuantity(item.onHandQty, item.baseUnit)}
                      </td>
                      <td className="py-3.5 px-4 text-status-amber font-bold">
                        {formatQuantity(item.reservedQty, item.baseUnit)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-sm ${
                            isLow ? "text-status-red" : "text-status-green"
                          }`}
                        >
                          {formatQuantity(item.availableQty, item.baseUnit)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted font-semibold">{item.baseUnit}</td>
                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <StatusBadge label="تحت حد الطلب" variant="red" />
                        ) : (
                          <StatusBadge label="رصيد آمن" variant="green" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Ledger Timeline */}
      {activeTab === "LEDGER" && (
        <div className="bg-surface border border-border rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">
                سجل حركات المخزون التراكمي (Immutable Stock Ledger)
              </h3>
              <p className="text-[11px] text-muted">
                كل حركة مسجلة بشكل نهائي مع تحديد نوع الحركة، المستند، والكمية الصادرة أو الواردة.
              </p>
            </div>
            <span className="text-[11px] text-muted font-mono">Total: {movements.length} events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-muted border-b border-border">
                  <th className="py-3 px-4 font-bold">التاريخ والتوقيت</th>
                  <th className="py-3 px-4 font-bold">اسم المادة</th>
                  <th className="py-3 px-4 font-bold">المخزن</th>
                  <th className="py-3 px-4 font-bold">نوع الحركة</th>
                  <th className="py-3 px-4 font-bold">الكمية</th>
                  <th className="py-3 px-4 font-bold">تكلفة الوحدة</th>
                  <th className="py-3 px-4 font-bold">مستند المصدر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => {
                  const isInbound = m.qty > 0;
                  return (
                    <tr key={m.id} className="hover:bg-black/[0.01]">
                      <td className="py-3 px-4 text-muted">{formatDate(m.date)}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{m.productName}</td>
                      <td className="py-3 px-4 text-muted">{m.warehouseName}</td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          label={
                            m.type === "PURCHASE_RECEIPT"
                              ? "استلام مشتريات"
                              : m.type === "SALES_ISSUE"
                              ? "صرف مبيعات"
                              : m.type === "TRANSFER_IN"
                              ? "تحويل وارد"
                              : m.type === "TRANSFER_OUT"
                              ? "تحويل صادر"
                              : m.type === "ADJUSTMENT_ADD"
                              ? "تسوية زيادة"
                              : m.type === "ADJUSTMENT_SUB"
                              ? "تسوية عجز/تلف"
                              : "رصيد افتتاحي"
                          }
                          variant={isInbound ? "green" : "amber"}
                        />
                      </td>
                      <td className="py-3 px-4 font-extrabold">
                        <span className={isInbound ? "text-status-green" : "text-status-red"}>
                          {isInbound ? "+" : ""}
                          {m.qty} {m.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">{formatCurrency(m.unitCost)}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{m.sourceDoc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-foreground mb-1">
              تسوية جردية / إثبات تلف وهالك
            </h3>
            <p className="text-xs text-muted mb-4">
              تسجيل تسوية معتمدة تنشئ حركة في دفتر المخزون دون تعديل الماضي.
            </p>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">المادة</label>
                <select
                  value={selectedProductForAction}
                  onChange={(e) => setSelectedProductForAction(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.productId}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">المخزن</label>
                <select
                  value={actionWarehouseId}
                  onChange={(e) => setActionWarehouseId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">نوع التسوية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("SUB")}
                    className={`p-2 rounded-element text-xs font-bold border transition-colors ${
                      adjustType === "SUB"
                        ? "bg-status-red text-white border-status-red"
                        : "bg-[#f8fafc] text-muted border-border"
                    }`}
                  >
                    عجز / هالك وتلف (- خصم)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("ADD")}
                    className={`p-2 rounded-element text-xs font-bold border transition-colors ${
                      adjustType === "ADD"
                        ? "bg-status-green text-white border-status-green"
                        : "bg-[#f8fafc] text-muted border-border"
                    }`}
                  >
                    زيادة جردية (+ إضافة)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">الكمية</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold outline-none focus:border-brand"
                  placeholder="الكمية بوحدة الأساس..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  سبب التسوية وملاحظات المراجعة
                </label>
                <textarea
                  required
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="مثال: مطابقة الجرد الفعلي لشهر نوفمبر أو كسر أثناء النقل..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ القيد..." : "اعتماد التسوية"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-foreground mb-1">
              تحويل بضاعة بين المخازن
            </h3>
            <p className="text-xs text-muted mb-4">
              نقل كمية من مخزن إلى آخر (مثال: عزل تالف إلى مستودع الهالك).
            </p>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">المادة</label>
                <select
                  value={selectedProductForAction}
                  onChange={(e) => setSelectedProductForAction(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.productId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    المخزن المصدر (صادر)
                  </label>
                  <select
                    value={actionWarehouseId}
                    onChange={(e) => setActionWarehouseId(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    المخزن الوجهة (وارد)
                  </label>
                  <select
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">الكمية المحولة</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold outline-none focus:border-brand"
                  placeholder="الكمية..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">السبب وملاحظات النقل</label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="سبب التحويل..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ التحويل..." : "تأكيد التحويل"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
