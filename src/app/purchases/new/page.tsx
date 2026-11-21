"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Building2,
  Truck,
  Scale,
  DollarSign,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { createGoodsReceiptAction } from "@/server/actions/purchases";

interface ProductOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitId: string;
}

const availableProducts: ProductOption[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    code: "PRD-CEM-SWD",
    name: "أسمنت السويدي مقاوم 42.5 (شيكارة 50 كجم)",
    unit: "شيكارة",
    unitId: "u0000000-0000-0000-0000-000000000002",
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    code: "PRD-STL-EZZ-10",
    name: "حديد تسليح عز 10 مم مشرشر أطوال",
    unit: "طن",
    unitId: "u0000000-0000-0000-0000-000000000001",
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    code: "PRD-STL-EZZ-12",
    name: "حديد تسليح عز 12 مم مشرشر أطوال",
    unit: "طن",
    unitId: "u0000000-0000-0000-0000-000000000001",
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    code: "PRD-AGG-SND-01",
    name: "رمل محاجر حرش مغسول",
    unit: "متر مكعب",
    unitId: "u0000000-0000-0000-0000-000000000003",
  },
];

interface ReceiptLine {
  key: string;
  productId: string;
  quantity: number;
  unit: string;
  unitId: string;
  unitPrice: number;
  total: number;
}

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("sup00000-0000-0000-0000-000000000001");
  const [warehouseId, setWarehouseId] = useState("c0000000-0000-0000-0000-000000000002");
  const [receiptDate, setReceiptDate] = useState("2026-11-21");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [grossWeight, setGrossWeight] = useState(0);
  const [tareWeight, setTareWeight] = useState(0);

  // Landed costs expenses
  const [freightAmount, setFreightAmount] = useState(3500);
  const [unloadingAmount, setUnloadingAmount] = useState(800);
  const [weighingAmount, setWeighingAmount] = useState(150);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lines
  const [lines, setLines] = useState<ReceiptLine[]>([
    {
      key: "line-1",
      productId: availableProducts[2].id, // Steel 12mm
      quantity: 20,
      unit: availableProducts[2].unit,
      unitId: availableProducts[2].unitId,
      unitPrice: 41000,
      total: 20 * 41000,
    },
  ]);

  const netWeightCalculated = Math.max(0, grossWeight - tareWeight);
  const baseMaterialsTotal = lines.reduce((sum, l) => sum + l.total, 0);
  const totalLandedExpenses = freightAmount + unloadingAmount + weighingAmount;
  const totalLandedCost = baseMaterialsTotal + totalLandedExpenses;

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const extraCostPerUnit = totalQuantity > 0 ? totalLandedExpenses / totalQuantity : 0;

  const handleProductChange = (key: string, prodId: string) => {
    const prod = availableProducts.find((p) => p.id === prodId);
    if (!prod) return;

    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              productId: prod.id,
              unit: prod.unit,
              unitId: prod.unitId,
              total: l.quantity * l.unitPrice,
            }
          : l
      )
    );
  };

  const handleQtyPriceChange = (
    key: string,
    field: "quantity" | "unitPrice",
    val: number
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          const qty = field === "quantity" ? val : l.quantity;
          const price = field === "unitPrice" ? val : l.unitPrice;
          return {
            ...l,
            [field]: val,
            total: qty * price,
          };
        }
        return l;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("يرجى إضافة صنف واحد على الأقل");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenses = [];
      if (freightAmount > 0) {
        expenses.push({ expense_type: "FREIGHT" as const, amount: freightAmount });
      }
      if (unloadingAmount > 0) {
        expenses.push({ expense_type: "UNLOADING_MASHAL" as const, amount: unloadingAmount });
      }
      if (weighingAmount > 0) {
        expenses.push({ expense_type: "WEIGHING" as const, amount: weighingAmount });
      }

      const result = await createGoodsReceiptAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        warehouse_id: warehouseId,
        supplier_id: supplierId,
        supplier_invoice_ref: supplierInvoiceRef,
        receipt_date: receiptDate,
        truck_plate: truckPlate,
        gross_weight_kg: grossWeight,
        tare_weight_kg: tareWeight,
        net_weight_kg: netWeightCalculated,
        notes,
        lines: lines.map((l) => ({
          product_id: l.productId,
          received_qty: l.quantity,
          entered_unit_id: l.unitId,
          purchase_unit_price: l.unitPrice,
        })),
        expenses,
      });

      alert(
        `تم تسجيل إذن الاستلام (${result.receiptNumber}) وحساب تكلفة البضاعة شاملة النولون والعتالة وإضافتها للمخزن بنجاح.`
      );
      router.push("/purchases");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="تسجيل استلام بضاعة وتوريد" breadcrumb="المشتريات / استلام جديد">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/purchases">
            <Button variant="outline" size="icon">
              <ArrowRight className="w-4 h-4 text-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              تسجيل إذن استلام بضاعة ومصاريف التوريد
            </h1>
            <p className="text-muted text-xs">
              مطابقة أوزان البسكول، توزيع النولون والعتالة، وإضافة رصيد البضاعة للمخزن بتكلفتها الفعلية.
            </p>
          </div>
        </div>

        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? "جارٍ الترحيل..." : "اعتماد وترحيل الاستلام"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border">
              بيانات المورد والشحنة
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-brand" />
                  <span>المورد / المصنع</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  <option value="sup00000-0000-0000-0000-000000000001">
                    شركة العز لصناعة حديد التسليح
                  </option>
                  <option value="sup00000-0000-0000-0000-000000000002">
                    شركة السويدي للأسمنت
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-brand" />
                  <span>المخزن المستلم</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  <option value="c0000000-0000-0000-0000-000000000002">
                    ساحة تشوين حديد التسليح
                  </option>
                  <option value="c0000000-0000-0000-0000-000000000001">
                    مخزن الأسمنت والجبس المغطى
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">تاريخ الاستلام الفعلي</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">رقم بوليصة / فاتورة المورد</label>
                <input
                  type="text"
                  placeholder="INV-SUP-8954"
                  value={supplierInvoiceRef}
                  onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Weighbridge Card */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand" />
              <span>بيانات الشاحنة والميزان البسكول</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-muted" />
                  <span>رقم لوحة الشاحنة</span>
                </label>
                <input
                  type="text"
                  placeholder="أ ب ج 1234"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">الوزن القائم (كجم)</label>
                <input
                  type="number"
                  placeholder="مثال: 45000"
                  value={grossWeight || ""}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">الوزن الفارغ (كجم)</label>
                <input
                  type="number"
                  placeholder="مثال: 15000"
                  value={tareWeight || ""}
                  onChange={(e) => setTareWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">الوزن الصافي المعتمد</label>
                <div className="p-2 bg-[#f8fafc] border border-border rounded-element text-xs font-extrabold text-status-green">
                  {(netWeightCalculated / 1000).toFixed(3)} طن ({netWeightCalculated} كجم)
                </div>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border">
              أصناف البضاعة المستلمة
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-muted border-b border-border">
                    <th className="py-2.5 px-3 font-bold">المادة الموردة</th>
                    <th className="py-2.5 px-3 font-bold w-28">الكمية</th>
                    <th className="py-2.5 px-3 font-bold w-20">الوحدة</th>
                    <th className="py-2.5 px-3 font-bold w-36">سعر الشراء للوحدة</th>
                    <th className="py-2.5 px-3 font-bold w-36">الإجمالي الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td className="py-3 px-3">
                        <select
                          value={line.productId}
                          onChange={(e) => handleProductChange(line.key, e.target.value)}
                          className="w-full bg-[#f8fafc] border border-border rounded-element p-1.5 text-xs font-bold text-foreground outline-none focus:border-brand"
                        >
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={line.quantity}
                          onChange={(e) =>
                            handleQtyPriceChange(
                              line.key,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-[#f8fafc] border border-border rounded-element p-1.5 text-xs font-bold text-foreground outline-none focus:border-brand"
                        />
                      </td>
                      <td className="py-3 px-3 font-bold text-muted">{line.unit}</td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleQtyPriceChange(
                              line.key,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-[#f8fafc] border border-border rounded-element p-1.5 text-xs font-bold text-foreground outline-none focus:border-brand"
                        />
                      </td>
                      <td className="py-3 px-3 font-extrabold text-foreground">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Landed Costs Breakdown (1 Col) */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>مصاريف التوريد والنولون والعتالة</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1">
                  نولون ونقل الشاحنة (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">
                  عتالة ومشال تفريغ (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={unloadingAmount}
                  onChange={(e) => setUnloadingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">
                  رسوم الميزان البسكول (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={weighingAmount}
                  onChange={(e) => setWeighingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-muted">
                  <span>سعر شراء البضاعة الصافي:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(baseMaterialsTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>إجمالي مصاريف التوريد:</span>
                  <span className="font-bold text-status-blue">
                    +{formatCurrency(totalLandedExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>إضافة التكلفة للوحدة:</span>
                  <span className="font-bold text-brand">
                    +{extraCostPerUnit.toFixed(2)} ج.م / وحدة
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                  <strong className="font-extrabold text-foreground">
                    إجمالي تكلفة الشحنة الشاملة
                  </strong>
                  <strong className="font-extrabold text-brand text-base">
                    {formatCurrency(totalLandedCost)}
                  </strong>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full mt-6"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "جارٍ الترحيل..." : "ترحيل الاستلام وتوليد الطبقة"}</span>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
