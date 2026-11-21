"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Building2,
  Truck,
  Scale,
  CheckCircle2,
  Calendar,
  Layers,
  Printer,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseReceiptRow {
  id: string;
  receipt_number: string;
  supplier_name: string;
  receipt_date: string;
  warehouse_name: string;
  truck_plate: string;
  net_weight_kg: number;
  base_cost: number;
  freight_expense: number;
  unloading_expense: number;
  total_landed_cost: number;
  status: "RECEIVED" | "VERIFIED" | "PENDING";
  items_summary: string;
}

const initialReceipts: PurchaseReceiptRow[] = [
  {
    id: "rcpt-001",
    receipt_number: "GR-2026-0009",
    supplier_name: "شركة العز لصناعة حديد التسليح",
    receipt_date: "2026-11-20",
    warehouse_name: "ساحة تشوين حديد التسليح",
    truck_plate: "أ ب ج 4589",
    net_weight_kg: 28500,
    base_cost: 1168500,
    freight_expense: 5700,
    unloading_expense: 1425,
    total_landed_cost: 1175625,
    status: "VERIFIED",
    items_summary: "28.5 طن حديد تسليح عز 12 مم",
  },
  {
    id: "rcpt-002",
    receipt_number: "GR-2026-0008",
    supplier_name: "شركة السويدي للأسمنت",
    receipt_date: "2026-11-19",
    warehouse_name: "مخزن الأسمنت والجبس المغطى",
    truck_plate: "د هـ و 1234",
    net_weight_kg: 50000,
    base_cost: 125000,
    freight_expense: 4000,
    unloading_expense: 1000,
    total_landed_cost: 130000,
    status: "VERIFIED",
    items_summary: "1000 شيكارة أسمنت مقاوم 50 كجم",
  },
  {
    id: "rcpt-003",
    receipt_number: "GR-2026-0010",
    supplier_name: "محاجر العاصمة للرمل والزلط",
    receipt_date: "2026-11-21",
    warehouse_name: "الساحة المفتوحة",
    truck_plate: "س ص ع 7890",
    net_weight_kg: 30000,
    base_cost: 7000,
    freight_expense: 1500,
    unloading_expense: 0,
    total_landed_cost: 8500,
    status: "RECEIVED",
    items_summary: "50 متر مكعب رمل محاجر حرش",
  },
];

export default function PurchasesPage() {
  const [receipts] = useState<PurchaseReceiptRow[]>(initialReceipts);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReceipts = receipts.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier_name.includes(searchQuery) ||
      r.items_summary.includes(searchQuery)
  );

  return (
    <AppShell title="المشتريات والاستلام" breadcrumb="المشتريات">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            أذون استلام المشتريات وتكاليف التوريد
          </h1>
          <p className="text-muted text-xs mt-1">
            تسجيل شحنات التوريد من المصانع، فحص أوزان الميزان البسكول، وتوزيع النولون والعتالة على تكلفة الوحدة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button variant="default" size="default">
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل استلام بضاعة</span>
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
          title="مشتريات الشهر المعتمدة"
          value={formatCurrency(1314125)}
          subtitle="3 شحنات واردة رئيسية"
          icon={<ShoppingCart className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="مصاريف النقل والنولون المحملة"
          value={formatCurrency(11200)}
          subtitle="موزعة على تكلفة الوحدات"
          icon={<Truck className="w-5 h-5 text-status-blue" />}
        />
        <StatCard
          title="مصاريف العتالة والمشال"
          value={formatCurrency(2425)}
          subtitle="محملة على طبقات التكلفة"
          icon={<Layers className="w-5 h-5 text-status-amber" />}
        />
        <StatCard
          title="إجمالي أوزان الشحنات"
          value="108.5 طن"
          subtitle="مطابقة لميزان البسكول"
          icon={<Scale className="w-5 h-5 text-status-green" />}
        />
      </div>

      {/* Invariant Note */}
      <div className="mb-6 p-3 bg-white border border-border rounded-card flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-muted">
          <CheckCircle2 className="w-4 h-4 text-status-green" />
          <span>
            تكلفة كل شحنة بتتحسب شاملة (سعر الشراء + النولون + العتالة) وبتتسجل فوراً كطبقة جديدة في المخزن — الوارد أولاً يصرف أولاً.
          </span>
        </div>
        <span className="text-brand font-bold text-[11px] bg-brand-soft px-2.5 py-1 rounded-full">
          الوارد أولاً يصرف أولاً ✓
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-card mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الإذن أو المورد أو المادة..."
              className="w-full bg-[#f8fafc] border border-border rounded-element py-1.5 pr-8 pl-3 text-xs outline-none focus:border-brand transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-muted border-b border-border">
                <th className="py-3 px-4 font-bold">رقم إذن الاستلام</th>
                <th className="py-3 px-4 font-bold">المورد / المصنع</th>
                <th className="py-3 px-4 font-bold">تاريخ التوريد</th>
                <th className="py-3 px-4 font-bold">المخزن المستلم</th>
                <th className="py-3 px-4 font-bold">بيان البضاعة والوزن</th>
                <th className="py-3 px-4 font-bold">سعر البضاعة الصافي</th>
                <th className="py-3 px-4 font-bold">النولون والعتالة</th>
                <th className="py-3 px-4 font-bold">التكلفة الشاملة للطبقة</th>
                <th className="py-3 px-4 font-bold text-center">الحالة</th>
                <th className="py-3 px-4 font-bold text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReceipts.map((rcpt) => (
                <tr key={rcpt.id} className="hover:bg-black/[0.01] transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-foreground">{rcpt.receipt_number}</td>
                  <td className="py-3.5 px-4 font-bold text-foreground">{rcpt.supplier_name}</td>
                  <td className="py-3.5 px-4 text-muted">{formatDate(rcpt.receipt_date)}</td>
                  <td className="py-3.5 px-4 text-muted">{rcpt.warehouse_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="block font-bold text-foreground">{rcpt.items_summary}</span>
                    <span className="text-[10px] text-muted">
                      شاحنة: {rcpt.truck_plate} | صافي: {(rcpt.net_weight_kg / 1000).toFixed(2)} طن
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {formatCurrency(rcpt.base_cost)}
                  </td>
                  <td className="py-3.5 px-4 text-status-blue font-semibold">
                    +{formatCurrency(rcpt.freight_expense + rcpt.unloading_expense)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-brand">
                    {formatCurrency(rcpt.total_landed_cost)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge
                      label={rcpt.status === "VERIFIED" ? "تم التحقق ومطابقة الميزان" : "قيد الاستلام"}
                      variant={rcpt.status === "VERIFIED" ? "green" : "blue"}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-brand font-medium px-2 py-1 rounded-lg hover:bg-brand-soft transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة
                    </button>
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
