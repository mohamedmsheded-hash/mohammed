"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveSalesInvoice } from "@/server/actions/sales";
import { createClient } from "@/lib/supabase/client";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  warehouse_name: string;
  subtotal: number;
  discount_amount: number;
  freight_charge: number;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  payment_type: "CASH" | "CREDIT" | "SPLIT";
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "CANCELLED" | "REVERSED";
  historical_cogs: number;
  historical_profit: number;
}

const initialInvoices: InvoiceRow[] = [
  {
    id: "inv-001",
    invoice_number: "INV-2026-0042",
    customer_name: "شركة المعمار الحديث للمقاولات",
    invoice_date: "2026-11-21",
    warehouse_name: "ساحة تشوين حديد التسليح",
    subtotal: 425000,
    discount_amount: 0,
    freight_charge: 3500,
    total_amount: 428500,
    paid_amount: 100000,
    remaining_balance: 328500,
    payment_type: "CREDIT",
    status: "APPROVED",
    historical_cogs: 412000,
    historical_profit: 16500,
  },
  {
    id: "inv-002",
    invoice_number: "INV-2026-0041",
    customer_name: "عميل نقدي عام (مبيعات حرة)",
    invoice_date: "2026-11-21",
    warehouse_name: "مخزن الأسمنت والجبس المغطى",
    subtotal: 7250,
    discount_amount: 0,
    freight_charge: 0,
    total_amount: 7250,
    paid_amount: 7250,
    remaining_balance: 0,
    payment_type: "CASH",
    status: "APPROVED",
    historical_cogs: 6500,
    historical_profit: 750,
  },
  {
    id: "inv-003",
    invoice_number: "INV-2026-0043",
    customer_name: "مقاولات الشرق (المهندس عادل)",
    invoice_date: "2026-11-21",
    warehouse_name: "مخزن الأسمنت والجبس المغطى",
    subtotal: 29000,
    discount_amount: 500,
    freight_charge: 1000,
    total_amount: 29500,
    paid_amount: 0,
    remaining_balance: 29500,
    payment_type: "CREDIT",
    status: "PENDING_APPROVAL",
    historical_cogs: 26000,
    historical_profit: 3500,
  },
  {
    id: "inv-004",
    invoice_number: "INV-2026-0044",
    customer_name: "عميل نقدي عام",
    invoice_date: "2026-11-21",
    warehouse_name: "ساحة تشوين حديد التسليح",
    subtotal: 84600,
    discount_amount: 600,
    freight_charge: 1200,
    total_amount: 85200,
    paid_amount: 0,
    remaining_balance: 85200,
    payment_type: "CASH",
    status: "DRAFT",
    historical_cogs: 0,
    historical_profit: 0,
  },
];

export default function SalesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadInvoices = async () => {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select("id, invoice_number, invoice_date, status, payment_type, subtotal, discount_amount, freight_charge, total_amount, paid_amount, remaining_balance, customers(name_ar), warehouses(name_ar)")
        .order("invoice_date", { ascending: false });

      if (error) {
        alert(`فشل تحميل فواتير المبيعات: ${error.message}`);
        return;
      }

      setInvoices((data || []).map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customers?.name_ar || "عميل نقدي عام",
        invoice_date: invoice.invoice_date,
        warehouse_name: invoice.warehouses?.name_ar || "-",
        subtotal: Number(invoice.subtotal || 0),
        discount_amount: Number(invoice.discount_amount || 0),
        freight_charge: Number(invoice.freight_charge || 0),
        total_amount: Number(invoice.total_amount || 0),
        paid_amount: Number(invoice.paid_amount || 0),
        remaining_balance: Number(invoice.remaining_balance || 0),
        payment_type: invoice.payment_type,
        status: invoice.status,
        historical_cogs: 0,
        historical_profit: 0,
      })));
    };

    void loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "APPROVED" && inv.status === "APPROVED") ||
      (activeFilter === "PENDING" && inv.status === "PENDING_APPROVAL") ||
      (activeFilter === "DRAFT" && inv.status === "DRAFT") ||
      (activeFilter === "CREDIT" && inv.payment_type === "CREDIT");

    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const handleApproveInvoice = async (invoice: InvoiceRow) => {
    if (!confirm(`هل أنت متأكد من اعتماد الفاتورة ${invoice.invoice_number}؟ الاعتماد سيخصم المخزون فورياً ويقفل التكلفة والربح بشكل نهائي.`)) {
      return;
    }

    setApprovingId(invoice.id);
    try {
      await approveSalesInvoice(invoice.id);

      setInvoices((prev) =>
        prev.map((i) => (i.id === invoice.id ? { ...i, status: "APPROVED" } : i))
      );
      alert(`تم اعتماد الفاتورة ${invoice.invoice_number} بنجاح وقيد الحركات المخزنية والمالية.`);
    } catch (err: any) {
      alert(`خطأ أثناء الاعتماد: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <AppShell title="المبيعات والفواتير" breadcrumb="المبيعات">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            إدارة فواتير المبيعات والتحصيل
          </h1>
          <p className="text-muted text-xs mt-1">
            إصدار فواتير البيع النقدية والآجلة، اعتماد الحركات، وتثبيت التكاليف التاريخية المحققة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/new">
            <Button variant="default" size="default">
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء فاتورة جديدة</span>
            </Button>
          </Link>
          <Button variant="soft" size="default">
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي مبيعات اليوم"
          value={formatCurrency(550450)}
          subtitle="4 فواتير محررة اليوم"
          icon={<Receipt className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="المحصل نقداً اليوم"
          value={formatCurrency(107250)}
          subtitle="مقبوضات بالخزينة"
          icon={<CheckCircle2 className="w-5 h-5 text-status-green" />}
        />
        <StatCard
          title="المبيعات الآجلة والمتبقي"
          value={formatCurrency(443200)}
          subtitle="مديونيات عملاء مستحقة"
          icon={<AlertCircle className="w-5 h-5 text-status-amber" />}
        />
        <StatCard
          title="فواتير بانتظار الاعتماد"
          value={invoices.filter((i) => i.status !== "APPROVED").length}
          subtitle="تتطلب مراجعة أمين المخزن/المدير"
          icon={<Clock className="w-5 h-5 text-status-blue" />}
        />
      </div>

      {/* Historical Guarantee Banner */}
      <div className="mb-6 p-3.5 bg-brand-soft border border-[#ffe2ce] rounded-card flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
        <div className="text-foreground leading-relaxed">
          <strong className="text-brand-dark block font-bold mb-0.5">
            ثبات تكلفة وأرباح الفواتير السابقة:
          </strong>
          كل فاتورة معتمدة بتسجل سعر البيع وتكلفة البضاعة في لحظتها وبتقفل عليها تماماً. حتى لو أسعار الحديد أو الأسمنت زادت في السوق بعد كده، ربح وتكلفة الفواتير القديمة بيفضلوا ثابتين ومبيغيروش حساباتك بأثر رجعي.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {[
              { id: "ALL", label: "جميع الفواتير" },
              { id: "APPROVED", label: "معتمدة ومسجلة" },
              { id: "PENDING", label: "بانتظار الاعتماد" },
              { id: "DRAFT", label: "مسودات" },
              { id: "CREDIT", label: "مبيعات آجلة" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-element text-xs font-bold transition-colors whitespace-nowrap ${
                  activeFilter === tab.id
                    ? "bg-brand text-white shadow-btn"
                    : "bg-[#f8fafc] text-muted hover:text-foreground border border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة أو العميل..."
              className="w-full bg-[#f8fafc] border border-border rounded-element py-1.5 pr-8 pl-3 text-xs outline-none focus:border-brand transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-muted border-b border-border">
                <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                <th className="py-3 px-4 font-bold">العميل / المقاول</th>
                <th className="py-3 px-4 font-bold">التاريخ</th>
                <th className="py-3 px-4 font-bold">المخزن المنصرف منه</th>
                <th className="py-3 px-4 font-bold">الإجمالي الصافي</th>
                <th className="py-3 px-4 font-bold">المدفوع</th>
                <th className="py-3 px-4 font-bold">المتبقي</th>
                <th className="py-3 px-4 font-bold">طريقة السداد</th>
                <th className="py-3 px-4 font-bold">الحالة</th>
                <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-foreground">{inv.invoice_number}</td>
                  <td className="py-3.5 px-4 font-bold text-foreground">{inv.customer_name}</td>
                  <td className="py-3.5 px-4 text-muted">{formatDate(inv.invoice_date)}</td>
                  <td className="py-3.5 px-4 text-muted">{inv.warehouse_name}</td>
                  <td className="py-3.5 px-4 font-extrabold text-foreground">
                    {formatCurrency(inv.total_amount)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-status-green">
                    {formatCurrency(inv.paid_amount)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-status-red">
                    {formatCurrency(inv.remaining_balance)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      label={inv.payment_type === "CASH" ? "نقدي" : inv.payment_type === "CREDIT" ? "آجل" : "سداد مجزأ"}
                      variant={inv.payment_type === "CASH" ? "green" : "amber"}
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      label={
                        inv.status === "APPROVED"
                          ? "معتمدة ومقفلة"
                          : inv.status === "PENDING_APPROVAL"
                          ? "بانتظار الاعتماد"
                          : inv.status === "DRAFT"
                          ? "مسودة"
                          : "ملغاة"
                      }
                      variant={
                        inv.status === "APPROVED"
                          ? "green"
                          : inv.status === "PENDING_APPROVAL"
                          ? "blue"
                          : "amber"
                      }
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {inv.status !== "APPROVED" && (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={approvingId === inv.id}
                          onClick={() => handleApproveInvoice(inv)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{approvingId === inv.id ? "جارٍ..." : "اعتماد"}</span>
                        </Button>
                      )}
                      <Link href={`/sales/${inv.id}`}>
                        <Button variant="secondary" size="sm" title="عرض وطباعة الفاتورة">
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض الفاتورة</span>
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
