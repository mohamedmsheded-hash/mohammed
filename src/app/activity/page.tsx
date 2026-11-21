"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Eye,
  Calendar,
  UserCheck,
  FileCode,
  Tag,
  AlertTriangle,
  X,
  ArrowRight,
  Database,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";

interface AuditLogRow {
  id: string;
  created_at: string;
  user_name: string;
  user_role: string;
  ip_address: string;
  action: "APPROVE" | "PRICE_CHANGE" | "SALES_RETURN" | "STOCK_ADJUSTMENT" | "SESSION_CLOSE" | "IMPORT_EXCEL";
  action_label_ar: string;
  entity_name: string;
  entity_id: string;
  summary: string;
  old_values?: Record<string, any>;
  new_values: Record<string, any>;
}

const initialAuditLogs: AuditLogRow[] = [
  {
    id: "aud-001",
    created_at: "2026-11-21 12:45:10",
    user_name: "أحمد عبد الله مصطفى",
    user_role: "مدير الحسابات",
    ip_address: "192.168.1.45",
    action: "APPROVE",
    action_label_ar: "اعتماد فاتورة مبيعات",
    entity_name: "sales_invoices",
    entity_id: "inv-2026-0042",
    summary: "اعتماد الفاتورة INV-2026-0042 بقيمة 428,500 ج.م وتثبيت تكلفة البضاعة بمبلغ 412,000 ج.م",
    old_values: { status: "DRAFT", historical_cogs: 0 },
    new_values: {
      status: "APPROVED",
      historical_cogs: 412000,
      historical_profit: 16500,
      approved_by: "usr-002",
    },
  },
  {
    id: "aud-002",
    created_at: "2026-11-21 11:20:00",
    user_name: "المهندس طارق منصور",
    user_role: "مدير النظام",
    ip_address: "192.168.1.10",
    action: "PRICE_CHANGE",
    action_label_ar: "تعديل سعر بيع الصنف",
    entity_name: "products",
    entity_id: "p-stl-ezz-10",
    summary: "تحديث سعر بيع حديد عز 10 مم من 42,000 ج.م إلى 42,500 ج.م (+500 ج.م)",
    old_values: { sale_price: 42000, replacement_cost: 40800 },
    new_values: {
      sale_price: 42500,
      replacement_cost: 41200,
      reason: "مواكبة إشعار زيادة أسعار أرض المصنع من حديد عز",
    },
  },
  {
    id: "aud-003",
    created_at: "2026-11-21 09:15:30",
    user_name: "أحمد عبد الله مصطفى",
    user_role: "مدير الحسابات",
    ip_address: "192.168.1.45",
    action: "SALES_RETURN",
    action_label_ar: "تسجيل مرتجع مبيعات وعزل توالف",
    entity_name: "sales_returns",
    entity_id: "ret-2026-0015",
    summary: "مرتجع 10 شكائر أسمنت معيبة بتكلفة 130 ج.م للشيكارة وعزلها بمخزن WH-SCRAP",
    old_values: null as any,
    new_values: {
      return_number: "RET-2026-0015",
      is_damaged: true,
      target_warehouse: "WH-SCRAP",
      refund_amount: 1450,
      historical_unit_cost: 130,
    },
  },
  {
    id: "aud-004",
    created_at: "2026-11-20 18:00:15",
    user_name: "سارة حسن عبد الرحمن",
    user_role: "كاشير ومبيعات",
    ip_address: "192.168.1.52",
    action: "SESSION_CLOSE",
    action_label_ar: "إغلاق وردية ومطابقة الخزينة",
    entity_name: "cash_sessions",
    entity_id: "ses-2026-11-20",
    summary: "إغلاق الوردية ومطابقة النقدية بالدرج: دفتري 15,400 ج.م، فعلي 15,400 ج.م (تطابق تام)",
    old_values: { is_open: true },
    new_values: {
      expected_cash: 15400,
      actual_cash: 15400,
      variance: 0,
      closed_at: "2026-11-20 18:00:15",
    },
  },
  {
    id: "aud-005",
    created_at: "2026-11-20 14:10:00",
    user_name: "المهندس طارق منصور",
    user_role: "مدير النظام",
    ip_address: "192.168.1.10",
    action: "IMPORT_EXCEL",
    action_label_ar: "استيراد أصناف عبر مركز Excel",
    entity_name: "import_jobs",
    entity_id: "job-excel-08",
    summary: "استيراد 45 صنف مواد بناء بعد محاكاة Dry Run وفحص Formula Injection",
    old_values: null as any,
    new_values: {
      file_name: "products_nov_catalog.xlsx",
      total_rows: 45,
      valid_rows: 45,
      sanitized_formula_cells: 0,
    },
  },
];

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>(initialAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.summary.includes(searchTerm) ||
      l.user_name.includes(searchTerm) ||
      l.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip_address.includes(searchTerm);
    const matchesAction = actionFilter === "ALL" || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "APPROVE":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "PRICE_CHANGE":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "SALES_RETURN":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "SESSION_CLOSE":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "IMPORT_EXCEL":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "سجل النشاط والتدقيق الأمني" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-7 h-7 text-primary" />
              سجل التدقيق الأمني الشامل وتتبع التغييرات (Immutable Audit Trail)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              سجل غير قابل للحذف أو التعديل يرصد كافة العمليات المحاسبية الحساسة، وعناوين IP، وفروق البيانات القديمة والجديدة
            </p>
          </div>
        </div>

        {/* Security Invariant Alert */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex items-start gap-3 border border-slate-800 shadow-md">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-sm text-white">
              السجل محمي ولا يُمس:
            </span>
            <p className="text-slate-300 leading-relaxed">
              كل حاجة بتحصل في السيستم بتتسجل هنا بشكل نهائي — مفيش حذف ولا تعديل حتى من المدير. كل تغيير في سعر أو اعتماد أو تسوية بيتسجل مع اسم المستخدم وعنوان IP تبعته.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي العمليات المرصودة"
            value={logs.length}
            subtitle="حركات أمنية مسجلة"
            icon={Database}
            color="primary"
          />
          <StatCard
            title="فواتير ومعاملات معتمدة"
            value={logs.filter((l) => l.action === "APPROVE").length}
            subtitle="ترحيل محاسبي وتثبيت تكلفة"
            icon={Lock}
            color="success"
          />
          <StatCard
            title="تعديلات أسعار حساسة"
            value={logs.filter((l) => l.action === "PRICE_CHANGE").length}
            subtitle="مراقبة هوامش المواد"
            icon={Tag}
            color="warning"
          />
          <StatCard
            title="تسويات ومرتجعات مخزنية"
            value={logs.filter((l) => ["SALES_RETURN", "SESSION_CLOSE"].includes(l.action)).length}
            subtitle="مطابقات وإغلاقات وردية"
            icon={ShieldCheck}
            color="neutral"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في تفاصيل النشاط، اسم المستخدم، معرف السجل، أو عنوان IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[170px]"
            >
              <option value="ALL">جميع أنواع العمليات</option>
              <option value="APPROVE">اعتماد فواتير (APPROVE)</option>
              <option value="PRICE_CHANGE">تغيير أسعار (PRICE_CHANGE)</option>
              <option value="SALES_RETURN">مرتجع مبيعات (SALES_RETURN)</option>
              <option value="SESSION_CLOSE">إغلاق وردية (SESSION_CLOSE)</option>
              <option value="IMPORT_EXCEL">استيراد Excel</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">التوقيت والـ IP</th>
                  <th className="py-3 px-4">المستخدم والدور</th>
                  <th className="py-3 px-4">نوع العملية (Action)</th>
                  <th className="py-3 px-4">الجدول / الكيان</th>
                  <th className="py-3 px-4">ملخص الأثر والبيان</th>
                  <th className="py-3 px-4">فحص الفارق (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900 text-xs">{log.created_at}</div>
                      <div className="text-gray-400 text-[11px]">IP: {log.ip_address}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{log.user_name}</div>
                      <div className="text-gray-500 text-[11px]">{log.user_role}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action_label_ar}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      <div>{log.entity_name}</div>
                      <div className="text-[10px] text-gray-400">{log.entity_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 font-medium max-w-md">
                      {log.summary}
                    </td>
                    <td className="py-3.5 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="text-xs flex items-center gap-1 h-8"
                      >
                        <FileCode className="w-3.5 h-3.5 text-primary" />
                        <span>عرض Diff</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">
                  تفاصيل تدقيق التغييرات (Payload Diff): {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div>
                  <span className="font-bold text-gray-600">المستخدم:</span> {selectedLog.user_name} ({selectedLog.user_role})
                </div>
                <div>
                  <span className="font-bold text-gray-600">التوقيت:</span> {selectedLog.created_at} | <span className="font-bold text-gray-600">IP:</span> {selectedLog.ip_address}
                </div>
                <div>
                  <span className="font-bold text-gray-600">البيان:</span> {selectedLog.summary}
                </div>
              </div>

              {/* Old vs New Values Diff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Old Values */}
                <div className="space-y-1">
                  <span className="font-bold text-rose-700 font-sans block">
                    القيم السابقة (Old Values):
                  </span>
                  <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 overflow-x-auto min-h-[140px] text-rose-950">
                    {selectedLog.old_values ? (
                      <pre className="text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-gray-400 italic font-sans text-xs">
                        لا توجد قيم سابقة (عملية إنشاء أولية)
                      </span>
                    )}
                  </div>
                </div>

                {/* New Values */}
                <div className="space-y-1">
                  <span className="font-bold text-emerald-700 font-sans block">
                    القيم الجديدة المسجلة (New Values):
                  </span>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 overflow-x-auto min-h-[140px] text-emerald-950">
                    <pre className="text-[11px] whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <Button onClick={() => setSelectedLog(null)} variant="outline">
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
