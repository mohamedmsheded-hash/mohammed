import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  PlusCircle,
  FileText,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <AppShell title="لوحة التحكم" breadcrumb="الرئيسية">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            صباح الخير، محمد 👋
          </h1>
          <p className="text-muted text-xs mt-1">
            متابعة حركة المخزون، المبيعات اللحظية، الخزينة، والتكاليف التاريخية لفرع المخزن الرئيسي.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/sales/new">
            <Button variant="default" size="default">
              <PlusCircle className="w-4 h-4" />
              <span>فاتورة بيع جديدة</span>
            </Button>
          </Link>
          <Link href="/purchases/new">
            <Button variant="secondary" size="default">
              <ShoppingCart className="w-4 h-4" />
              <span>أمر شراء / توريد</span>
            </Button>
          </Link>
          <Link href="/excel">
            <Button variant="soft" size="default">
              <FileSpreadsheet className="w-4 h-4" />
              <span>مركز Excel</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(85400)}
          subtitle="24 فاتورة معتمدة"
          icon={<TrendingUp className="w-5 h-5 text-status-green" />}
          trend={{ value: "14% عن الأمس", isPositive: true }}
        />
        <StatCard
          title="مشتريات وتوريدات اليوم"
          value={formatCurrency(124000)}
          subtitle="2 شحنة (حديد + أسمنت)"
          icon={<ShoppingCart className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="رصيد الخزينة المتاح"
          value={formatCurrency(182300)}
          subtitle="الخزينة الرئيسية + عهدة البيع"
          icon={<Wallet className="w-5 h-5 text-status-blue" />}
        />
        <StatCard
          title="أصناف تحت حد الطلب"
          value="4 أصناف"
          subtitle="يلزم إصدار أوامر شراء عاجلة"
          icon={<AlertTriangle className="w-5 h-5 text-status-amber" />}
        />
      </div>

      {/* Accounting & Inventory Guard Alert */}
      <div className="mb-6 p-3.5 bg-brand-soft border border-[#ffe2ce] rounded-card flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#8c400d] leading-relaxed">
          <strong className="font-extrabold text-[#743409] block mb-0.5">
            الضابط المحاسبي الصارم لنظام المخازن:
          </strong>
          التكاليف التاريخية وأسعار الفواتير المعتمدة مقفلة بصفة نهائية. عند ارتفاع أسعار الأسمنت أو الحديد في السوق اليوم، لا تتأثر فواتير الأمس ولا تحسب أي خسارة تاريخية بأثر رجعي.
        </div>
      </div>

      {/* Grid: Recent Operations & Stock Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">آخر العمليات المعتمدة</h2>
              <p className="text-[11px] text-muted">أحدث الفواتير، المقبوضات، وأذون الاستلام</p>
            </div>
            <Link href="/sales">
              <Button variant="ghost" size="sm" className="text-brand text-xs">
                <span>عرض الكل</span>
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-muted border-b border-border/80">
                  <th className="py-2.5 font-bold">رقم المستند</th>
                  <th className="py-2.5 font-bold">النوع والطرف</th>
                  <th className="py-2.5 font-bold">المخزن</th>
                  <th className="py-2.5 font-bold">القيمة</th>
                  <th className="py-2.5 font-bold">طريقة السداد</th>
                  <th className="py-2.5 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3 font-extrabold text-foreground">INV-2026-0042</td>
                  <td className="py-3">
                    <span className="font-bold block text-foreground">شركة المعمار الحديث</span>
                    <span className="text-[10px] text-muted">فاتورة مبيعات (10 طن حديد)</span>
                  </td>
                  <td className="py-3 text-muted">ساحة الحديد</td>
                  <td className="py-3 font-extrabold text-foreground">{formatCurrency(425000)}</td>
                  <td className="py-3"><StatusBadge label="آجل (30 يوم)" variant="amber" /></td>
                  <td className="py-3"><StatusBadge label="معتمدة" variant="green" /></td>
                </tr>
                <tr className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3 font-extrabold text-foreground">REC-2026-0018</td>
                  <td className="py-3">
                    <span className="font-bold block text-foreground">مقاولات الصفا</span>
                    <span className="text-[10px] text-muted">سند قبض دفعة مديونية</span>
                  </td>
                  <td className="py-3 text-muted">الخزينة الرئيسية</td>
                  <td className="py-3 font-extrabold text-status-green">{formatCurrency(50000)}</td>
                  <td className="py-3"><StatusBadge label="نقدي" variant="green" /></td>
                  <td className="py-3"><StatusBadge label="مسدد بالخزينة" variant="green" /></td>
                </tr>
                <tr className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3 font-extrabold text-foreground">GR-2026-0012</td>
                  <td className="py-3">
                    <span className="font-bold block text-foreground">أسمنت السويدي</span>
                    <span className="text-[10px] text-muted">إذن استلام بضاعة (40 طن)</span>
                  </td>
                  <td className="py-3 text-muted">مخزن الأسمنت</td>
                  <td className="py-3 font-extrabold text-foreground">{formatCurrency(116000)}</td>
                  <td className="py-3"><StatusBadge label="توريد مورد" variant="blue" /></td>
                  <td className="py-3"><StatusBadge label="تم الاستلام" variant="green" /></td>
                </tr>
                <tr className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3 font-extrabold text-foreground">INV-2026-0041</td>
                  <td className="py-3">
                    <span className="font-bold block text-foreground">عميل نقدي عام</span>
                    <span className="text-[10px] text-muted">50 شيكارة أسمنت مقاوم</span>
                  </td>
                  <td className="py-3 text-muted">مخزن الأسمنت</td>
                  <td className="py-3 font-extrabold text-foreground">{formatCurrency(7250)}</td>
                  <td className="py-3"><StatusBadge label="نقدي" variant="green" /></td>
                  <td className="py-3"><StatusBadge label="معتمدة" variant="green" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Alerts & Inventory Health (1 col) */}
        <div className="space-y-6">
          {/* Low Stock Warnings */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <AlertTriangle className="w-4 h-4 text-status-amber" />
              <h2 className="text-sm font-extrabold text-foreground">تنبيهات نقص المخزون</h2>
            </div>
            <div className="space-y-3">
              <div className="p-2.5 rounded-element bg-[#fffbf5] border border-[#fde8c8]">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>حديد عز 10 مم</span>
                  <span className="text-status-red">المتاح: 4 طن</span>
                </div>
                <div className="text-[11px] text-muted mt-1 flex justify-between">
                  <span>حد إعادة الطلب: 15 طن</span>
                  <span className="text-brand font-semibold">عجز 11 طن</span>
                </div>
              </div>
              <div className="p-2.5 rounded-element bg-[#fffbf5] border border-[#fde8c8]">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>أسمنت السويدي مقاوم</span>
                  <span className="text-status-amber">المتاح: 120 شيكارة</span>
                </div>
                <div className="text-[11px] text-muted mt-1 flex justify-between">
                  <span>حد إعادة الطلب: 200 شيكارة</span>
                  <span className="text-brand font-semibold">عجز 80 شيكارة</span>
                </div>
              </div>
              <div className="p-2.5 rounded-element bg-[#fffbf5] border border-[#fde8c8]">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>رمل محاجر حرش</span>
                  <span className="text-status-red">المتاح: 15 م³</span>
                </div>
                <div className="text-[11px] text-muted mt-1 flex justify-between">
                  <span>حد إعادة الطلب: 50 م³</span>
                  <span className="text-brand font-semibold">عجز 35 م³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Pricing Reference */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-extrabold text-foreground">الأسعار الإرشادية وتكلفة الاستبدال</h2>
              </div>
              <Link href="/products">
                <span className="text-[11px] text-brand font-bold hover:underline">السجل</span>
              </Link>
            </div>
            <div className="text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted">حديد عز (طن)</span>
                <div className="text-right">
                  <b className="text-foreground block">42,500 ج.م</b>
                  <span className="text-[10px] text-muted">استبدال: 41,200 ج.م</span>
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted">أسمنت مقاوم (شيكارة)</span>
                <div className="text-right">
                  <b className="text-foreground block">145 ج.م</b>
                  <span className="text-[10px] text-muted">استبدال: 138 ج.م</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">رمل محاجر (م³)</span>
                <div className="text-right">
                  <b className="text-foreground block">180 ج.م</b>
                  <span className="text-[10px] text-muted">استبدال: 140 ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
