"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Save,
  AlertTriangle,
  Building,
  User,
  Calendar,
  CreditCard,
  Truck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { createSalesInvoiceDraft, approveSalesInvoice } from "@/server/actions/sales";

interface ProductOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitId: string;
  defaultPrice: number;
}

const availableProducts: ProductOption[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    code: "PRD-CEM-SWD",
    name: "أسمنت السويدي مقاوم 42.5 (شيكارة 50 كجم)",
    unit: "شيكارة",
    unitId: "u0000000-0000-0000-0000-000000000002",
    defaultPrice: 145.0,
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    code: "PRD-STL-EZZ-10",
    name: "حديد تسليح عز 10 مم مشرشر أطوال",
    unit: "طن",
    unitId: "u0000000-0000-0000-0000-000000000001",
    defaultPrice: 42500.0,
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    code: "PRD-STL-EZZ-12",
    name: "حديد تسليح عز 12 مم مشرشر أطوال",
    unit: "طن",
    unitId: "u0000000-0000-0000-0000-000000000001",
    defaultPrice: 42300.0,
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    code: "PRD-AGG-SND-01",
    name: "رمل محاجر حرش مغسول",
    unit: "متر مكعب",
    unitId: "u0000000-0000-0000-0000-000000000003",
    defaultPrice: 180.0,
  },
];

interface FormLineItem {
  key: string;
  productId: string;
  quantity: number;
  unit: string;
  unitId: string;
  unitPrice: number;
  discount: number;
  total: number;
}

const availableCustomers = [
  {
    id: "cust0000-0000-0000-0000-000000000001",
    name: "شركة المعمار الحديث للمقاولات",
    phone: "01011223344",
    nationalId: "29803120123456",
  },
  {
    id: "cust0000-0000-0000-0000-000000000002",
    name: "مقاولات الشرق (المهندس عادل)",
    phone: "01122334455",
    nationalId: "29007152104567",
  },
];

export default function NewSalesInvoicePage() {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState("c0000000-0000-0000-0000-000000000001");
  const [customerId, setCustomerId] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-11-21");
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [freightCharge, setFreightCharge] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items
  const [lines, setLines] = useState<FormLineItem[]>([
    {
      key: "line-1",
      productId: availableProducts[0].id,
      quantity: 50,
      unit: availableProducts[0].unit,
      unitId: availableProducts[0].unitId,
      unitPrice: availableProducts[0].defaultPrice,
      discount: 0,
      total: 50 * availableProducts[0].defaultPrice,
    },
  ]);

  // Calculations
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const totalAmount = subtotal + freightCharge;
  const remainingBalance = Math.max(0, totalAmount - paidAmount);

  const normalizeCustomerSearch = (value: string) =>
    value
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[^0-9]/g, "");

  const customerSearchNumber = normalizeCustomerSearch(customerSearchTerm);
  const filteredCustomers = availableCustomers.filter((customer) => {
    const textMatches =
      customer.name.includes(customerSearchTerm.trim()) ||
      customer.phone.includes(customerSearchTerm.trim());
    const numberMatches =
      customerSearchNumber.length > 0 &&
      normalizeCustomerSearch(`${customer.phone}${customer.nationalId}`).includes(customerSearchNumber);
    return !customerSearchTerm.trim() || textMatches || numberMatches;
  });

  const handleProductChange = (key: string, newProdId: string) => {
    const prod = availableProducts.find((p) => p.id === newProdId);
    if (!prod) return;

    setLines((prev) =>
      prev.map((line) => {
        if (line.key === key) {
          const total = line.quantity * prod.defaultPrice - line.discount;
          return {
            ...line,
            productId: prod.id,
            unit: prod.unit,
            unitId: prod.unitId,
            unitPrice: prod.defaultPrice,
            total,
          };
        }
        return line;
      })
    );
  };

  const handleQtyPriceChange = (
    key: string,
    field: "quantity" | "unitPrice" | "discount",
    value: number
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key === key) {
          const qty = field === "quantity" ? value : line.quantity;
          const price = field === "unitPrice" ? value : line.unitPrice;
          const disc = field === "discount" ? value : line.discount;
          const total = qty * price - disc;
          return {
            ...line,
            [field]: value,
            total: Math.max(0, total),
          };
        }
        return line;
      })
    );
  };

  const handleAddLine = () => {
    const firstProd = availableProducts[0];
    const newLine: FormLineItem = {
      key: `line-${Date.now()}`,
      productId: firstProd.id,
      quantity: 1,
      unit: firstProd.unit,
      unitId: firstProd.unitId,
      unitPrice: firstProd.defaultPrice,
      discount: 0,
      total: firstProd.defaultPrice,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (key: string) => {
    if (lines.length === 1) {
      alert("يجب أن تحتوي الفاتورة على بند واحد على الأقل");
      return;
    }
    setLines(lines.filter((l) => l.key !== key));
  };

  const handleSubmit = async (shouldApprove = false) => {
    if (lines.length === 0) {
      alert("يرجى إضافة مواد في الفاتورة");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSalesInvoiceDraft({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        branch_id: "b0000000-0000-0000-0000-000000000001",
        warehouse_id: warehouseId,
        customer_id: customerId || null,
        invoice_date: invoiceDate,
        payment_type: paymentType,
        paid_amount: paymentType === "CASH" ? totalAmount : paidAmount,
        freight_charge: freightCharge,
        notes,
        lines: lines.map((l) => ({
          product_id: l.productId,
          entered_quantity: l.quantity,
          entered_unit_id: l.unitId,
          unit_price: l.unitPrice,
          line_discount: l.discount,
        })),
      });

      if (shouldApprove && result.invoiceId) {
        await approveSalesInvoice(result.invoiceId);
        alert(`تم إنشاء واعتماد الفاتورة بنجاح برقم (${result.invoiceNumber}). تم خصم المخزون وقفل التكلفة التاريخية.`);
      } else {
        alert(`تم حفظ مسودة الفاتورة بنجاح برقم (${result.invoiceNumber}).`);
      }

      router.push("/sales");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="إنشاء فاتورة مبيعات جديدة" breadcrumb="المبيعات / فاتورة جديدة">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/sales">
            <Button variant="outline" size="icon">
              <ArrowRight className="w-4 h-4 text-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              تحرير فاتورة مبيعات جديدة
            </h1>
            <p className="text-muted text-xs">
              تسجيل بنود البيع، حساب الأوزان والكميات، والاعتماد الذري لخصم المخزون.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4" />
            <span>حفظ كمسودة</span>
          </Button>
          <Button
            variant="default"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? "جارٍ الاعتماد..." : "اعتماد وصرف المخزون"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Invoice Form & Items (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Details Card */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border">
              بيانات رأس الفاتورة
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brand" />
                  <span>المخزن المنصرف منه</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  <option value="c0000000-0000-0000-0000-000000000001">
                    مخزن الأسمنت والجبس المغطى
                  </option>
                  <option value="c0000000-0000-0000-0000-000000000002">
                    ساحة تشوين حديد التسليح
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-brand" />
                  <span>العميل / المقاول</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="search"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    placeholder="بحث برقم الهاتف أو البطاقة"
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs text-foreground outline-none focus:border-brand"
                  />
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      if (!e.target.value) setPaymentType("CASH");
                    }}
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                  >
                    <option value="">عميل نقدي عام (سداد فوري)</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  <span>تاريخ الفاتورة</span>
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-brand" />
                  <span>طريقة الدفع</span>
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  <option value="CASH">نقدي بالخزينة (فوري)</option>
                  <option value="CREDIT">آجل على حساب العميل</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-brand" />
                  <span>نولون / نقل محمل</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={freightCharge}
                  onChange={(e) => setFreightCharge(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">
                  المبلغ المدفوع مقدماً (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table Card */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-sm font-extrabold text-foreground">
                بنود ومواد الفاتورة
              </h2>
              <Button variant="secondary" size="sm" onClick={handleAddLine}>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة مادة</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-muted border-b border-border">
                    <th className="py-2.5 px-3 font-bold">المادة المطلوبة</th>
                    <th className="py-2.5 px-3 font-bold w-24">الكمية</th>
                    <th className="py-2.5 px-3 font-bold w-20">الوحدة</th>
                    <th className="py-2.5 px-3 font-bold w-32">سعر الوحدة</th>
                    <th className="py-2.5 px-3 font-bold w-24">الخصم</th>
                    <th className="py-2.5 px-3 font-bold w-32">الإجمالي</th>
                    <th className="py-2.5 px-2 text-center w-12">حذف</th>
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
                              {p.name} ({p.code})
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
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.discount}
                          onChange={(e) =>
                            handleQtyPriceChange(
                              line.key,
                              "discount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-[#f8fafc] border border-border rounded-element p-1.5 text-xs font-bold text-foreground outline-none focus:border-brand"
                        />
                      </td>
                      <td className="py-3 px-3 font-extrabold text-foreground">
                        {formatCurrency(line.total)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.key)}
                          className="text-muted hover:text-status-red transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Invoice Financial Summary (1 Col) */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border">
              الملخص المالي للفاتورة
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>مجموع المواد (Subtotal)</span>
                <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>مصاريف النولون / النقل</span>
                <span className="font-bold text-foreground">{formatCurrency(freightCharge)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>ضريبة القيمة المضافة (0% حالياً)</span>
                <span className="font-bold text-foreground">{formatCurrency(0)}</span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                <strong className="font-extrabold text-foreground">الإجمالي المستحق</strong>
                <strong className="font-extrabold text-brand text-base">
                  {formatCurrency(totalAmount)}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted">المدفوع نقداً / بالخزينة</span>
                <span className="font-bold text-status-green">
                  {formatCurrency(paymentType === "CASH" ? totalAmount : paidAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted">المتبقي على حساب العميل</span>
                <span className="font-extrabold text-status-red">
                  {formatCurrency(paymentType === "CASH" ? 0 : remainingBalance)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Button
                variant="default"
                className="w-full"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وصرف المخزون فوري</span>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4" />
                <span>حفظ كمسودة للمراجعة</span>
              </Button>
            </div>
          </div>

          {/* Operational Guard Reminder */}
          <div className="p-4 bg-brand-soft border border-[#ffe2ce] rounded-card text-xs text-foreground leading-relaxed">
            <strong className="text-brand-dark block font-bold mb-1">
              اعتماد فوري ومباشر:
            </strong>
            أول ما تدوس على «اعتماد وصرف المخزون»، السيستم بيخصم الكميات من المخزن فوراً ويثبت سعر البيع وتكلفة البضاعة في لحظتها ويقيد الحسابات بدون أي تضارب.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
