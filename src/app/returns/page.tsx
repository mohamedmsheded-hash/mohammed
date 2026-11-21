"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Wallet,
  FileText,
  X,
  ShieldAlert,
  ArrowDownLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { processSalesReturn } from "@/server/actions/returns";

interface SalesReturnRow {
  id: string;
  return_number: string;
  original_invoice_number: string;
  customer_name: string;
  return_date: string;
  total_refund_amount: number;
  refund_method: "CASH" | "CREDIT";
  cashbox_name?: string;
  reason: string;
  items_summary: string;
  has_damaged_goods: boolean;
  target_warehouse_name: string;
  historical_cogs_reversed: number;
  approved_by_name: string;
}

const initialReturns: SalesReturnRow[] = [
  {
    id: "ret-001",
    return_number: "RET-2026-0015",
    original_invoice_number: "INV-2026-0041",
    customer_name: "عميل نقدي عام (مبيعات حرة)",
    return_date: "2026-11-21",
    total_refund_amount: 1450.0,
    refund_method: "CASH",
    cashbox_name: "خزينة المعرض الرئيسية",
    reason: "تم إرجاع 10 شكائر أسمنت لوجود تمزق وتكتل بالشكائر أثناء التعتيق",
    items_summary: "أسمنت السويدي مقاوم 42.5 (10 شكائر تالفة)",
    has_damaged_goods: true,
    target_warehouse_name: "عنبر التوالف والهالك (WH-SCRAP)",
    historical_cogs_reversed: 1300.0,
    approved_by_name: "أحمد عبد الله (مدير الحسابات)",
  },
  {
    id: "ret-002",
    return_number: "RET-2026-0014",
    original_invoice_number: "INV-2026-0038",
    customer_name: "شركة المعمار الحديث للمقاولات",
    return_date: "2026-11-20",
    total_refund_amount: 85000.0,
    refund_method: "CREDIT",
    reason: "فائض كميات عن حاجة صب السقف بالموقع - بضاعة سليمة بحالة المصنع",
    items_summary: "حديد تسليح عز 10 مم (2 طن سليم)",
    has_damaged_goods: false,
    target_warehouse_name: "ساحة تشوين حديد التسليح",
    historical_cogs_reversed: 82400.0,
    approved_by_name: "أحمد عبد الله (مدير الحسابات)",
  },
];

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<SalesReturnRow[]>(initialReturns);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State for new return
  const [formData, setFormData] = useState({
    invoice_number: "INV-2026-0042",
    customer_name: "شركة المعمار الحديث للمقاولات",
    return_date: new Date().toISOString().split("T")[0],
    product_name: "حديد تسليح عز 10 مم مشرشر أطوال",
    returned_qty: 1,
    unit_price: 42500,
    historical_unit_cost: 41200,
    is_damaged: false,
    refund_method: "CREDIT" as "CASH" | "CREDIT",
    cashbox_id: "cb-001",
    reason: "",
  });

  const filteredReturns = returnsList.filter((item) => {
    const matchesSearch =
      item.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.includes(searchTerm) ||
      item.reason.includes(searchTerm);

    const matchesMethod = methodFilter === "ALL" || item.refund_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalRefundAmount = returnsList.reduce((sum, r) => sum + r.total_refund_amount, 0);
  const totalDamagedCount = returnsList.filter((r) => r.has_damaged_goods).length;
  const totalCogsReversed = returnsList.reduce((sum, r) => sum + r.historical_cogs_reversed, 0);

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || formData.reason.length < 3) {
      alert("برجاء إدخال سبب المرتجع بالتفصيل لضمان الامتثال المحاسبي");
      return;
    }

    const lineTotalRefund = formData.returned_qty * formData.unit_price;
    const lineHistoricalCogs = formData.returned_qty * formData.historical_unit_cost;

    const newReturn: SalesReturnRow = {
      id: `ret-${Date.now()}`,
      return_number: `RET-2026-00${returnsList.length + 16}`,
      original_invoice_number: formData.invoice_number,
      customer_name: formData.customer_name,
      return_date: formData.return_date,
      total_refund_amount: lineTotalRefund,
      refund_method: formData.refund_method,
      cashbox_name: formData.refund_method === "CASH" ? "خزينة المعرض الرئيسية" : undefined,
      reason: formData.reason,
      items_summary: `${formData.product_name} (${formData.returned_qty} ${formData.is_damaged ? "تالف" : "سليم"})`,
      has_damaged_goods: formData.is_damaged,
      target_warehouse_name: formData.is_damaged
        ? "عنبر التوالف والهالك (WH-SCRAP)"
        : "ساحة تشوين حديد التسليح",
      historical_cogs_reversed: lineHistoricalCogs,
      approved_by_name: "أحمد عبد الله (مدير الحسابات)",
    };

    setReturnsList([newReturn, ...returnsList]);
    setIsModalOpen(false);
    setFormData({
      invoice_number: "INV-2026-0042",
      customer_name: "شركة المعمار الحديث للمقاولات",
      return_date: new Date().toISOString().split("T")[0],
      product_name: "حديد تسليح عز 10 مم مشرشر أطوال",
      returned_qty: 1,
      unit_price: 42500,
      historical_unit_cost: 41200,
      is_damaged: false,
      refund_method: "CREDIT",
      cashbox_id: "cb-001",
      reason: "",
    });
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المرتجعات والإلغاءات" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-7 h-7 text-primary" />
              إدارة المرتجعات والتسويات المخزنية والمالية
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              إرجاع بضاعة بربط ذري بالفاتورة الأصلية، عزل الهالك إلى مخزن التوالف، والحفاظ على ثبات التكلفة التاريخية
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>تسجيل إذن مرتجع مبيعات</span>
          </Button>
        </div>

        {/* Invariant Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">القيد المحاسبي الإلزامي (Historical Cost & Scrap Segregation):</span>
            <p className="leading-relaxed">
              1. يعاد إدراج البضاعة المرتجعة بنفس التكلفة التاريخية التي خرجت بها من طبقة FIFO يوم البيع، ولا تتأثر أبداً بأسعار السوق اليوم.
              <br />
              2. البضاعة التالفة أو المعيبة يتم توجيهها إجبارياً إلى مخزن التوالف (WH-SCRAP) ولا تدخل في رصيد المتاح للبيع إطلاقاً.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي مبالغ المرتجعات"
            value={formatCurrency(totalRefundAmount)}
            subtitle="مردودات مبيعات محصلة"
            icon={ArrowDownLeft}
            color="primary"
          />
          <StatCard
            title="تكلفة البضاعة المستردة"
            value={formatCurrency(totalCogsReversed)}
            subtitle="معادة لطبقات المخزون"
            icon={Boxes}
            color="neutral"
          />
          <StatCard
            title="مرتجعات معيبة / تالفة"
            value={totalDamagedCount}
            subtitle="معزولة في مخزن التوالف"
            icon={AlertTriangle}
            color="warning"
          />
          <StatCard
            title="المرتجعات السليمة"
            value={returnsList.length - totalDamagedCount}
            subtitle="أعيدت للرصيد المتاح للبيع"
            icon={CheckCircle2}
            color="success"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم المرتجع، الفاتورة الأصلية، العميل، أو سبب الإرجاع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[160px]"
            >
              <option value="ALL">جميع طرق التسوية</option>
              <option value="CREDIT">خصم من مديونية العميل (Credit)</option>
              <option value="CASH">رد نقدي فوري من الخزينة (Cash)</option>
            </select>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم المرتجع والتاريخ</th>
                  <th className="py-3 px-4">الفاتورة الأصلية والعميل</th>
                  <th className="py-3 px-4">الأصناف المرتجعة</th>
                  <th className="py-3 px-4">المخزن الوجهة والتصنيف</th>
                  <th className="py-3 px-4">قيمة الرد المالي</th>
                  <th className="py-3 px-4">طريقة التسوية</th>
                  <th className="py-3 px-4">التكلفة التاريخية المستردة</th>
                  <th className="py-3 px-4">المعتمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900">{item.return_number}</div>
                      <div className="text-gray-400 text-[11px]">{item.return_date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800">{item.customer_name}</div>
                      <div className="text-primary font-mono text-[11px]">
                        فاتورة: {item.original_invoice_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900">{item.items_summary}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5 line-clamp-1 italic">
                        &quot;{item.reason}&quot;
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.has_damaged_goods ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          عزل بهالك: {item.target_warehouse_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          سليم: {item.target_warehouse_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 font-mono text-sm">
                      {formatCurrency(item.total_refund_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.refund_method === "CREDIT" ? (
                        <span className="inline-block text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                          خصم مديونية
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                          صرف نقدي من الخزينة
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700 font-semibold">
                      {formatCurrency(item.historical_cogs_reversed)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {item.approved_by_name}
                    </td>
                  </tr>
                ))}

                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <RotateCcw className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      لا توجد أذونات مرتجعات مطابقة لمعايير البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">تحرير إذن مرتجع مبيعات جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  فاتورة المبيعات الأصلية المعتمدة *
                </label>
                <select
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                >
                  <option value="INV-2026-0042">INV-2026-0042 - شركة المعمار الحديث (حديد تسليح عز 10 مم)</option>
                  <option value="INV-2026-0041">INV-2026-0041 - عميل نقدي عام (أسمنت السويدي مقاوم)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الكمية المراد إرجاعها *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.returned_qty}
                    onChange={(e) => setFormData({ ...formData, returned_qty: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    طريقة التسوية المالية *
                  </label>
                  <select
                    value={formData.refund_method}
                    onChange={(e) => setFormData({ ...formData, refund_method: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="CREDIT">خصم من مديونية العميل (حساب آجل)</option>
                    <option value="CASH">رد نقدي فوري من الخزينة</option>
                  </select>
                </div>
              </div>

              {/* Damaged Goods Toggle (Scrap Segregation Invariant) */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-gray-900">
                      هل البضاعة المرتجعة بها عيوب أو تالفة؟
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="damaged_check"
                    checked={formData.is_damaged}
                    onChange={(e) => setFormData({ ...formData, is_damaged: e.target.checked })}
                    className="w-4 h-4 text-primary rounded-sm border-gray-300 focus:ring-primary"
                  />
                </div>
                <p className="text-[11px] text-gray-600">
                  {formData.is_damaged ? (
                    <span className="text-rose-700 font-bold">
                      سيتم عزل البضاعة تلقائياً في مخزن التوالف (WH-SCRAP) ولن تُضاف للمخزون الصالح للبيع.
                    </span>
                  ) : (
                    <span>
                      البضاعة سليمة وستُعاد إلى المخزن الرئيسي وتُدرج في طبقات التكلفة FIFO بالتكلفة التاريخية الأصلية.
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  سبب الإرجاع بالتفصيل (مطلوب للتدقيق الداخلي) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="مثال: فحص البضاعة بالموقع وكشف تلف الغلاف أو فائض كميات..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Calculation Preview */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>سعر البيع التاريخي للوحدة:</span>
                  <span className="font-mono">{formatCurrency(formData.unit_price)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-200">
                  <span>إجمالي المبلغ المسترد:</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(formData.returned_qty * formData.unit_price)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                  اعتماد المرتجع وإصدار القيد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
