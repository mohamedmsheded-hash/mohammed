"use client";

import React, { useState } from "react";
import {
  Wallet,
  PlusCircle,
  FileSpreadsheet,
  Building,
  CreditCard,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createReceiptVoucherAction,
  createPaymentVoucherAction,
  closeCashSessionAction,
} from "@/server/actions/finance";

interface Cashbox {
  id: string;
  name: string;
  type: "CASH" | "BANK";
  balance: number;
}

const initialCashboxes: Cashbox[] = [
  { id: "box-001", name: "الخزينة النقدية الرئيسية", type: "CASH", balance: 50000 },
  { id: "box-002", name: "درج كاشير 1 (مبيعات التجزئة)", type: "CASH", balance: 18400 },
  { id: "box-003", name: "حساب البنك الأهلي المصري", type: "BANK", balance: 350000 },
];

interface CashMovement {
  id: string;
  date: string;
  boxName: string;
  type: "RECEIPT" | "PAYMENT" | "TRANSFER";
  amount: number;
  description: string;
  refDoc: string;
}

const initialMovements: CashMovement[] = [
  {
    id: "mov-1",
    date: "2026-11-21T11:45:00Z",
    boxName: "درج كاشير 1 (مبيعات التجزئة)",
    type: "RECEIPT",
    amount: 7250,
    description: "تحصيل فوري لفاتورة مبيعات نقدية",
    refDoc: "فاتورة INV-2026-0041",
  },
  {
    id: "mov-2",
    date: "2026-11-21T10:30:00Z",
    boxName: "الخزينة النقدية الرئيسية",
    type: "RECEIPT",
    amount: 50000,
    description: "تحصيل دفعة مديونية من شركة المعمار الحديث",
    refDoc: "سند قبض REC-2026-0018",
  },
  {
    id: "mov-3",
    date: "2026-11-20T16:00:00Z",
    boxName: "الخزينة النقدية الرئيسية",
    type: "PAYMENT",
    amount: 15000,
    description: "سداد دفعة نولون شاحنات لمقاول النقل",
    refDoc: "سند صرف PAY-2026-0005",
  },
  {
    id: "mov-4",
    date: "2026-11-20T09:00:00Z",
    boxName: "الخزينة النقدية الرئيسية",
    type: "RECEIPT",
    amount: 50000,
    description: "رصيد افتتاحي معتمد للخزينة",
    refDoc: "قيد افتتاحي",
  },
];

export default function FinancePage() {
  const [cashboxes, setCashboxes] = useState<Cashbox[]>(initialCashboxes);
  const [movements, setMovements] = useState<CashMovement[]>(initialMovements);

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Form states
  const [selectedBoxId, setSelectedBoxId] = useState(cashboxes[0].id);
  const [voucherAmount, setVoucherAmount] = useState("");
  const [voucherNotes, setVoucherNotes] = useState("");
  const [actualCashCounted, setActualCashCounted] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCashBalance = cashboxes.reduce((sum, b) => sum + b.balance, 0);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(voucherAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createReceiptVoucherAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        cashbox_id: "box00000-0000-0000-0000-000000000001",
        customer_id: "cust0000-0000-0000-0000-000000000001",
        receipt_date: "2026-11-21",
        amount,
        notes: voucherNotes || "تحصيل دفعة نقدية",
      });

      // Update local state
      const targetBox = cashboxes.find((b) => b.id === selectedBoxId);
      const newMovement: CashMovement = {
        id: `mov-${Date.now()}`,
        date: new Date().toISOString(),
        boxName: targetBox?.name || "الخزينة الرئيسية",
        type: "RECEIPT",
        amount,
        description: voucherNotes || "تحصيل نقدية",
        refDoc: `سند قبض ${res.receiptNumber}`,
      };

      setMovements([newMovement, ...movements]);
      setCashboxes((prev) =>
        prev.map((b) => (b.id === selectedBoxId ? { ...b, balance: b.balance + amount } : b))
      );

      alert(`تم تسجيل سند القبض (${res.receiptNumber}) وزيادة رصيد الخزينة بنجاح.`);
      setIsReceiptModalOpen(false);
      setVoucherAmount("");
      setVoucherNotes("");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(voucherAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (!voucherNotes.trim()) {
      alert("يرجى كتابة بيان الصرف");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPaymentVoucherAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        cashbox_id: "box00000-0000-0000-0000-000000000001",
        supplier_id: "sup00000-0000-0000-0000-000000000001",
        payment_date: "2026-11-21",
        amount,
        notes: voucherNotes,
      });

      // Update local state
      const targetBox = cashboxes.find((b) => b.id === selectedBoxId);
      const newMovement: CashMovement = {
        id: `mov-${Date.now()}`,
        date: new Date().toISOString(),
        boxName: targetBox?.name || "الخزينة الرئيسية",
        type: "PAYMENT",
        amount,
        description: voucherNotes,
        refDoc: `سند صرف ${res.paymentNumber}`,
      };

      setMovements([newMovement, ...movements]);
      setCashboxes((prev) =>
        prev.map((b) => (b.id === selectedBoxId ? { ...b, balance: b.balance - amount } : b))
      );

      alert(`تم تسجيل سند الصرف (${res.paymentNumber}) وخصم المبلغ من الخزينة بنجاح.`);
      setIsPaymentModalOpen(false);
      setVoucherAmount("");
      setVoucherNotes("");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashCounted);
    if (isNaN(actual) || actual < 0) {
      alert("يرجى إدخال المبلغ الفعلي المعدود");
      return;
    }

    const expected = cashboxes[1].balance; // Cashier drawer 18,400
    const variance = actual - expected;

    setIsSubmitting(true);
    try {
      await closeCashSessionAction({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        cashbox_id: "box00000-0000-0000-0000-000000000001",
        expected_cash: expected,
        actual_cash_counted: actual,
        notes: `إغلاق وردية الكاشير — الفارق: ${variance} ج.م`,
      });

      alert(
        `تم إغلاق الوردية والمطابقة النقدية بنجاح. الفارق المسجل: ${
          variance === 0 ? "متطابق تماماً (0 ج.م)" : `${variance} ج.م`
        }`
      );
      setIsSessionModalOpen(false);
      setActualCashCounted("");
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="الخزنة والحسابات" breadcrumb="المالية">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            إدارة الخزائن والحسابات النقدية والبنكية
          </h1>
          <p className="text-muted text-xs mt-1">
            سندات القبض والصرف، ومتابعة حركات النقدية اليومية، وجرد ومطابقة رصيد الخزينة.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="default" onClick={() => setIsReceiptModalOpen(true)}>
            <PlusCircle className="w-4 h-4" />
            <span>سند قبض عميل</span>
          </Button>
          <Button variant="secondary" onClick={() => setIsPaymentModalOpen(true)}>
            <ArrowUpRight className="w-4 h-4 text-status-red" />
            <span>سند صرف مورد / مصاريف</span>
          </Button>
          <Button variant="outline" onClick={() => setIsSessionModalOpen(true)}>
            <SlidersHorizontal className="w-4 h-4" />
            <span>إغلاق الوردية والمطابقة</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي النقدية والأرصدة المتاحة"
          value={formatCurrency(totalCashBalance)}
          subtitle="الخزائن النقدية + البنوك"
          icon={<Wallet className="w-5 h-5 text-status-green" />}
        />
        <StatCard
          title="رصيد الخزينة الرئيسية"
          value={formatCurrency(cashboxes[0].balance)}
          subtitle="نقدية الخزينة المركزية"
          icon={<Building className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="درج كاشير مبيعات 1"
          value={formatCurrency(cashboxes[1].balance)}
          subtitle="عهدة الوردية الحالية"
          icon={<CreditCard className="w-5 h-5 text-status-blue" />}
        />
        <StatCard
          title="رصيد حساب البنك الأهلي"
          value={formatCurrency(cashboxes[2].balance)}
          subtitle="تحويلات وشيكات معتمدة"
          icon={<CheckCircle2 className="w-5 h-5 text-status-green" />}
        />
      </div>

      {/* Financial Invariant Guard Note */}
      <div className="mb-6 p-3.5 bg-brand-soft border border-[#ffe2ce] rounded-card flex items-start gap-3 text-xs">
        <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
        <div className="text-foreground leading-relaxed">
          <strong className="text-brand-dark block font-bold mb-0.5">
            انضباط حركة النقدية والخزائن:
          </strong>
          كل حركة قبض أو صرف بتتسجل فوراً برقم سند رسمي. ممنوع مسح أو تعديل أي حركة سابقة لضمان مطابقة رصيد الدرج الفعلي مع الدفاتر، وأي تسوية بتتم بسند تسوية أو قيد عكسي معتمد.
        </div>
      </div>

      {/* Cash Movements Ledger Table */}
      <div className="bg-surface border border-border rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">
              سجل حركات الخزينة والبنك
            </h2>
            <p className="text-[11px] text-muted">
              سجل تفصيلي بكافة المقبوضات والمدفوعات والمطابقات اليومية
            </p>
          </div>
          <span className="text-xs text-muted font-bold font-mono">
            {movements.length} حركات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-muted border-b border-border">
                <th className="py-3 px-4 font-bold">التاريخ والتوقيت</th>
                <th className="py-3 px-4 font-bold">الخزينة المتأثرة</th>
                <th className="py-3 px-4 font-bold">نوع الحركة</th>
                <th className="py-3 px-4 font-bold">المبلغ</th>
                <th className="py-3 px-4 font-bold">البيان والملاحظات</th>
                <th className="py-3 px-4 font-bold">مستند المصدر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.map((m) => {
                const isReceipt = m.type === "RECEIPT";
                return (
                  <tr key={m.id} className="hover:bg-black/[0.01]">
                    <td className="py-3 px-4 text-muted">{formatDate(m.date)}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{m.boxName}</td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={isReceipt ? "قبض / تحصيل وارد" : "صرف / سداد صادر"}
                        variant={isReceipt ? "green" : "red"}
                      />
                    </td>
                    <td className="py-3 px-4 font-black text-sm">
                      <span className={isReceipt ? "text-status-green" : "text-status-red"}>
                        {isReceipt ? "+" : "-"}
                        {formatCurrency(m.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{m.description}</td>
                    <td className="py-3 px-4 font-semibold text-brand">{m.refDoc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-foreground mb-1">
              تحرير سند قبض نقدية
            </h3>
            <p className="text-xs text-muted mb-4">
              إثبات تحصيل نقدية وتخفيض مديونية العميل وقيد الحركة بالخزينة.
            </p>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">الخزينة المستلمة</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 font-bold outline-none focus:border-brand"
                >
                  {cashboxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (الرصيد: {formatCurrency(b.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">المبلغ المحصل (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  placeholder="المبلغ..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 font-bold text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">البيان والملاحظات</label>
                <textarea
                  rows={2}
                  value={voucherNotes}
                  onChange={(e) => setVoucherNotes(e.target.value)}
                  placeholder="مثال: سداد دفعة مديونية من شركة المعمار الحديث..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الحفظ..." : "اعتماد سند القبض"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-foreground mb-1">
              تحرير سند صرف نقدية
            </h3>
            <p className="text-xs text-muted mb-4">
              صرف نقدية لسداد مورد أو مصروفات تشغيلية مع خصم رصيد الخزينة.
            </p>

            <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">الخزينة المنصرف منها</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 font-bold outline-none focus:border-brand"
                >
                  {cashboxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (الرصيد: {formatCurrency(b.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">المبلغ المصروف (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  placeholder="المبلغ..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 font-bold text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">بيان الصرف (إلزامي)</label>
                <textarea
                  required
                  rows={2}
                  value={voucherNotes}
                  onChange={(e) => setVoucherNotes(e.target.value)}
                  placeholder="مثال: سداد نولون نقل، أو دفعة لمصنع الأسمنت..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الصرف..." : "اعتماد سند الصرف"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Closing & Reconciliation Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-foreground mb-1">
              إغلاق الوردية والمطابقة النقدية
            </h3>
            <p className="text-xs text-muted mb-4">
              مقارنة الرصيد الدفتري لدرج الكاشير مع النقدية الفعلية بعد العد.
            </p>

            <form onSubmit={handleCloseSession} className="space-y-4 text-xs">
              <div className="p-3 bg-[#f8fafc] border border-border rounded-element flex justify-between items-center">
                <span className="text-muted font-bold">الرصيد الدفتري المتوقع بالدرج:</span>
                <span className="font-extrabold text-foreground text-sm">
                  {formatCurrency(cashboxes[1].balance)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  المبلغ الفعلي الموجود بالدرج بعد العد (ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(e.target.value)}
                  placeholder="المبلغ الفعلي..."
                  className="w-full bg-[#f8fafc] border border-border rounded-element p-2 font-bold text-sm outline-none focus:border-brand"
                />
              </div>

              {actualCashCounted && (
                <div
                  className={`p-3 rounded-element border text-xs font-bold flex justify-between ${
                    parseFloat(actualCashCounted) - cashboxes[1].balance === 0
                      ? "bg-status-green-bg text-status-green border-[#c2ebd5]"
                      : "bg-status-amber-bg text-status-amber border-[#fce3bc]"
                  }`}
                >
                  <span>فارق المطابقة:</span>
                  <span>
                    {parseFloat(actualCashCounted) - cashboxes[1].balance === 0
                      ? "متطابق تماماً (0.00 ج.م)"
                      : `${(parseFloat(actualCashCounted) - cashboxes[1].balance).toFixed(2)} ج.م`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsSessionModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الترحيل..." : "إغلاق الوردية وتثبيت المحضر"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
