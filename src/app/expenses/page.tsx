"use client";

import React, { useState } from "react";
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Wallet,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Zap,
  Building,
  Coffee,
  UserCheck,
  X,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseRow {
  id: string;
  expense_number: string;
  expense_date: string;
  category: "RENT" | "UTILITIES" | "MAINTENANCE" | "SALARIES" | "BUFFET" | "GENERAL";
  category_label_ar: string;
  amount: number;
  cashbox_name: string;
  paid_to: string;
  notes: string;
  receipt_image_url?: string;
  created_by_name: string;
}

const initialExpenses: ExpenseRow[] = [
  {
    id: "exp-001",
    expense_number: "EXP-2026-0042",
    expense_date: "2026-11-21",
    category: "MAINTENANCE",
    category_label_ar: "صيانة شاحنات ومعدات",
    amount: 4500,
    cashbox_name: "خزينة المعرض الرئيسية",
    paid_to: "ورشة النصر لصيانة سيارات النقل الثقيل",
    notes: "تغيير إطارات وتيل فرامل للشاحنة مرسيدس أكتروس ط س ر 7841",
    receipt_image_url: "https://storage.placeholder/receipt-exp-42.jpg",
    created_by_name: "أحمد عبد الله (محاسب)",
  },
  {
    id: "exp-002",
    expense_number: "EXP-2026-0041",
    expense_date: "2026-11-20",
    category: "UTILITIES",
    category_label_ar: "كهرباء ومياه ومرافق",
    amount: 3200,
    cashbox_name: "خزينة المعرض الرئيسية",
    paid_to: "شركة جنوب القاهرة لتوزيع الكهرباء",
    notes: "فاتورة استهلاك كهرباء ساحة تشوين ومخزن الأسمنت لشهر أكتوبر",
    created_by_name: "سارة حسن (كاشير)",
  },
  {
    id: "exp-003",
    expense_number: "EXP-2026-0039",
    expense_date: "2026-11-18",
    category: "BUFFET",
    category_label_ar: "بوفيه وضيافة ومستلزمات نظافة",
    amount: 850,
    cashbox_name: "درج الكاشير الصغير",
    paid_to: "هايبر ماركت التيسير",
    notes: "شاي وسكر ومطهرات واستضافة عملاء ومقاولي الشركات",
    created_by_name: "سارة حسن (كاشير)",
  },
  {
    id: "exp-004",
    expense_number: "EXP-2026-0035",
    expense_date: "2026-11-15",
    category: "RENT",
    category_label_ar: "إيجار مخازن ومقرات",
    amount: 25000,
    cashbox_name: "حساب البنك الأهلي المصري",
    paid_to: "شركة الأوقاف والاستثمار العقاري",
    notes: "إيجار ساحة تشوين حديد التسليح عن النصف الثاني لشهر نوفمبر",
    created_by_name: "أحمد عبد الله (مدير الحسابات)",
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: "MAINTENANCE" as ExpenseRow["category"],
    amount: 1000,
    cashbox_name: "خزينة المعرض الرئيسية",
    paid_to: "",
    notes: "",
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.paid_to.includes(searchTerm) ||
      e.notes.includes(searchTerm);
    const matchesCat = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const maintenanceTotal = expenses
    .filter((e) => e.category === "MAINTENANCE")
    .reduce((sum, e) => sum + e.amount, 0);
  const utilitiesTotal = expenses
    .filter((e) => e.category === "UTILITIES")
    .reduce((sum, e) => sum + e.amount, 0);
  const rentTotal = expenses
    .filter((e) => e.category === "RENT")
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paid_to || formData.amount <= 0) {
      alert("برجاء إدخال المبلغ واسم المستفيد");
      return;
    }

    const catLabels: Record<string, string> = {
      RENT: "إيجار مخازن ومقرات",
      UTILITIES: "كهرباء ومياه ومرافق",
      MAINTENANCE: "صيانة شاحنات ومعدات",
      SALARIES: "رواتب وعمالة مؤقتة",
      BUFFET: "بوفيه وضيافة",
      GENERAL: "مصروفات عامة",
    };

    const newExp: ExpenseRow = {
      id: `exp-${Date.now()}`,
      expense_number: `EXP-2026-00${expenses.length + 43}`,
      expense_date: new Date().toISOString().split("T")[0],
      category: formData.category,
      category_label_ar: catLabels[formData.category] || "مصروف عام",
      amount: Number(formData.amount),
      cashbox_name: formData.cashbox_name,
      paid_to: formData.paid_to,
      notes: formData.notes,
      created_by_name: "سارة حسن (كاشير)",
    };

    setExpenses([newExp, ...expenses]);
    setIsModalOpen(false);
    setFormData({
      category: "MAINTENANCE",
      amount: 1000,
      cashbox_name: "خزينة المعرض الرئيسية",
      paid_to: "",
      notes: "",
    });
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المصروفات التشغيلية" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              إدارة المصروفات التشغيلية والعمومية
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تسجيل المصروفات الإدارية، صيانة الشاحنات، الإيجارات، والمرافق مع الخصم الفوري من الخزينة
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>تسجيل سند مصروف جديد</span>
          </Button>
        </div>

        {/* Invariant Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">فصل مصاريف البضاعة عن المصاريف العمومية:</span>
            <p className="leading-relaxed">
              النولون والعتالة بتتسجل مع شحنة المشتريات وتتحسب على تكلفة الصنف مباشرة، أما هنا بتسجل بس المصاريف العمومية والإدارية (صيانة، بوفيه، إيجارات، كهرباء) اللي مابتخشش في تكلفة البضاعة.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المصروفات التشغيلية"
            value={formatCurrency(totalExpenses)}
            subtitle="الشهر الحالي (نوفمبر)"
            icon={CreditCard}
            color="primary"
          />
          <StatCard
            title="صيانة الشاحنات والمعدات"
            value={formatCurrency(maintenanceTotal)}
            subtitle="إصلاحات أسطول النقل"
            icon={Wrench}
            color="warning"
          />
          <StatCard
            title="الكهرباء والمرافق العامة"
            value={formatCurrency(utilitiesTotal)}
            subtitle="إنارة وتشغيل المستودعات"
            icon={Zap}
            color="neutral"
          />
          <StatCard
            title="إيجارات الساحات والمقرات"
            value={formatCurrency(rentTotal)}
            subtitle="أصول ومواقع مؤجرة"
            icon={Building}
            color="success"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم السند، الجهة المستفيدة، أو تفاصيل المصروف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[170px]"
            >
              <option value="ALL">جميع بنود المصروفات</option>
              <option value="MAINTENANCE">صيانة شاحنات ومعدات</option>
              <option value="UTILITIES">كهرباء ومياه ومرافق</option>
              <option value="RENT">إيجار مخازن ومقرات</option>
              <option value="BUFFET">بوفيه وضيافة</option>
              <option value="SALARIES">أجور وعمالة</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم السند والتاريخ</th>
                  <th className="py-3 px-4">بند وتصنيف المصروف</th>
                  <th className="py-3 px-4">المستفيد / الجهة المدفوع لها</th>
                  <th className="py-3 px-4">المبلغ المنصرف</th>
                  <th className="py-3 px-4">الخزينة المنصرف منها</th>
                  <th className="py-3 px-4">المرفقات</th>
                  <th className="py-3 px-4">المستخدم المعتمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900 text-sm">{exp.expense_number}</div>
                      <div className="text-gray-400 text-[11px]">{exp.expense_date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {exp.category_label_ar}
                      </span>
                      {exp.notes && (
                        <div className="text-gray-500 text-[11px] mt-0.5 italic line-clamp-1">
                          &quot;{exp.notes}&quot;
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {exp.paid_to}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-rose-700">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                        <span>{exp.cashbox_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {exp.receipt_image_url ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <Paperclip className="w-3 h-3" />
                          إيصال مرفق
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">بدون مرفق</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {exp.created_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">تسجيل سند صرف مصروف تشغيلي</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    بند المصروف *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white font-semibold"
                  >
                    <option value="MAINTENANCE">صيانة شاحنات ومعدات</option>
                    <option value="UTILITIES">كهرباء ومياه ومرافق</option>
                    <option value="RENT">إيجار مخازن ومقرات</option>
                    <option value="BUFFET">بوفيه وضيافة ومستلزمات</option>
                    <option value="SALARIES">أجور ويوميات عمالة مؤقتة</option>
                    <option value="GENERAL">مصروفات إدارية عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    المبلغ المطلوب صرفه (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الخزينة المنصرف منها *
                  </label>
                  <select
                    value={formData.cashbox_name}
                    onChange={(e) => setFormData({ ...formData, cashbox_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="خزينة المعرض الرئيسية">خزينة المعرض الرئيسية</option>
                    <option value="درج الكاشير الصغير">درج الكاشير الصغير</option>
                    <option value="حساب البنك الأهلي المصري">حساب البنك الأهلي المصري</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    المستفيد / الجهة المدفوع لها *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ورشة الأمل للميكانيكا"
                    value={formData.paid_to}
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  تفاصيل وبيان المصروف
                </label>
                <textarea
                  rows={2}
                  placeholder="شرح سبب الصرف، أرقام الشاحنات المعنية، أو تفاصيل الفاتورة..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                  صرف وقيد المصروف
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
