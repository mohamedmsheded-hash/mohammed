"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Users,
  Boxes,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"COGS" | "AGING" | "REPLACEMENT" | "VALUATION">("COGS");
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_MONTH");

  // Mock data for COGS & Profit
  const cogsData = [
    {
      category: "حديد تسليح (أقطار 10، 12، 16 مم)",
      revenue: 1250000,
      cogs: 1195000,
      grossProfit: 55000,
      marginPct: 4.4,
    },
    {
      category: "أسمنت ومواد رابطة (السويدي وسيناء)",
      revenue: 480000,
      cogs: 422000,
      grossProfit: 58000,
      marginPct: 12.1,
    },
    {
      category: "رمل وزلط ومحاجر",
      revenue: 165000,
      cogs: 112000,
      grossProfit: 53000,
      marginPct: 32.1,
    },
    {
      category: "طوب بناء أسمنتي ومفرغ",
      revenue: 95000,
      cogs: 71000,
      grossProfit: 24000,
      marginPct: 25.3,
    },
  ];

  // Mock data for Customer Debt Aging
  const agingData = [
    {
      id: "cust-01",
      name: "شركة المعمار الحديث للمقاولات",
      totalBalance: 328500,
      current_0_30: 250000,
      days_31_60: 78500,
      days_61_90: 0,
      days_over_90: 0,
      creditLimit: 500000,
      status: "NORMAL",
    },
    {
      id: "cust-02",
      name: "مؤسسة الأمل للتشييد والتعمير",
      totalBalance: 185000,
      current_0_30: 60000,
      days_31_60: 45000,
      days_61_90: 50000,
      days_over_90: 30000,
      creditLimit: 200000,
      status: "WARNING",
    },
    {
      id: "cust-03",
      name: "شركة الصفوة للاستثمار العقاري",
      totalBalance: 92000,
      current_0_30: 92000,
      days_31_60: 0,
      days_61_90: 0,
      days_over_90: 0,
      creditLimit: 150000,
      status: "NORMAL",
    },
    {
      id: "cust-04",
      name: "مقاولات المهندس سامح فخري",
      totalBalance: 145000,
      current_0_30: 0,
      days_31_60: 20000,
      days_61_90: 45000,
      days_over_90: 80000,
      creditLimit: 100000,
      status: "OVERDUE",
    },
  ];

  // Mock data for Replacement Margin Analysis (Crucial for Steel/Cement trading in Egypt)
  const replacementData = [
    {
      productName: "حديد تسليح عز 10 مم مشرشر أطوال",
      unit: "طن",
      salePrice: 42500,
      fifoCost: 40500,
      accountingProfit: 2000,
      accountingMarginPct: 4.7,
      replacementCost: 42200, // Today's mill price
      replacementProfit: 300,  // True cash margin to replenish stock
      replacementMarginPct: 0.7,
      status: "TIGHT_MARGIN",
    },
    {
      productName: "حديد تسليح عز 12 مم مشرشر أطوال",
      unit: "طن",
      salePrice: 42200,
      fifoCost: 40300,
      accountingProfit: 1900,
      accountingMarginPct: 4.5,
      replacementCost: 42300, // Factory price increased above sale price!
      replacementProfit: -100, // Selling at loss relative to replenishment!
      replacementMarginPct: -0.2,
      status: "REPLACEMENT_LOSS",
    },
    {
      productName: "أسمنت السويدي مقاوم 42.5",
      unit: "شيكارة",
      salePrice: 145.0,
      fifoCost: 130.0,
      accountingProfit: 15.0,
      accountingMarginPct: 10.3,
      replacementCost: 138.0,
      replacementProfit: 7.0,
      replacementMarginPct: 4.8,
      status: "HEALTHY",
    },
    {
      productName: "أسمنت سيناء بورتلاندي عادي 42.5",
      unit: "شيكارة",
      salePrice: 135.0,
      fifoCost: 122.0,
      accountingProfit: 13.0,
      accountingMarginPct: 9.6,
      replacementCost: 128.0,
      replacementProfit: 7.0,
      replacementMarginPct: 5.2,
      status: "HEALTHY",
    },
  ];

  const totalRevenue = cogsData.reduce((sum, d) => sum + d.revenue, 0);
  const totalCogs = cogsData.reduce((sum, d) => sum + d.cogs, 0);
  const totalProfit = totalRevenue - totalCogs;
  const overallMargin = (totalProfit / totalRevenue) * 100;

  const totalAgingDebt = agingData.reduce((sum, d) => sum + d.totalBalance, 0);
  const overdueDebt = agingData.reduce((sum, d) => sum + d.days_over_90, 0);

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "التقارير والتحليلات المالية" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              التقارير المالية وهوامش أرباح مواد البناء
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              متابعة تكلفة البضاعة المباعة، أرباح المبيعات، أعمار ديون العملاء، ومقارنة أسعار إعادة الشراء من المصنع
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-primary bg-white"
            >
              <option value="THIS_MONTH">الشهر الحالي (نوفمبر 2026)</option>
              <option value="LAST_MONTH">الشهر السابق (أكتوبر 2026)</option>
              <option value="FISCAL_2026">السنة المالية الحالية 2026</option>
            </select>

            <Button
              variant="outline"
              onClick={() => alert("جاري تصدير التقرير المالي الشامل بصيغة Excel...")}
              className="flex items-center gap-1.5 text-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("COGS")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "COGS"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تكلفة المبيعات وأرباح الأصناف</span>
          </button>

          <button
            onClick={() => setActiveTab("REPLACEMENT")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "REPLACEMENT"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>هامش إعادة الشراء وسعر السوق اليوم</span>
          </button>

          <button
            onClick={() => setActiveTab("AGING")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "AGING"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>أعمار الديون والتحصيلات (Aging Report)</span>
          </button>
        </div>

        {/* Tab 1: COGS & Profit Margins */}
        {activeTab === "COGS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="إجمالي الإيرادات المعتمدة"
                value={formatCurrency(totalRevenue)}
                subtitle="فواتير مبيعات معتمدة"
                icon={Receipt}
                color="primary"
              />
              <StatCard
                title="تكلفة البضاعة المباعة"
                value={formatCurrency(totalCogs)}
                subtitle="محسوبة من أصل تكلفة الشراء والنولون"
                icon={Boxes}
                color="neutral"
              />
              <StatCard
                title="مجمل الربح الإجمالي"
                value={formatCurrency(totalProfit)}
                subtitle="فارق سعر البيع عن تكلفة البضاعة"
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="نسبة هامش الربح الإجمالي"
                value={`${overallMargin.toFixed(1)}%`}
                subtitle="متوسط ربحية النشاط"
                icon={BarChart3}
                color="primary"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">
                  تحليل الربحية حسب قطاعات مواد البناء (الأرباح المحققة)
                </h3>
                <span className="text-xs text-gray-500">
                  محسوب بدقة بناءً على تكلفة الشراء والنولون لكل شحنة
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">قطاع المواد</th>
                      <th className="py-3 px-4">إجمالي الإيرادات</th>
                      <th className="py-3 px-4">تكلفة البضاعة المباعة</th>
                      <th className="py-3 px-4">الربح الإجمالي (EGP)</th>
                      <th className="py-3 px-4">نسبة الهامش %</th>
                      <th className="py-3 px-4">مؤشر الربحية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {cogsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-gray-900">
                          {row.category}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          {row.marginPct}%
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(row.marginPct * 3, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Replacement Margin Analysis */}
        {activeTab === "REPLACEMENT" && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm">
                  ليه مهم تتابع سعر إعادة الشراء من المصنع أول بأول؟
                </span>
                <p className="leading-relaxed">
                  لو سعر طن الحديد أو الأسمنت زاد فجأة في المصنع، ممكن تبيع بسعر يظهر لك ربح دفتري على الورق، بس لما تيجي تشتري بضاعة مكانها بسعر المصنع الجديد تلاقي فلوسك نقصت! الجدول ده بيحسب لك الفرق في لحظته عشان تضمن إنك مسعر صح ورأس مالك في أمان.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">الصنف والوحدة</th>
                      <th className="py-3 px-4">سعر البيع الحالي</th>
                      <th className="py-3 px-4">تكلفة الشراء الدفترية</th>
                      <th className="py-3 px-4">الربح المحاسبي الدفتري</th>
                      <th className="py-3 px-4">تكلفة إعادة الشراء من المصنع اليوم</th>
                      <th className="py-3 px-4">هامش الربح الحقيقي لإعادة الشراء</th>
                      <th className="py-3 px-4">حالة التسعير والمخاطرة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {replacementData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-gray-900">
                          {row.productName}
                          <span className="text-gray-400 font-normal text-xs mr-1">
                            ({row.unit})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {formatCurrency(row.salePrice)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {formatCurrency(row.fifoCost)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-bold">
                          +{formatCurrency(row.accountingProfit)} ({row.accountingMarginPct}%)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-purple-700 bg-purple-50/50">
                          {formatCurrency(row.replacementCost)}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {row.replacementProfit >= 0 ? (
                            <span className="text-blue-700">
                              +{formatCurrency(row.replacementProfit)} ({row.replacementMarginPct}%)
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              {formatCurrency(row.replacementProfit)} (خسارة استبدال!)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          {row.status === "HEALTHY" && (
                            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              تسعير آمن ومستقر
                            </span>
                          )}
                          {row.status === "TIGHT_MARGIN" && (
                            <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              هامش ضيق - يُوصى بالرفع
                            </span>
                          )}
                          {row.status === "REPLACEMENT_LOSS" && (
                            <span className="inline-block text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                              تحذير: البيع يستنزف رأس المال
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Debt Aging Report */}
        {activeTab === "AGING" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="إجمالي الديون المستحقة"
                value={formatCurrency(totalAgingDebt)}
                subtitle="أرصدة حسابات العملاء الآجلة"
                icon={Users}
                color="primary"
              />
              <StatCard
                title="ديون حديثة (0 - 30 يوم)"
                value={formatCurrency(agingData.reduce((s, d) => s + d.current_0_30, 0))}
                subtitle="ضمن فترة الائتمان المقبولة"
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="ديون متأخرة (61 - 90 يوم)"
                value={formatCurrency(agingData.reduce((s, d) => s + d.days_61_90, 0))}
                subtitle="تتطلب متابعة التحصيل"
                icon={AlertTriangle}
                color="warning"
              />
              <StatCard
                title="ديون حرجة (+90 يوم)"
                value={formatCurrency(overdueDebt)}
                subtitle="خطر تعثر واعتراض ائتماني"
                icon={AlertTriangle}
                color="warning"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">اسم العميل</th>
                      <th className="py-3 px-4">إجمالي المديونية</th>
                      <th className="py-3 px-4">0 - 30 يوم</th>
                      <th className="py-3 px-4">31 - 60 يوم</th>
                      <th className="py-3 px-4">61 - 90 يوم</th>
                      <th className="py-3 px-4">+90 يوم (متأخر)</th>
                      <th className="py-3 px-4">الحد الائتماني</th>
                      <th className="py-3 px-4">حالة الائتمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {agingData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-gray-900">
                          {row.name}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {formatCurrency(row.totalBalance)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-medium">
                          {row.current_0_30 > 0 ? formatCurrency(row.current_0_30) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-blue-700 font-medium">
                          {row.days_31_60 > 0 ? formatCurrency(row.days_31_60) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-amber-700 font-medium">
                          {row.days_61_90 > 0 ? formatCurrency(row.days_61_90) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-rose-700 font-bold">
                          {row.days_over_90 > 0 ? formatCurrency(row.days_over_90) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {formatCurrency(row.creditLimit)}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          {row.status === "NORMAL" && (
                            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              سليم
                            </span>
                          )}
                          {row.status === "WARNING" && (
                            <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              تجاوز الأجل
                            </span>
                          )}
                          {row.status === "OVERDUE" && (
                            <span className="inline-block text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              إيقاف بيع آجل
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
