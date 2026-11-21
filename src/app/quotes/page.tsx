"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Lock,
  Calendar,
  X,
  FileCheck,
  Receipt,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuoteRow {
  id: string;
  quote_number: string;
  customer_name: string;
  quote_date: string;
  expiry_date: string;
  items_summary: string;
  total_amount: number;
  is_stock_reserved: boolean;
  status: "ACTIVE" | "EXPIRED" | "CONVERTED" | "REJECTED";
  created_by_name: string;
  converted_invoice_number?: string;
  notes?: string;
}

const initialQuotes: QuoteRow[] = [
  {
    id: "quo-001",
    quote_number: "QUO-2026-0045",
    customer_name: "شركة المعمار الحديث للمقاولات",
    quote_date: "2026-11-21",
    expiry_date: "2026-11-23", // 48-hour validity
    items_summary: "حديد تسليح عز 10 مم مشرشر (10 طن) + 12 مم (15 طن)",
    total_amount: 1058000,
    is_stock_reserved: true,
    status: "ACTIVE",
    created_by_name: "سارة حسن (كاشير)",
    notes: "سعر الحديد مربوط بسعر مصنع عز اليوم - صالح لمدة 48 ساعة فقط",
  },
  {
    id: "quo-002",
    quote_number: "QUO-2026-0044",
    customer_name: "مؤسسة الأمل للتشييد والتعمير",
    quote_date: "2026-11-20",
    expiry_date: "2026-11-22",
    items_summary: "أسمنت السويدي مقاوم 42.5 (300 شيكارة)",
    total_amount: 43500,
    is_stock_reserved: true,
    status: "ACTIVE",
    created_by_name: "أحمد عبد الله (محاسب)",
    notes: "حجز كميات صب الأساسات لمشروع المعادي",
  },
  {
    id: "quo-003",
    quote_number: "QUO-2026-0041",
    customer_name: "شركة الصفوة للاستثمار العقاري",
    quote_date: "2026-11-18",
    expiry_date: "2026-11-20",
    items_summary: "حديد تسليح عز 10 مم (5 طن)",
    total_amount: 212500,
    is_stock_reserved: false,
    status: "CONVERTED",
    created_by_name: "سارة حسن (كاشير)",
    converted_invoice_number: "INV-2026-0042",
    notes: "تم التحويل بنجاح لفاتورة مبيعات معتمدة",
  },
  {
    id: "quo-004",
    quote_number: "QUO-2026-0038",
    customer_name: "مقاولات المهندس سامح فخري",
    quote_date: "2026-11-15",
    expiry_date: "2026-11-17",
    items_summary: "رمل حرش محاجر (40 م³)",
    total_amount: 16000,
    is_stock_reserved: false,
    status: "EXPIRED",
    created_by_name: "سارة حسن (كاشير)",
    notes: "انتهت فترة السريان ولم يتم تأكيد التعاقد - أفرج عن الحجز آلياً",
  },
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: "شركة المعمار الحديث للمقاولات",
    expiry_hours: "48",
    product_name: "حديد تسليح عز 10 مم مشرشر أطوال",
    quantity: 10,
    unit_price: 42500,
    is_stock_reserved: true,
    notes: "السعر صالح لمدة 48 ساعة فقط ومربوط بسعر أرض المصنع",
  });

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer_name.includes(searchTerm) ||
      (q.notes && q.notes.includes(searchTerm));
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = quotes.filter((q) => q.status === "ACTIVE").length;
  const activeValue = quotes
    .filter((q) => q.status === "ACTIVE")
    .reduce((sum, q) => sum + q.total_amount, 0);
  const reservedStockCount = quotes.filter((q) => q.is_stock_reserved && q.status === "ACTIVE").length;
  const convertedCount = quotes.filter((q) => q.status === "CONVERTED").length;
  const conversionRate = quotes.length > 0 ? (convertedCount / quotes.length) * 100 : 0;

  const handleConvertToInvoice = (quote: QuoteRow) => {
    if (
      !confirm(
        `هل تريد تحويل عرض السعر ${quote.quote_number} للعميل ${quote.customer_name} إلى فاتورة مبيعات مباشرة؟`
      )
    ) {
      return;
    }

    const newInvoiceNum = `INV-2026-00${Math.floor(Math.random() * 90 + 50)}`;
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id
          ? {
              ...q,
              status: "CONVERTED",
              is_stock_reserved: false,
              converted_invoice_number: newInvoiceNum,
            }
          : q
      )
    );
    alert(`تم تحويل عرض السعر إلى فاتورة مبيعات جديدة رقم: ${newInvoiceNum}`);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const expDate = new Date();
    expDate.setHours(today.getHours() + Number(formData.expiry_hours));

    const total = formData.quantity * formData.unit_price;

    const newQuote: QuoteRow = {
      id: `quo-${Date.now()}`,
      quote_number: `QUO-2026-00${quotes.length + 46}`,
      customer_name: formData.customer_name,
      quote_date: today.toISOString().split("T")[0],
      expiry_date: expDate.toISOString().split("T")[0],
      items_summary: `${formData.product_name} (${formData.quantity})`,
      total_amount: total,
      is_stock_reserved: formData.is_stock_reserved,
      status: "ACTIVE",
      created_by_name: "أحمد عبد الله (محاسب)",
      notes: formData.notes,
    };

    setQuotes([newQuote, ...quotes]);
    setIsModalOpen(false);
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "عروض الأسعار والحجوزات" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-primary" />
              عروض الأسعار وحجوزات بضاعة مواد البناء
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              إصدار عروض أسعار محددة الصلاحية زمنياً (48 ساعة للحديد/الأسمنت) مع حجز الكميات وتحويل مباشر لفواتير بيع
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>عرض سعر / حجز جديد</span>
          </Button>
        </div>

        {/* Invariant Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">قاعدة حجز البضاعة في المخزن:</span>
            <p className="leading-relaxed">
              لما تختار &quot;حجز البضاعة بالمخزن&quot;، الكمية بتتحسب فوراً كـ (بضاعة محجوزة) والرصيد المتاح للبيع بيقل تلقائياً عشان متتبعش لعميل تاني، بس مبتتصرفش فعلياً من المخزن ولا بتتسجل مبيعات إلا لما تعتمد الفاتورة رسمياً. ولو مدة العرض انتهت من غير بيع، البضاعة بترجع متاحة للبيع لوحدها.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="عروض أسعار سارية"
            value={activeCount}
            subtitle="قيد تفاوض العملاء"
            icon={Clock}
            color="primary"
          />
          <StatCard
            title="إجمالي قيمة العروض النشطة"
            value={formatCurrency(activeValue)}
            subtitle="فرص بيع مرتقبة"
            icon={FileSpreadsheet}
            color="neutral"
          />
          <StatCard
            title="حجوزات مخزون مؤكدة"
            value={reservedStockCount}
            subtitle="كميات محجوزة مؤقتاً"
            icon={Boxes}
            color="warning"
          />
          <StatCard
            title="نسبة التحويل لفواتير"
            value={`${conversionRate.toFixed(1)}%`}
            subtitle="معدل قبول العروض"
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
              placeholder="بحث برقم العرض، اسم العميل، أو تفاصيل الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[170px]"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">سارٍ وفعال (Active)</option>
              <option value="CONVERTED">تم تحويله لفاتورة (Converted)</option>
              <option value="EXPIRED">منتهي الصلاحية (Expired)</option>
              <option value="REJECTED">مرفوض (Rejected)</option>
            </select>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم العرض والتاريخ</th>
                  <th className="py-3 px-4">العميل / المقاول</th>
                  <th className="py-3 px-4">الأصناف والكميات</th>
                  <th className="py-3 px-4">تاريخ انتهاء السريان</th>
                  <th className="py-3 px-4">إجمالي القيمة التقديرية</th>
                  <th className="py-3 px-4">حجز المخزون</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900 text-sm">{quote.quote_number}</div>
                      <div className="text-gray-400 text-[11px]">{quote.quote_date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{quote.customer_name}</div>
                      {quote.notes && (
                        <div className="text-gray-500 text-[11px] italic mt-0.5 line-clamp-1">
                          &quot;{quote.notes}&quot;
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 font-medium max-w-xs">
                      {quote.items_summary}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1 font-bold text-gray-800">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {quote.expiry_date}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-sm">
                      {formatCurrency(quote.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {quote.is_stock_reserved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Lock className="w-3 h-3" />
                          محجوز بالمخزن
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">غير محجوز</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {quote.status === "ACTIVE" && (
                        <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          سارٍ وفعال
                        </span>
                      )}
                      {quote.status === "CONVERTED" && (
                        <div className="space-y-0.5">
                          <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            تم التحويل لفاتورة
                          </span>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {quote.converted_invoice_number}
                          </div>
                        </div>
                      )}
                      {quote.status === "EXPIRED" && (
                        <span className="inline-block text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          منتهي الصلاحية
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {quote.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToInvoice(quote)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs px-2.5 py-1 flex items-center gap-1 shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>تحويل لفاتورة</span>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">تحرير عرض سعر وحجز بضاعة جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  العميل / المقاول *
                </label>
                <select
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                >
                  <option value="شركة المعمار الحديث للمقاولات">شركة المعمار الحديث للمقاولات</option>
                  <option value="مؤسسة الأمل للتشييد والتعمير">مؤسسة الأمل للتشييد والتعمير</option>
                  <option value="شركة الصفوة للاستثمار العقاري">شركة الصفوة للاستثمار العقاري</option>
                  <option value="عميل نقدي عام (مشروع خاص)">عميل نقدي عام (مشروع خاص)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    مدة سريان العرض *
                  </label>
                  <select
                    value={formData.expiry_hours}
                    onChange={(e) => setFormData({ ...formData, expiry_hours: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white font-semibold"
                  >
                    <option value="24">24 ساعة (عاجل - حديد/أسمنت)</option>
                    <option value="48">48 ساعة (افتراضي سوق مواد البناء)</option>
                    <option value="72">72 ساعة (3 أيام)</option>
                    <option value="168">أسبوع كامل (رمل وطوب)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الصنف المطلوب *
                  </label>
                  <select
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="حديد تسليح عز 10 مم مشرشر أطوال">حديد تسليح عز 10 مم (طن)</option>
                    <option value="حديد تسليح عز 12 مم مشرشر أطوال">حديد تسليح عز 12 مم (طن)</option>
                    <option value="أسمنت السويدي مقاوم 42.5">أسمنت السويدي مقاوم (شيكارة)</option>
                    <option value="رمل حرش محاجر فاخر">رمل حرش محاجر (متر مكعب)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الكمية المطلوبة *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    سعر الوحدة المعروض (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Stock Reservation Option */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_stock_reserved}
                    onChange={(e) => setFormData({ ...formData, is_stock_reserved: e.target.checked })}
                    className="w-4 h-4 text-primary rounded-sm border-gray-300 focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-gray-900">
                    حجز الكمية بالمخزن (تخصيص رصيد محجوز لحين التحويل)
                  </span>
                </label>
                <p className="text-[11px] text-gray-600 pr-6">
                  يمنع بيع هذه الكمية لأي عميل آخر طوال فترة سريان العرض حتى لا يحدث عجز عند الحضور للتنفيذ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  شروط العرض والملاحظات
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Total Preview */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">إجمالي قيمة عرض السعر:</span>
                <span className="font-mono font-bold text-primary text-base">
                  {formatCurrency(formData.quantity * formData.unit_price)}
                </span>
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
                  حفظ وإصدار عرض السعر
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
