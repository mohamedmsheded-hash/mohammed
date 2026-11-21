"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  ArrowRight,
  Wallet,
  Building2,
  CheckCircle2,
  FileText,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VoucherPrintPage() {
  const params = useParams();
  const voucherId = params?.id as string || "REC-2026-0040";

  const isReceipt = !voucherId.startsWith("PAY");

  const voucherData = {
    voucher_number: voucherId,
    voucher_date: "2026-11-21",
    type: isReceipt ? "RECEIPT" : "PAYMENT",
    amount: 100000,
    amount_in_words: "مائة ألف جنيه مصري لا غير",
    party_name: isReceipt ? "شركة المعمار الحديث للمقاولات" : "شركة العز لصناعة حديد التسليح",
    payment_method: "CASH",
    cashbox_name: "خزينة المعرض الرئيسية",
    notes: isReceipt
      ? "تحصيل نقدي تحت حساب فاتورة المبيعات رقم INV-2026-0042"
      : "سداد دفعة نقدية تحت حساب توريد حديد تسليح عز 10 مم",
    received_by_name: "سارة حسن عبد الرحمن (كاشير)",
    approved_by_name: "أحمد عبد الله مصطفى (مدير الحسابات)",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white text-gray-900 font-sans">
      {/* Top Action Bar */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <Link
          href="/finance"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لإدارة الخزينة</span>
        </Link>

        <Button
          onClick={() => window.print()}
          className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 text-xs shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة السند</span>
        </Button>
      </div>

      {/* Voucher Body (A5/Half-page official format) */}
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-lg print:border-none print:shadow-none print:p-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xl">
              ن
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">
                مؤسسة النصر لمواد البناء
              </h1>
              <p className="text-[11px] text-gray-500 font-semibold">
                طريق الواحات - 6 أكتوبر | ت: 0233445566 | س.ت: 109823
              </p>
            </div>
          </div>

          <div className="text-left font-mono">
            <div className={`inline-block px-3 py-1 rounded-md text-sm font-extrabold mb-1 ${
              isReceipt ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}>
              {isReceipt ? "سند قبض نقدية وشيكات" : "سند صرف نقدية"}
            </div>
            <div className="text-xs font-bold text-gray-800">{voucherData.voucher_number}</div>
            <div className="text-[11px] text-gray-500">{voucherData.voucher_date}</div>
          </div>
        </div>

        {/* Voucher Fields */}
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="font-bold text-gray-600">المبلغ بالأرقام:</span>
            <span className="font-mono font-extrabold text-primary text-xl">
              {formatCurrency(voucherData.amount)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-3">
            <div>
              <span className="text-gray-500 block mb-0.5">
                {isReceipt ? "استلمنا من السيد / السادة:" : "صرفنا إلى السيد / السادة:"}
              </span>
              <span className="font-extrabold text-sm text-gray-900 block">
                {voucherData.party_name}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5">مبلغ وقدره (كتابة وتفقيطاً):</span>
              <span className="font-bold text-gray-800 block">
                {voucherData.amount_in_words}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-3">
            <div>
              <span className="text-gray-500 block mb-0.5">طريقة الدفع والخزينة:</span>
              <span className="font-bold text-gray-800 block">
                نقداً - {voucherData.cashbox_name}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5">وذلك مقابل / البيان:</span>
              <span className="font-medium text-gray-800 block">
                {voucherData.notes}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 text-center text-xs pt-8 mt-6 border-t-2 border-gray-200">
          <div>
            <div className="text-gray-500 mb-8 font-semibold">
              {isReceipt ? "المسدد / الدافع" : "المستلم"}
            </div>
            <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
              التوقيع: .....................
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-8 font-semibold">أمين الخزينة / الكاشير</div>
            <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
              {voucherData.received_by_name}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-8 font-semibold">المدير المالي والحسابات</div>
            <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
              {voucherData.approved_by_name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
