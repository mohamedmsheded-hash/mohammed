"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  ArrowRight,
  Receipt,
  Download,
  Building2,
  CheckCircle2,
  Phone,
  QrCode,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params?.id as string || "INV-2026-0042";
  const [printMode, setPrintMode] = useState<"A4" | "THERMAL">("A4");

  const invoiceData = {
    invoice_number: invoiceId.startsWith("INV") ? invoiceId : "INV-2026-0042",
    invoice_date: "2026-11-21",
    customer_name: "شركة المعمار الحديث للمقاولات",
    customer_phone: "01011223344",
    customer_tax_id: "234-567-890",
    customer_address: "التجمع الخامس - كمبوند زهرة العاصمة (قطعة 42B)",
    warehouse_name: "ساحة تشوين حديد التسليح - المنطقة الصناعية",
    payment_type: "CREDIT",
    cashier_name: "سارة حسن عبد الرحمن",
    approved_by_name: "أحمد عبد الله مصطفى (مدير الحسابات)",
    driver_name: "محمد رجب عبد الله",
    vehicle_plate: "ط س ر 7841",
    lines: [
      {
        code: "PRD-STL-EZZ-10",
        name: "حديد تسليح عز 10 مم مشرشر أطوال",
        spec: "قطر 10 مم - وزن نظري 0.617 كجم/م",
        unit: "طن",
        quantity: 15.0,
        unit_price: 42500,
        total: 637500,
      },
      {
        code: "PRD-STL-EZZ-12",
        name: "حديد تسليح عز 12 مم مشرشر أطوال",
        spec: "قطر 12 مم - وزن نظري 0.888 كجم/م",
        unit: "طن",
        quantity: 10.0,
        unit_price: 42200,
        total: 422000,
      },
    ],
    subtotal: 1059500,
    freight_charge: 3500,
    discount: 0,
    total_amount: 1063000,
    paid_amount: 300000,
    remaining_balance: 763000,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white text-gray-900 font-sans">
      {/* Top Action Bar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <Link
          href="/sales"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة المبيعات</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPrintMode("A4")}
              className={`px-3 py-1 rounded-md transition-all ${
                printMode === "A4"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              فاتورة A4 رسمية
            </button>
            <button
              onClick={() => setPrintMode("THERMAL")}
              className={`px-3 py-1 rounded-md transition-all ${
                printMode === "THERMAL"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              إيصال كاشير (80 مم)
            </button>
          </div>

          <Button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 text-xs shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة الآن</span>
          </Button>
        </div>
      </div>

      {/* Invoice Document Body */}
      {printMode === "A4" ? (
        /* A4 Full Official Invoice */
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-lg print:border-none print:shadow-none print:p-6 print:max-w-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-6 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xl">
                  ن
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900">
                    مؤسسة النصر لتجارة وتوزيع مواد البناء
                  </h1>
                  <p className="text-xs text-gray-500 font-semibold">
                    وكيل معتمد لمصانع حديد التسليح والأسمنت والجبس والمحاجر
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5 pt-2">
                <div>المركز الرئيسي: طريق الواحات - المنطقة الصناعية - 6 أكتوبر</div>
                <div>هاتف: 0233445566 | موبايل: 01012345678 / 01122334455</div>
                <div>سجل تجاري: 109823 | بطاقة ضريبية: 492-381-900</div>
              </div>
            </div>

            {/* Document Stamp & QR Box */}
            <div className="text-left font-mono">
              <div className="inline-block bg-orange-50 border border-orange-200 text-orange-950 px-3 py-1 rounded-md text-sm font-extrabold mb-2">
                فاتورة مبيعات ضريبية
              </div>
              <div className="text-sm font-bold text-gray-900">{invoiceData.invoice_number}</div>
              <div className="text-xs text-gray-500">{invoiceData.invoice_date}</div>
              <div className="w-20 h-20 border border-gray-300 rounded-md mt-2 flex items-center justify-center bg-gray-50 text-gray-400">
                <QrCode className="w-14 h-14 text-gray-800" />
              </div>
            </div>
          </div>

          {/* Client & Dispatch Info */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs mb-6">
            <div className="space-y-1">
              <span className="font-bold text-gray-700 block">بيانات العميل / المقاول:</span>
              <div className="text-sm font-extrabold text-gray-900">{invoiceData.customer_name}</div>
              <div className="text-gray-600">هاتف: {invoiceData.customer_phone}</div>
              <div className="text-gray-600">موقع التسليم: {invoiceData.customer_address}</div>
              {invoiceData.customer_tax_id && (
                <div className="text-gray-600">رقم التسجيل الضريبي: {invoiceData.customer_tax_id}</div>
              )}
            </div>

            <div className="space-y-1 text-left font-mono">
              <span className="font-bold text-gray-700 block font-sans text-right">بيانات الصرف والنقل:</span>
              <div className="text-gray-800 text-right font-sans">
                المخزن المصدر: <span className="font-bold">{invoiceData.warehouse_name}</span>
              </div>
              <div className="text-gray-800 text-right font-sans">
                السائق واللوحة: <span className="font-bold">{invoiceData.driver_name} ({invoiceData.vehicle_plate})</span>
              </div>
              <div className="text-gray-800 text-right font-sans">
                طريقة السداد: <span className="font-bold text-primary">حساب آجل (CREDIT)</span>
              </div>
              <div className="text-gray-800 text-right font-sans">
                المسؤول: <span>{invoiceData.cashier_name}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">م</th>
                  <th className="py-3 px-4">كود وبيان الصنف ومواصفاته</th>
                  <th className="py-3 px-4 text-center">الوحدة</th>
                  <th className="py-3 px-4 text-center">الكمية</th>
                  <th className="py-3 px-4 text-left font-mono">سعر الوحدة</th>
                  <th className="py-3 px-4 text-left font-mono">الإجمالي الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {invoiceData.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-center font-bold text-gray-500 font-sans">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-extrabold text-gray-900 text-sm">{line.name}</div>
                      <div className="text-gray-500 text-[11px] font-mono">{line.code} | {line.spec}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-sans">{line.unit}</td>
                    <td className="py-3 px-4 text-center font-bold text-sm text-gray-900">
                      {line.quantity.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-left text-gray-700">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-sm text-gray-900">
                      {formatCurrency(line.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
            <div className="text-xs text-gray-500 max-w-sm space-y-1">
              <div className="font-bold text-gray-700">شروط وإقرارات الاستلام:</div>
              <p className="leading-relaxed">
                استلمت أنا الموقع أدناه البضاعة المبينة بعاليه كاملة وسليمة ومطابقة للمواصفات والأطوال والأوزان، وتعتبر هذه الفاتورة إقراراً قاطعاً بالمديونية واجبة الأداء.
              </p>
            </div>

            <div className="w-full sm:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-gray-600">
                <span className="font-sans">مجموع البنود:</span>
                <span>{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-sans">نولون ونقل للموقع:</span>
                <span>{formatCurrency(invoiceData.freight_charge)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-sans">خصم تجاري معتمد:</span>
                <span>{formatCurrency(invoiceData.discount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                <span className="font-sans">صافي الفاتورة:</span>
                <span className="text-primary">{formatCurrency(invoiceData.total_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-700 pt-1 border-t border-dashed border-gray-200">
                <span className="font-sans">المسدد نقداً:</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(invoiceData.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span className="font-sans text-rose-700">المتبقي على الحساب:</span>
                <span className="text-rose-700">{formatCurrency(invoiceData.remaining_balance)}</span>
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs border-t-2 border-gray-200 pt-6">
            <div>
              <div className="text-gray-500 mb-8 font-semibold">أمين المخزن المسلّم</div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
                التوقيع: .....................
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-8 font-semibold">السائق الناقل</div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
                {invoiceData.driver_name}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-8 font-semibold">مدير الحسابات</div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
                معتمد إلكترونياً
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-8 font-semibold">توقيع المستلم بالموقع</div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-gray-800">
                التوقيع / الختم: ............
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 80mm Thermal Cashier Receipt */
        <div className="max-w-[340px] mx-auto bg-white p-4 rounded-xl border border-gray-300 shadow-md font-mono text-xs text-gray-900 print:shadow-none print:border-none print:max-w-full">
          <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            <h2 className="font-black text-sm">مؤسسة النصر لمواد البناء</h2>
            <p className="text-[10px] text-gray-500">طريق الواحات - 6 أكتوبر | ت: 0233445566</p>
            <p className="text-[10px] text-gray-500">س.ت: 109823 | ب.ض: 492-381-900</p>
            <div className="font-bold text-xs pt-1">{invoiceData.invoice_number}</div>
            <div className="text-[10px] text-gray-500">{invoiceData.invoice_date}</div>
          </div>

          <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-300 pb-2 mb-2 font-sans">
            <div>العميل: <span className="font-bold">{invoiceData.customer_name}</span></div>
            <div>المخزن: {invoiceData.warehouse_name}</div>
            <div>الكاشير: {invoiceData.cashier_name}</div>
          </div>

          <div className="space-y-2 border-b border-dashed border-gray-300 pb-3 mb-3">
            {invoiceData.lines.map((l, i) => (
              <div key={i} className="text-[11px]">
                <div className="font-bold font-sans">{l.name}</div>
                <div className="flex justify-between text-gray-600">
                  <span>{l.quantity} {l.unit} × {l.unit_price}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(l.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs border-b border-dashed border-gray-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span>المجموع:</span>
              <span>{formatCurrency(invoiceData.subtotal)}</span>
            </div>
            {invoiceData.freight_charge > 0 && (
              <div className="flex justify-between">
                <span>النولون:</span>
                <span>{formatCurrency(invoiceData.freight_charge)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-200">
              <span>الإجمالي الصافي:</span>
              <span>{formatCurrency(invoiceData.total_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>المدفوع:</span>
              <span>{formatCurrency(invoiceData.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-700">
              <span>المتبقي:</span>
              <span>{formatCurrency(invoiceData.remaining_balance)}</span>
            </div>
          </div>

          <div className="text-center space-y-2 pt-1">
            <div className="w-20 h-20 mx-auto flex items-center justify-center border border-gray-300 rounded-md">
              <QrCode className="w-16 h-16 text-gray-800" />
            </div>
            <p className="text-[10px] text-gray-500 font-sans">
              شكراً لتعاملكم معنا | البضاعة التي تخرج سليمة ومطابقة لا ترد بعد 14 يوماً
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
