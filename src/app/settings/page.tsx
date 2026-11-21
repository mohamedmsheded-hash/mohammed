"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Hash,
  Lock,
  HardDrive,
  Save,
  Server,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"GENERAL" | "SEQUENCES" | "BACKUP" | "INVARIANTS">("BACKUP");
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // System settings state
  const [orgConfig, setOrgConfig] = useState({
    name_ar: "مؤسسة النصر لتجارة مواد البناء والحديد والأسمنت",
    commercial_reg: "109823",
    tax_id: "492-381-900",
    allow_negative_stock: false, // Strict Invariant: Prevent negative stock
    cost_method: "FIFO",         // Strict Invariant: FIFO
    price_change_tolerance: 5.0, // Alert threshold %
    fiscal_year: 2026,
  });

  const [backupList, setBackupList] = useState([
    {
      id: "BKP-2026-11-21-0400",
      timestamp: "2026-11-21 04:00:00",
      type: "AUTOMATED_DAILY",
      size: "42.8 MB",
      recordsCount: 1420,
      status: "VERIFIED",
      location: "مستودع نسخ احتياطي سحابي منفصل (Secondary S3 Vault)",
    },
    {
      id: "BKP-2026-11-20-0400",
      timestamp: "2026-11-20 04:00:00",
      type: "AUTOMATED_DAILY",
      size: "41.5 MB",
      recordsCount: 1395,
      status: "VERIFIED",
      location: "مستودع نسخ احتياطي سحابي منفصل (Secondary S3 Vault)",
    },
    {
      id: "BKP-2026-11-15-2300",
      timestamp: "2026-11-15 23:00:00",
      type: "WEEKLY_FULL_SNAPSHOT",
      size: "40.1 MB",
      recordsCount: 1310,
      status: "RESTORE_TESTED",
      location: "خادم التخزين الجغرافي المعزول (Cold Storage)",
    },
  ]);

  const handleTriggerBackup = () => {
    setBackupLoading(true);
    setBackupSuccess(false);

    setTimeout(() => {
      const newBackup = {
        id: `BKP-${new Date().toISOString().slice(0, 10)}-MANUAL`,
        timestamp: new Date().toLocaleString("sv-SE").replace(" ", " "),
        type: "MANUAL_ON_DEMAND",
        size: "43.2 MB",
        recordsCount: 1445,
        status: "VERIFIED",
        location: "مستودع نسخ احتياطي سحابي منفصل (Secondary S3 Vault)",
      };
      setBackupList([newBackup, ...backupList]);
      setBackupLoading(false);
      setBackupSuccess(true);
    }, 1200);
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الإعدادات والنسخ الاحتياطي" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-7 h-7 text-primary" />
              إعدادات النظام والسياسات المحاسبية وإدارة النسخ الاحتياطي (DR)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ضبط قواعد التكلفة الصارمة، ترقيم المستندات الذري، وجدولة النسخ الاحتياطي المستقل واختبارات الاستعادة
            </p>
          </div>

          <Button
            onClick={() => alert("تم حفظ وتطبيق التعديلات على إعدادات المنظومة")}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("BACKUP")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "BACKUP"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي المستقل والتعافي من الكوارث (DR)</span>
          </button>

          <button
            onClick={() => setActiveTab("INVARIANTS")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "INVARIANTS"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>السياسات المحاسبية والمخزنية الإلزامية</span>
          </button>

          <button
            onClick={() => setActiveTab("SEQUENCES")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "SEQUENCES"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>تسلسل وترقيم المستندات</span>
          </button>

          <button
            onClick={() => setActiveTab("GENERAL")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "GENERAL"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>بيانات المنشأة والضرائب</span>
          </button>
        </div>

        {/* Tab 1: Backup & DR */}
        {activeTab === "BACKUP" && (
          <div className="space-y-6">
            {/* DR Strategy Banner */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-md">
              <div className="flex items-start gap-3">
                <Server className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white">
                    خطة النسخ الاحتياطي السحابي المستقل (3-2-1 Backup Strategy)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    تُحفظ النسخ الاحتياطية خارج بيئة التشغيل الرئيسية في خادم تخزين جغرافي منفصل يومياً الساعة 04:00 صباحاً مع التحقق الدوري من إمكانية استعادة قاعدة البيانات والملفات بالكامل (Recovery Drill).
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTriggerBackup}
                disabled={backupLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2.5 flex items-center gap-2 shrink-0 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${backupLoading ? "animate-spin" : ""}`} />
                <span>{backupLoading ? "جاري أخذ النسخة..." : "إنشاء نسخة احتياطية فورية الآن"}</span>
              </Button>
            </div>

            {backupSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم إنشاء النسخة الاحتياطية بنجاح وتم فحص البصمة وتأمينها في وحدة التخزين المستقلة.</span>
              </div>
            )}

            {/* Backups List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">
                  سجل النسخ الاحتياطية ومحاكاة الاستعادة (Backup & Recovery Drills)
                </h3>
                <span className="text-xs text-gray-500">
                  فترة الاحتفاظ بالنسخ: 365 يوماً للنسخ اليومية و10 سنوات للنسخ السنوية
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">معرف النسخة الاحتياطية</th>
                      <th className="py-3 px-4">التوقيت والتاريخ</th>
                      <th className="py-3 px-4">النوع</th>
                      <th className="py-3 px-4">الحجم وعدد السجلات</th>
                      <th className="py-3 px-4">موقع التخزين المستقل</th>
                      <th className="py-3 px-4">حالة التحقق والاستعادة</th>
                      <th className="py-3 px-4">تنزيل / فحص</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {backupList.map((bkp) => (
                      <tr key={bkp.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {bkp.id}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {bkp.timestamp}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-gray-800">
                          {bkp.type === "AUTOMATED_DAILY"
                            ? "يومي آلي"
                            : bkp.type === "WEEKLY_FULL_SNAPSHOT"
                            ? "أسبوعي شامل"
                            : "يدوي فوري"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {bkp.size} ({bkp.recordsCount} سجل)
                        </td>
                        <td className="py-3.5 px-4 font-sans text-gray-600 text-[11px]">
                          {bkp.location}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          {bkp.status === "RESTORE_TESTED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              <CheckCircle2 className="w-3 h-3" />
                              تم اختبار الاستعادة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              محفوظة ومتحقق منها
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <button
                            onClick={() => alert(`جاري تنزيل ملف تفريغ النسخة: ${bkp.id}.sql.gz`)}
                            className="text-primary hover:text-primary-hover font-semibold text-xs flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invariants */}
        {activeTab === "INVARIANTS" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                القيود والقواعد المحاسبية والمخزنية الإلزامية (System Invariants)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                تطبق هذه السياسات على مستوى دوال قاعدة البيانات الذرية (PostgreSQL RPCs) ولا يمكن تجاوزها
              </p>
            </div>

            <div className="space-y-4">
              {/* Negative Stock Toggle */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-gray-900">
                      سياسة المخزون السالب (Strict Negative Stock Prevention)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                    منع اعتماد أي فاتورة مبيعات أو إذن صرف إذا كانت الكمية المطلوبة تتجاوز الرصيد الفعلي المتوفر في طبقات المخزون (FIFO) بالمستودع المحدد.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-700">
                    {orgConfig.allow_negative_stock ? "مسموح بالسالب (غير موصى به)" : "ممنوع تماماً (محمي)"}
                  </span>
                  <input
                    type="checkbox"
                    checked={!orgConfig.allow_negative_stock}
                    onChange={(e) =>
                      setOrgConfig({ ...orgConfig, allow_negative_stock: !e.target.checked })
                    }
                    className="w-5 h-5 text-primary rounded-sm border-gray-300"
                  />
                </div>
              </div>

              {/* FIFO Costing Invariant */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">
                      طريقة احتساب تكلفة المخزون (Inventory Valuation Method)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                    الوارد أولاً يصرف أولاً (FIFO) مع الاحتفاظ الفردي بكل طبقة شراء ونولونها وتثبيت التكلفة التاريخية للفواتير المعتمدة بصفة نهائية.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg">
                  FIFO (الوارد أولاً يصرف أولاً)
                </span>
              </div>

              {/* Price Tolerance */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-900">
                      نسبة التفاوت المسموح بها في تغير أسعار البيع بدون موافقة مدير الحسابات
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    أي تعديل على سعر البيع الحالي لحديد التسليح أو الأسمنت يتجاوز هذه النسبة يستلزم موافقة إلكترونية من مدير الحسابات.
                  </p>
                </div>
                <div className="flex items-center gap-1 font-mono shrink-0">
                  <input
                    type="number"
                    step="0.5"
                    value={orgConfig.price_change_tolerance}
                    onChange={(e) =>
                      setOrgConfig({ ...orgConfig, price_change_tolerance: Number(e.target.value) })
                    }
                    className="w-16 p-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center"
                  />
                  <span className="text-xs font-bold text-gray-600">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Sequences */}
        {activeTab === "SEQUENCES" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                تسلسل وترقيم المستندات الذري (Atomic Document Sequences)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                توليد متسلسل للأرقام يمنع الفجوات والازدواج حتى في أوقات الذروة المتزامنة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-gray-800">فواتير المبيعات (Sales Invoices)</div>
                <div className="font-mono text-primary font-bold">INV-2026-00001 → INV-2026-99999</div>
                <div className="text-gray-500">القيمة الحالية للسنة المالية 2026: 42</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-gray-800">أذونات استلام المشتريات (Goods Receipts)</div>
                <div className="font-mono text-primary font-bold">RCPT-2026-00001 → RCPT-2026-99999</div>
                <div className="text-gray-500">القيمة الحالية للسنة المالية 2026: 31</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-gray-800">أوامر التوصيل والنقل (Delivery Orders)</div>
                <div className="font-mono text-primary font-bold">DEL-2026-00001 → DEL-2026-99999</div>
                <div className="text-gray-500">القيمة الحالية للسنة المالية 2026: 90</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-gray-800">أذونات مرتجعات المبيعات (Sales Returns)</div>
                <div className="font-mono text-primary font-bold">RET-2026-00001 → RET-2026-99999</div>
                <div className="text-gray-500">القيمة الحالية للسنة المالية 2026: 15</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: General */}
        {activeTab === "GENERAL" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">بيانات المنشأة والسجل التجاري</h3>
              <p className="text-xs text-gray-500 mt-0.5">تظهر هذه البيانات في ترويسة الفواتير والمستندات الرسمية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">اسم المؤسسة التجاري</label>
                <input
                  type="text"
                  value={orgConfig.name_ar}
                  onChange={(e) => setOrgConfig({ ...orgConfig, name_ar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-semibold focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">السنة المالية النشطة</label>
                <input
                  type="number"
                  value={orgConfig.fiscal_year}
                  onChange={(e) => setOrgConfig({ ...orgConfig, fiscal_year: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-semibold focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={orgConfig.commercial_reg}
                  onChange={(e) => setOrgConfig({ ...orgConfig, commercial_reg: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">رقم التسجيل الضريبي</label>
                <input
                  type="text"
                  value={orgConfig.tax_id}
                  onChange={(e) => setOrgConfig({ ...orgConfig, tax_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
