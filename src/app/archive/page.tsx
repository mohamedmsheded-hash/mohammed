"use client";

import React, { useState } from "react";
import {
  Archive,
  Search,
  Filter,
  FileText,
  Calendar,
  Lock,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Hash,
  Paperclip,
  Printer,
  X,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ArchivedDocument {
  id: string;
  doc_number: string;
  doc_type: "SALES_INVOICE" | "PURCHASE_RECEIPT" | "DELIVERY_POD" | "SALES_RETURN";
  fiscal_year: number;
  doc_date: string;
  party_name: string; // Customer or Supplier
  total_amount: number;
  cogs_locked: number;
  status: string;
  sha256_hash: string;
  attachments_count: number;
  timeline: Array<{
    title: string;
    timestamp: string;
    user: string;
    description: string;
  }>;
  lines: Array<{
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    unit_cost: number;
    total: number;
  }>;
}

const archivedRecords: ArchivedDocument[] = [
  {
    id: "arc-001",
    doc_number: "INV-2026-0042",
    doc_type: "SALES_INVOICE",
    fiscal_year: 2026,
    doc_date: "2026-11-21",
    party_name: "شركة المعمار الحديث للمقاولات",
    total_amount: 428500,
    cogs_locked: 412000,
    status: "APPROVED_AND_LOCKED",
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    attachments_count: 2,
    timeline: [
      {
        title: "إنشاء مسودة الفاتورة",
        timestamp: "2026-11-21 09:30:15",
        user: "سارة حسن (كاشير)",
        description: "تسجيل كميات وأسعار البيع المتفق عليها بخصم معتمد 0%",
      },
      {
        title: "الاعتماد الذري وقفل التكلفة (ACID Approval)",
        timestamp: "2026-11-21 09:32:00",
        user: "أحمد عبد الله (مدير الحسابات)",
        description: "خصم طبقات FIFO لمستودع الحديد وقفل COGS بمبلغ 412,000 ج.م وتسجيل أثر مديونية العميل",
      },
      {
        title: "إصدار أمر التوصيل وجدولة الشاحنة",
        timestamp: "2026-11-21 10:15:00",
        user: "محمود إبراهيم (أمين مخزن)",
        description: "إصدار DEL-2026-0089 وتخصيص الشاحنة مرسيدس أكتروس ط س ر 7841 بقيادة محمد رجب",
      },
      {
        title: "التسليم بالموقع وإثبات التسليم (POD)",
        timestamp: "2026-11-21 12:45:00",
        user: "النظام (عبر السائق)",
        description: "تسليم البضاعة لموقع كمبوند زهرة العاصمة وإرفاق توقيع المهندس مصطفى",
      },
    ],
    lines: [
      {
        product_name: "حديد تسليح عز 10 مم مشرشر أطوال",
        quantity: 10,
        unit: "طن",
        unit_price: 42500,
        unit_cost: 41200,
        total: 425000,
      },
    ],
  },
  {
    id: "arc-002",
    doc_number: "RCPT-2026-0031",
    doc_type: "PURCHASE_RECEIPT",
    fiscal_year: 2026,
    doc_date: "2026-11-20",
    party_name: "شركة السويدي للأسمنت وبطائن العزل",
    total_amount: 130000,
    cogs_locked: 130000,
    status: "APPROVED_AND_LOCKED",
    sha256_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    attachments_count: 3,
    timeline: [
      {
        title: "وصول الشاحنة ووزن ميزان البسكول",
        timestamp: "2026-11-20 07:10:00",
        user: "خالد صابر (أمين مخزن)",
        description: "وزن قائم 65.500 طن، وزن فارغ 15.500 طن، صافي 50.000 طن (1000 شيكارة)",
      },
      {
        title: "توزيع النولون والعتالة واعتماد التوريد",
        timestamp: "2026-11-20 08:00:00",
        user: "أحمد عبد الله (مدير الحسابات)",
        description: "تحميل نولون 5,000 ج.م وتوليد طبقة FIFO جديدة بتكلفة 130 ج.م للشيكارة",
      },
    ],
    lines: [
      {
        product_name: "أسمنت السويدي مقاوم 42.5",
        quantity: 1000,
        unit: "شيكارة",
        unit_price: 125,
        unit_cost: 130,
        total: 130000,
      },
    ],
  },
];

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("2026");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState<ArchivedDocument | null>(null);

  const filteredDocs = archivedRecords.filter((d) => {
    const matchesSearch =
      d.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.party_name.includes(searchTerm) ||
      d.sha256_hash.includes(searchTerm);
    const matchesYear = yearFilter === "ALL" || d.fiscal_year.toString() === yearFilter;
    const matchesType = typeFilter === "ALL" || d.doc_type === typeFilter;
    return matchesSearch && matchesYear && matchesType;
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأرشيف التاريخي لـ 10 سنوات" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Archive className="w-7 h-7 text-primary" />
              الأرشيف التاريخي الرقمي المقفل (سجل حفظ لـ 10 سنوات)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              استرجاع كامل لمستندات المعاملات القديمة، المرفقات الموقعة، التايم لاين، وبصمات التحقق الرقمي SHA-256
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => alert("جاري تصدير الحزمة الأرشيفية الموثقة للسنة المالية...")}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>تصدير حزمة الأرشيف الشاملة (ZIP)</span>
          </Button>
        </div>

        {/* Invariant Banner */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex items-start gap-3 border border-slate-800 shadow-md">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-sm text-white">
              مبدأ الحفظ الأرشيفي غير القابل للتعديل (WORM - Write Once, Read Many):
            </span>
            <p className="text-slate-300 leading-relaxed">
              جميع الفواتير وأذونات الصرف والاستلام المعتمدة يتم توليد بصمة تجزئة مشفرة لها (SHA-256) وقت الاعتماد وتُحفظ مع بياناتها التاريخية والمرفقات بجدول زمني لا يقل عن 10 سنوات امتثالاً للقوانين الضريبية والرقابية.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم المستند، اسم العميل أو المورد، أو بصمة التجزئة SHA-256..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-primary bg-white"
            >
              <option value="ALL">جميع السنوات المالية</option>
              <option value="2026">السنة المالية 2026</option>
              <option value="2025">السنة المالية 2025</option>
              <option value="2024">السنة المالية 2024</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-primary bg-white min-w-[150px]"
            >
              <option value="ALL">جميع أنواع المستندات</option>
              <option value="SALES_INVOICE">فاتورة مبيعات</option>
              <option value="PURCHASE_RECEIPT">إذن استلام مشتريات</option>
              <option value="DELIVERY_POD">إثبات تسليم (POD)</option>
              <option value="SALES_RETURN">مرتجع مبيعات</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم المستند والنوع</th>
                  <th className="py-3 px-4">الطرف الثاني (العميل / المورد)</th>
                  <th className="py-3 px-4">تاريخ المستند</th>
                  <th className="py-3 px-4">القيمة الإجمالية</th>
                  <th className="py-3 px-4">التكلفة التاريخية المقفلة</th>
                  <th className="py-3 px-4">المرفقات والوثائق</th>
                  <th className="py-3 px-4">بصمة التحقق (SHA-256)</th>
                  <th className="py-3 px-4">عرض السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        {doc.doc_number}
                      </div>
                      <span className="text-[11px] text-gray-500 font-sans">
                        {doc.doc_type === "SALES_INVOICE" ? "فاتورة مبيعات" : "إذن استلام وتوريد"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {doc.party_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {doc.doc_date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-sm">
                      {formatCurrency(doc.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {formatCurrency(doc.cogs_locked)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-medium">
                        <Paperclip className="w-3 h-3" />
                        {doc.attachments_count} وثائق مؤرشفة
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400 text-[10px]">
                      {doc.sha256_hash.substring(0, 16)}...
                    </td>
                    <td className="py-3.5 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDoc(doc)}
                        className="text-xs flex items-center gap-1 h-8"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>فتح الأرشيف</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Deep Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs flex items-center justify-between p-5 border-b border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-primary">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <span>مستند أرشيفي مقفل: {selectedDoc.doc_number}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                      WORM LOCKED
                    </span>
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    SHA-256: {selectedDoc.sha256_hash}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">الطرف المعني:</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                    {selectedDoc.party_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">تاريخ التسجيل:</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block font-mono">
                    {selectedDoc.doc_date}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">القيمة الإجمالية:</span>
                  <span className="font-bold text-primary text-sm mt-0.5 block font-mono">
                    {formatCurrency(selectedDoc.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">التكلفة التاريخية (COGS):</span>
                  <span className="font-bold text-gray-800 text-sm mt-0.5 block font-mono">
                    {formatCurrency(selectedDoc.cogs_locked)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  بنود المستند المحفوظة لحظة الاعتماد
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">الصنف</th>
                        <th className="py-2.5 px-3">الكمية المسجلة</th>
                        <th className="py-2.5 px-3">سعر الوحدة</th>
                        <th className="py-2.5 px-3">تكلفة الوحدة (FIFO)</th>
                        <th className="py-2.5 px-3">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {selectedDoc.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-sans font-bold text-gray-900">
                            {l.product_name}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {l.quantity} {l.unit}
                          </td>
                          <td className="py-2.5 px-3">{formatCurrency(l.unit_price)}</td>
                          <td className="py-2.5 px-3 text-gray-500">
                            {formatCurrency(l.unit_cost)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">
                            {formatCurrency(l.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  سجل الأحداث الكامل للوثيقة (Full Audit Event Timeline)
                </h4>
                <div className="space-y-4 relative pr-4 border-r-2 border-orange-200 mr-2">
                  {selectedDoc.timeline.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-3 h-3 rounded-full bg-primary absolute -right-[23px] top-1 border-2 border-white ring-2 ring-primary/30" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">{evt.title}</span>
                          <span className="text-[11px] font-mono text-gray-400">
                            {evt.timestamp}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          بواسطة: <span className="font-semibold text-gray-700">{evt.user}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-md border border-gray-100 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-mono">
                  معرف الأرشيف: {selectedDoc.id}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    <span>طباعة المستند التاريخي</span>
                  </Button>
                  <Button
                    onClick={() => alert("جاري تنزيل نسخة PDF الموقعة إلكترونياً...")}
                    className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل نسخة أرشيفية موثقة (PDF)</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
