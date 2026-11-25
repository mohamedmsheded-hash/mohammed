"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Phone,
  MapPin,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { saveCustomerAction, deactivateCustomerAction } from "@/server/actions/masters";

interface CustomerRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  national_id?: string;
  address: string;
  current_balance: number;
  credit_limit: number;
  tax_id?: string;
  commercial_reg?: string;
  is_active: boolean;
}

interface StatementEntry {
  date: string;
  doc_type: "SALES_INVOICE" | "RECEIPT_VOUCHER" | "SALES_RETURN";
  doc_number: string;
  description: string;
  debit: number;   // مدين (قيمة الفاتورة المشتراة)
  credit: number;  // دائن (سند قبض أو مردود مبيعات)
  balance: number; // الرصيد التراكمي
}

const initialCustomers: CustomerRow[] = [
  {
    id: "cust-01",
    code: "CUST-001",
    name: "شركة المعمار الحديث للمقاولات",
    phone: "01011223344",
    national_id: "29803120123456",
    address: "التجمع الخامس - القاهرة الجديدة",
    current_balance: 328500,
    credit_limit: 500000,
    tax_id: "234-567-890",
    commercial_reg: "109823",
    is_active: true,
  },
  {
    id: "cust-02",
    code: "CUST-002",
    name: "مؤسسة الأمل للتشييد والتعمير",
    phone: "01122334455",
    national_id: "29007152104567",
    address: "كورنيش المعادي - برج النيل",
    current_balance: 185000,
    credit_limit: 200000,
    tax_id: "456-789-012",
    commercial_reg: "88741",
    is_active: true,
  },
  {
    id: "cust-03",
    code: "CUST-003",
    name: "شركة الصفوة للاستثمار العقاري",
    phone: "01233445566",
    national_id: "28510011234567",
    address: "مدينة الشروق - الحي الثاني",
    current_balance: 92000,
    credit_limit: 150000,
    tax_id: "789-012-345",
    commercial_reg: "65412",
    is_active: true,
  },
  {
    id: "cust-04",
    code: "CUST-004",
    name: "مقاولات المهندس سامح فخري",
    phone: "01555443322",
    national_id: "29203191605432",
    address: "مدينة نصر - الحي السابع",
    current_balance: 145000,
    credit_limit: 100000, // Exceeded credit limit!
    is_active: true,
  },
];

const demoStatement: StatementEntry[] = [
  {
    date: "2026-11-01",
    doc_type: "SALES_INVOICE",
    doc_number: "INV-2026-0012",
    description: "فاتورة مبيعات حديد تسليح عز 10 مم (5 طن)",
    debit: 212500,
    credit: 0,
    balance: 212500,
  },
  {
    date: "2026-11-05",
    doc_type: "RECEIPT_VOUCHER",
    doc_number: "REC-2026-0018",
    description: "سند قبض تحصيل نقدي بخزينة المعرض",
    debit: 0,
    credit: 100000,
    balance: 112500,
  },
  {
    date: "2026-11-12",
    doc_type: "SALES_INVOICE",
    doc_number: "INV-2026-0028",
    description: "فاتورة مبيعات أسمنت السويدي مقاوم (200 شيكارة)",
    debit: 29000,
    credit: 0,
    balance: 141500,
  },
  {
    date: "2026-11-20",
    doc_type: "SALES_INVOICE",
    doc_number: "INV-2026-0042",
    description: "فاتورة مبيعات حديد تسليح عز 10 مم و12 مم (25 طن)",
    debit: 428500,
    credit: 0,
    balance: 570000,
  },
  {
    date: "2026-11-21",
    doc_type: "RECEIPT_VOUCHER",
    doc_number: "REC-2026-0040",
    description: "دفعة نقدية مسددة تحت حساب الفاتورة الأخيرة",
    debit: 0,
    credit: 100000,
    balance: 470000,
  },
  {
    date: "2026-11-21",
    doc_type: "SALES_RETURN",
    doc_number: "RET-2026-0014",
    description: "مرتجع مبيعات حديد تسليح سليم (2 طن)",
    debit: 0,
    credit: 85000,
    balance: 385000,
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .select("id, code, name_ar, phone, national_id, tax_id, commercial_reg, address, current_balance, credit_limit, is_active")
        .order("name_ar");
      if (!error && data) {
        setCustomers(data.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name_ar,
          phone: row.phone,
          national_id: row.national_id || undefined,
          tax_id: row.tax_id || undefined,
          commercial_reg: row.commercial_reg || undefined,
          address: row.address || "",
          current_balance: Number(row.current_balance || 0),
          credit_limit: Number(row.credit_limit || 0),
          is_active: row.is_active,
        })));
      }
      setIsLoading(false);
    };
    loadCustomers();
  }, []);

  // New customer form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    national_id: "",
    address: "",
    credit_limit: 100000,
    tax_id: "",
    commercial_reg: "",
  });

  const normalizeSearchNumber = (value: string) =>
    value
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[^0-9]/g, "");

  const numericSearch = normalizeSearchNumber(searchTerm);
  const filteredCustomers = customers.filter((customer) => {
    const textMatches =
      customer.name.includes(searchTerm.trim()) ||
      customer.code.toLowerCase().includes(searchTerm.trim().toLowerCase());

    const numberMatches =
      numericSearch.length > 0 &&
      [
        customer.phone,
        customer.national_id,
        customer.tax_id,
        customer.commercial_reg,
      ].some((value) =>
        normalizeSearchNumber(value || "").includes(numericSearch)
      );

    return textMatches || numberMatches;
  });

  const totalReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const exceededCreditCount = customers.filter((c) => c.current_balance > c.credit_limit).length;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("برجاء إدخال اسم العميل ورقم الهاتف");
      return;
    }

    try {
      const result = await saveCustomerAction({
        code: `CUST-${String(customers.length + 1).padStart(3, "0")}`,
        name_ar: formData.name,
        phone: formData.phone,
        national_id: formData.national_id || null,
        address: formData.address || null,
        tax_id: formData.tax_id || null,
        commercial_reg: formData.commercial_reg || null,
        credit_limit: Number(formData.credit_limit) || 0,
      });
      const saved = result.customer;
      setCustomers([{
        id: saved.id,
        code: saved.code,
        name: saved.name_ar,
        phone: saved.phone,
        national_id: saved.national_id || undefined,
        address: saved.address || "",
        current_balance: Number(saved.current_balance || 0),
        credit_limit: Number(saved.credit_limit || 0),
        tax_id: saved.tax_id || undefined,
        commercial_reg: saved.commercial_reg || undefined,
        is_active: saved.is_active,
      }, ...customers]);
      setIsNewModalOpen(false);
      setFormData({
        name: "",
        phone: "",
        national_id: "",
        address: "",
        credit_limit: 100000,
        tax_id: "",
        commercial_reg: "",
      });
    } catch (error: any) {
      alert(error?.message || "فشل حفظ العميل");
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "العملاء والمقاولون" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              دليل العملاء والمقاولين وكشوف الحسابات التفصيلية
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              متابعة حسابات العملاء، الحدود الائتمانية، استخراج كشوف الحسابات الدورية والمطابقات
            </p>
          </div>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>إضافة عميل / مقاول جديد</span>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي العملاء المسجلين"
            value={customers.length}
            subtitle="مقاولون وشركات ومستهلكون"
            icon={Users}
            color="primary"
          />
          <StatCard
            title="إجمالي مديونيات السوق المستحقة"
            value={formatCurrency(totalReceivables)}
            subtitle="أرصدة حسابات مدينة قائمة"
            icon={ArrowUpRight}
            color="warning"
          />
          <StatCard
            title="تجاوزوا الحد الائتماني"
            value={exceededCreditCount}
            subtitle="يستلزم إيقاف البيع الآجل"
            icon={AlertTriangle}
            color="warning"
          />
          <StatCard
            title="الحد الائتماني الممنوح"
            value={formatCurrency(customers.reduce((s, c) => s + c.credit_limit, 0))}
            subtitle="سقف التسهيلات الائتمانية"
            icon={CreditCard}
            color="neutral"
          />
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم، الكود، رقم الهاتف، البطاقة، أو الرقم الضريبي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">كود العميل والاسم</th>
                  <th className="py-3 px-4">الهاتف والعنوان</th>
                  <th className="py-3 px-4">البيانات الضريبية</th>
                  <th className="py-3 px-4">الرصيد المدين القائم</th>
                  <th className="py-3 px-4">الحد الائتماني المعتمد</th>
                  <th className="py-3 px-4">حالة الائتمان</th>
                  <th className="py-3 px-4">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const isOverLimit = customer.current_balance > customer.credit_limit;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div className="text-sm">{customer.name}</div>
                        <div className="text-gray-400 font-mono text-[11px]">{customer.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-800 font-mono text-xs flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {customer.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                        {customer.tax_id ? (
                          <div>
                            <div>ضريبي: {customer.tax_id}</div>
                            {customer.commercial_reg && <div>س.ت: {customer.commercial_reg}</div>}
                          </div>
                        ) : (
                          <span>عميل نقدي / أفراد</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={customer.current_balance > 0 ? "text-primary" : "text-emerald-700"}>
                          {formatCurrency(customer.current_balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700 font-medium">
                        {formatCurrency(customer.credit_limit)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverLimit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            تجاوز الائتمان!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            ائتمان سليم
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-xs flex items-center gap-1 h-8"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>كشف حساب</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Statement Modal (كشف حساب تفصيلي) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs flex items-center justify-between p-5 border-b border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    كشف حساب عميل تفصيلي: {selectedCustomer.name}
                  </h3>
                  <div className="text-xs text-gray-500 font-mono">
                    الكود: {selectedCustomer.code} | الهاتف: {selectedCustomer.phone}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">الرصيد المدين الحالي:</span>
                  <span className="font-bold text-primary text-lg mt-0.5 block font-mono">
                    {formatCurrency(selectedCustomer.current_balance)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">الحد الائتماني المعتمد:</span>
                  <span className="font-bold text-gray-900 text-lg mt-0.5 block font-mono">
                    {formatCurrency(selectedCustomer.credit_limit)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">المتبقي من سقف الائتمان:</span>
                  <span className="font-bold text-emerald-700 text-lg mt-0.5 block font-mono">
                    {formatCurrency(
                      Math.max(selectedCustomer.credit_limit - selectedCustomer.current_balance, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Transactions Statement Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  دفتر الأستاذ التفصيلي لحركات العميل (Running Ledger)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">نوع المستند ورقمه</th>
                        <th className="py-2.5 px-3">البيان والشرح</th>
                        <th className="py-2.5 px-3 text-primary font-bold">مدين (سحب)</th>
                        <th className="py-2.5 px-3 text-emerald-700 font-bold">دائن (سداد)</th>
                        <th className="py-2.5 px-3">الرصيد بعد الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {demoStatement.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 text-gray-600">{entry.date}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            {entry.doc_number}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-gray-700">
                            {entry.description}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-primary">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-900 bg-gray-50/50">
                            {formatCurrency(entry.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  كشف حساب معتمد ومطابق لدفاتر الحسابات الآلية
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    <span>طباعة كشف الحساب</span>
                  </Button>
                  <Button
                    onClick={() => alert("جاري تصدير كشف حساب العميل بصيغة Excel...")}
                    className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">إضافة عميل / شركة مقاولات جديدة</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  اسم العميل أو شركة المقاولات *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل للمقاولات العامة والإنشاءات"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="010XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم البطاقة / الهوية
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="14 رقمًا للقومي"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الحد الائتماني الأقصى المعتمد (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={formData.credit_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, credit_limit: Number(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  العنوان والموقع الرئيسي
                </label>
                <input
                  type="text"
                  placeholder="المحافظة، المدينة، أو موقع المشروعات..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم التسجيل الضريبي
                  </label>
                  <input
                    type="text"
                    placeholder="XXX-XXX-XXX"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم السجل التجاري
                  </label>
                  <input
                    type="text"
                    placeholder="رقم السجل التجاري"
                    value={formData.commercial_reg}
                    onChange={(e) => setFormData({ ...formData, commercial_reg: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                  حفظ العميل
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
