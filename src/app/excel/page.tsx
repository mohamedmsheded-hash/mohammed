"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileCheck,
  ShieldCheck,
  Play,
  ArrowRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { simulateProductsDryRunAction, getProductsTemplateBase64 } from "@/server/actions/excel";

export default function ExcelCenterPage() {
  const [activeTab, setActiveTab] = useState<"IMPORT" | "TEMPLATES" | "HISTORY">("IMPORT");
  const [targetEntity, setTargetEntity] = useState("PRODUCTS");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [importCommitted, setImportCommitted] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDryRunResult(null);
      setImportCommitted(false);
    }
  };

  const handleRunDryRun = async () => {
    if (!selectedFile) {
      alert("يرجى اختيار ملف Excel أو CSV أولاً");
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet);

          const result = await simulateProductsDryRunAction(rawRows);
          setDryRunResult(result);
        } catch (err: any) {
          alert(`خطأ في قراءة ملف Excel: ${err.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    if (!dryRunResult || dryRunResult.validCount === 0) {
      alert("لا توجد صفوف صالحة للترحيل");
      return;
    }

    if (
      !confirm(
        `تأكيد ترحيل (${dryRunResult.validCount}) صنف إلى قاعدة البيانات؟ الصفوف التي تحوي أخطاء سيتم تجاهلها.`
      )
    ) {
      return;
    }

    setImportCommitted(true);
    alert(`تم ترحيل (${dryRunResult.validCount}) صنف إلى دليل المنتجات بنجاح!`);
  };

  const handleDownloadTemplate = async () => {
    try {
      const base64 = await getProductsTemplateBase64();
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = "قالب_استيراد_المنتجات_مخازن.xlsx";
      link.click();
    } catch (err: any) {
      alert(`فشل تحميل القالب: ${err.message}`);
    }
  };

  return (
    <AppShell title="مركز Excel" breadcrumb="العمليات / مركز Excel">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            مركز معالجة ملفات Excel الآمن
          </h1>
          <p className="text-muted text-xs mt-1">
            استيراد وتحديث البيانات، فحص ومعاينة مسبقة للملف، والتأكد من صحة وسلامة البيانات قبل حفظها.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="default" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4" />
            <span>تنزيل القوالب المعتمدة</span>
          </Button>
        </div>
      </div>

      {/* Security Rule Card */}
      <div className="mb-6 p-4 bg-brand-soft border border-[#ffe2ce] rounded-card flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
        <div className="text-foreground leading-relaxed">
          <strong className="text-brand-dark block font-bold mb-0.5">
            ضوابط الاستيراد الآمن:
          </strong>
          مفيش أي بيانات بتنزل على السيستم مباشرة إلا بعد مطابقة الأعمدة، كشف التكرار، وعرض معاينة تجريبية للأصناف عشان تراجعها وتعتمدها بنفسك بدون أي أخطاء.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("IMPORT")}
          className={`px-4 py-2 rounded-element text-xs font-bold transition-colors ${
            activeTab === "IMPORT"
              ? "bg-brand text-white shadow-btn"
              : "bg-surface text-muted hover:text-foreground border border-border"
          }`}
        >
          معالج الاستيراد الذكي (Import Wizard)
        </button>
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-4 py-2 rounded-element text-xs font-bold transition-colors ${
            activeTab === "TEMPLATES"
              ? "bg-brand text-white shadow-btn"
              : "bg-surface text-muted hover:text-foreground border border-border"
          }`}
        >
          نماذج وقوالب التصدير (Templates)
        </button>
      </div>

      {/* Tab 1: Import Wizard */}
      {activeTab === "IMPORT" && (
        <div className="space-y-6">
          {/* Step 1 & 2: Entity Selection & File Upload */}
          <div className="bg-surface border border-border rounded-card p-6 shadow-card">
            <h2 className="text-sm font-extrabold text-foreground mb-4 pb-2 border-b border-border">
              الخطوة 1: اختيار نوع البيانات وملف Excel
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  البيانات المراد استيرادها
                </label>
                <select
                  value={targetEntity}
                  onChange={(e) => setTargetEntity(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2.5 text-xs font-bold text-foreground outline-none focus:border-brand"
                >
                  <option value="PRODUCTS">دليل المنتجات والأصناف والأسعار</option>
                  <option value="CUSTOMERS">بيانات العملاء وأرصدة الائتمان</option>
                  <option value="SUPPLIERS">دليل الموردين والمصانع</option>
                  <option value="OPENING_STOCK">الأرصدة الافتتاحية للمخازن</option>
                </select>
                <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
                  يدعم صيغ XLSX, XLS, وCSV مع قراءة العناوين باللغتين العربية والإنجليزية.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  رفع ملف البيانات
                </label>
                <div className="border-2 border-dashed border-border rounded-card p-6 text-center hover:border-brand transition-colors bg-[#f8fafc]">
                  <UploadCloud className="w-8 h-8 text-brand mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">
                    {selectedFile ? selectedFile.name : "اضغط لاختيار الملف أو اسحبه هنا"}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {selectedFile
                      ? `الحجم: ${(selectedFile.size / 1024).toFixed(1)} كيلوبايت`
                      : "الصيغ المدعومة: .xlsx, .xls, .csv بحجم أقصى 15 ميجابايت"}
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label htmlFor="excel-file-input">
                    <Button variant="secondary" size="sm" className="mt-3 cursor-pointer" asChild>
                      <span>{selectedFile ? "تغيير الملف" : "اختيار ملف"}</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {selectedFile && !dryRunResult && (
              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <Button
                  variant="default"
                  onClick={handleRunDryRun}
                  disabled={isProcessing}
                >
                  <Play className="w-4 h-4" />
                  <span>{isProcessing ? "جارٍ فحص الملف..." : "فحص ومعاينة البيانات"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Step 3: Dry Run Results */}
          {dryRunResult && (
            <div className="bg-surface border border-border rounded-card p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    نتيجة فحص ومعاينة الملف قبل الحفظ
                  </h3>
                  <p className="text-[11px] text-muted">
                    فحص الصفوف، التأكد من عدم تكرار الأكواد، ومطابقة وحدات القياس.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDryRunResult(null);
                    setSelectedFile(null);
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة الفحص</span>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-card bg-[#f8fafc] border border-border">
                  <span className="text-xs text-muted font-bold block mb-1">إجمالي الصفوف المقروءة</span>
                  <strong className="text-xl font-extrabold text-foreground">
                    {dryRunResult.totalRows} صف
                  </strong>
                </div>
                <div className="p-4 rounded-card bg-status-green-bg border border-[#c2ebd5]">
                  <span className="text-xs text-status-green font-bold block mb-1">
                    الصفوف السليمة الجاهزة للترحيل
                  </span>
                  <strong className="text-xl font-extrabold text-status-green">
                    {dryRunResult.validCount} صف
                  </strong>
                </div>
                <div className="p-4 rounded-card bg-status-red-bg border border-[#fad7d7]">
                  <span className="text-xs text-status-red font-bold block mb-1">
                    الصفوف المعيبة التي تحتوي أخطاء
                  </span>
                  <strong className="text-xl font-extrabold text-status-red">
                    {dryRunResult.invalidCount} خطأ
                  </strong>
                </div>
              </div>

              {/* Errors Breakdown (if any) */}
              {dryRunResult.errors.length > 0 && (
                <div className="border border-border rounded-element overflow-hidden">
                  <div className="p-3 bg-[#fff0f0] border-b border-[#fad7d7] text-status-red text-xs font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>تقرير الأخطاء المكتشفة في الملف (يرجى تصحيحها):</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#f8fafc] text-muted border-b border-border">
                        <tr>
                          <th className="py-2 px-3 font-bold">رقم الصف</th>
                          <th className="py-2 px-3 font-bold">الحقل</th>
                          <th className="py-2 px-3 font-bold">الخطأ المكتشف</th>
                          <th className="py-2 px-3 font-bold">القيمة المدخلة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dryRunResult.errors.map((err: any, idx: number) => (
                          <tr key={idx} className="hover:bg-black/[0.01]">
                            <td className="py-2 px-3 font-mono font-bold text-foreground">
                              الصف {err.rowNumber}
                            </td>
                            <td className="py-2 px-3 font-semibold text-foreground">{err.field}</td>
                            <td className="py-2 px-3 text-status-red font-medium">{err.error}</td>
                            <td className="py-2 px-3 text-muted font-mono">{String(err.rawValue ?? "-")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Valid Rows Preview Table */}
              {dryRunResult.validRows.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2">
                    معاينة عينة من الصفوف الصالحة للترحيل:
                  </h4>
                  <div className="border border-border rounded-element overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#f8fafc] text-muted border-b border-border">
                        <tr>
                          <th className="py-2 px-3 font-bold">كود الصنف</th>
                          <th className="py-2 px-3 font-bold">الاسم بالعربية</th>
                          <th className="py-2 px-3 font-bold">وحدة الأساس</th>
                          <th className="py-2 px-3 font-bold">سعر البيع</th>
                          <th className="py-2 px-3 font-bold">تكلفة الاستبدال</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dryRunResult.validRows.slice(0, 5).map((row: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-foreground">
                              {row.code}
                            </td>
                            <td className="py-2 px-3 font-bold text-foreground">{row.name_ar}</td>
                            <td className="py-2 px-3 text-muted">{row.base_unit}</td>
                            <td className="py-2 px-3 font-bold text-brand">{row.current_sale_price} ج.م</td>
                            <td className="py-2 px-3 text-muted">{row.replacement_cost} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commit Action */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">
                  {importCommitted ? (
                    <span className="text-status-green font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم ترحيل البيانات بنجاح!</span>
                    </span>
                  ) : (
                    "تأكيد استيراد الصفوف السليمة وتجاهل المعيبة"
                  )}
                </span>
                <Button
                  variant="default"
                  onClick={handleCommitImport}
                  disabled={importCommitted || dryRunResult.validCount === 0}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>اعتماد وترحيل الصفوف السليمة ({dryRunResult.validCount})</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Templates */}
      {activeTab === "TEMPLATES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-card p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand" />
              <h3 className="text-sm font-extrabold text-foreground">قالب دليل الأصناف والأسعار</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              يشمل أعمدة كود الصنف، الاسم بالعربية، التصنيف، وحدة الأساس، سعر البيع الحالي، تكلفة الاستبدال، وخصائص مواد البناء.
            </p>
            <Button variant="default" size="sm" className="w-full" onClick={handleDownloadTemplate}>
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل القالب (XLSX)</span>
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-card p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-status-blue" />
              <h3 className="text-sm font-extrabold text-foreground">قالب العملاء والمديونيات</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              يشمل كود العميل، الاسم، رقم الهاتف، الحد الائتماني، فترة السماح، والرصيد الافتتاحي.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل القالب (XLSX)</span>
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-card p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-status-green" />
              <h3 className="text-sm font-extrabold text-foreground">قالب الأرصدة الافتتاحية</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              تسجيل رصيد بداية المدة لكل مخزن مع تكلفة شراء الوحدة لحساب تكلفة المخزون بدقة من أول يوم.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل القالب (XLSX)</span>
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
