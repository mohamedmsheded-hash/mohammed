"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
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
  Factory,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { saveSupplierAction, deactivateSupplierAction } from "@/server/actions/masters";

interface SupplierRow {
  id: string;
  code: string;
  name: string;
  supplier_type: "STEEL_MILL" | "CEMENT_FACTORY" | "QUARRY" | "BRICK_FACTORY" | "GENERAL";
  type_label_ar: string;
  phone: string;
  address: string;
  current_balance: number; // دائن (مستحقات للمصنع)
  tax_id?: string;
  commercial_reg?: string;
  is_active: boolean;
}

interface SupplierStatementEntry {
  date: string;
  doc_type: "GOODS_RECEIPT" | "PAYMENT_VOUCHER" | "PURCHASE_RETURN";
  doc_number: string;
  description: string;
  credit: number;  // دائن (استلام شحنة بضاعة - زيادة مستحقات المصنع)
  debit: number;   // مدين (سداد بسند صرف - تخفيض المستحقات)
  balance: number; // الرصيد التراكمي المستحق
}

const initialSuppliers: SupplierRow[] = [
  {
    id: "sup-01",
    code: "SUP-EZZ",
    name: "شركة العز لصناعة حديد التسليح",
    supplier_type: "STEEL_MILL",
    type_label_ar: "مصنع حديد تسليح",
    phone: "0233445566",
    address: "المنطقة الصناعية - السادات / الدخيلة",
    current_balance: 1450000,
    tax_id: "100-200-300",
    commercial_reg: "12548",
    is_active: true,
  },
  {
    id: "sup-02",
    code: "SUP-SWD",
    name: "شركة السويدي للأسمنت وبطائن العزل",
    supplier_type: "CEMENT_FACTORY",
    type_label_ar: "مصنع أسمنت",
    phone: "0222334455",
    address: "طريق العين السخنة - السويس",
    current_balance: 385000,
    tax_id: "200-300-400",
    commercial_reg: "35412",
    is_active: true,
  },
  {
    id: "sup-03",
    code: "SUP-SINAI",
    name: "شركة أسمنت سيناء (ش.م.م)",
    supplier_type: "CEMENT_FACTORY",
    type_label_ar: "مصنع أسمنت",
    phone: "0277889900",
    address: "العريش - شمال سيناء",
    current_balance: 120000,
    tax_id: "300-400-500",
    commercial_reg: "78451",
    is_active: true,
  },
  {
    id: "sup-04",
    code: "SUP-QUR-01",
    name: "محاجر ومقالع وادي الملوك للرمل والسن",
    supplier_type: "QUARRY",
    type_label_ar: "مقالع محاجر ورمل",
    phone: "01099881122",
    address: "طريق الفيوم - الكيلو 52",
    current_balance: 45000,
    is_active: true,
  },
];

const demoSupplierStatement: SupplierStatementEntry[] = [
  {
    date: "2026-11-05",
    doc_type: "GOODS_RECEIPT",
    doc_number: "RCPT-2026-0018",
    description: "استلام شحنة حديد تسليح عز 10 مم (40 طن)",
    credit: 1640000,
    debit: 0,
    balance: 1640000,
  },
  {
    date: "2026-11-08",
    doc_type: "PAYMENT_VOUCHER",
    doc_number: "PAY-2026-0012",
    description: "سداد دفعة بنكية محولة لحساب المصنع",
    credit: 0,
    debit: 600000,
    balance: 1040000,
  },
  {
    date: "2026-11-15",
    doc_type: "GOODS_RECEIPT",
    doc_number: "RCPT-2026-0025",
    description: "استلام شحنة حديد تسليح عز 12 مم (25 طن)",
    credit: 1010000,
    debit: 0,
    balance: 2050000,
  },
  {
    date: "2026-11-18",
    doc_type: "PAYMENT_VOUCHER",
    doc_number: "PAY-2026-0019",
    description: "سداد شيك مصرفي مقبول الدفع",
    credit: 0,
    debit: 600000,
    balance: 1450000,
  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, code, name_ar, supplier_type, phone, tax_id, commercial_reg, address, current_balance, is_active")
        .order("name_ar");
      if (!error && data) {
        setSuppliers(data.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name_ar,
          supplier_type: row.supplier_type,
          type_label_ar: row.supplier_type,
          phone: row.phone,
          address: row.address || "",
          current_balance: Number(row.current_balance || 0),
          tax_id: row.tax_id || undefined,
          commercial_reg: row.commercial_reg || undefined,
          is_active: row.is_active,
        })));
      }
      setIsLoading(false);
    };
    loadSuppliers();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    supplier_type: "STEEL_MILL" as SupplierRow["supplier_type"],
    phone: "",
    address: "",
    tax_id: "",
    commercial_reg: "",
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.includes(searchTerm) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchesType = typeFilter === "ALL" || s.supplier_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("برجاء إدخال اسم المصنع أو المورد ورقم الهاتف");
      return;
    }

    const typeLabels: Record<string, string> = {
      STEEL_MILL: "مصنع حديد تسليح",
      CEMENT_FACTORY: "مصنع أسمنت",
      QUARRY: "مقالع محاجر ورمل",
      BRICK_FACTORY: "مصنع طوب بناء",
      GENERAL: "مورد عام",
    };

    try {
      const result = await saveSupplierAction({
        code: formData.code || `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
        name_ar: formData.name,
        supplier_type: formData.supplier_type,
        phone: formData.phone,
        address: formData.address || null,
        tax_id: formData.tax_id || null,
        commercial_reg: formData.commercial_reg || null,
      });
      const saved = result.supplier;
      setSuppliers([{
        id: saved.id,
        code: saved.code,
        name: saved.name_ar,
        supplier_type: saved.supplier_type,
        type_label_ar: typeLabels[saved.supplier_type] || "مورد",
        phone: saved.phone,
        address: saved.address || "",
        current_balance: Number(saved.current_balance || 0),
        tax_id: saved.tax_id || undefined,
        commercial_reg: saved.commercial_reg || undefined,
        is_active: saved.is_active,
      }, ...suppliers]);
      setIsNewModalOpen(false);
      setFormData({
        code: "",
        name: "",
        supplier_type: "STEEL_MILL",
        phone: "",
        address: "",
        tax_id: "",
        commercial_reg: "",
      });
    } catch (error: any) {
      alert(error?.message || "فشل حفظ المورد");
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الموردون والمصانع" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              دليل الموردين والمصانع ومقالع المحاجر
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              متابعة حسابات مصانع الأسمنت والحديد وكسارات الرمل، كشوف الحسابات الدورية والمستحقات
            </p>
          </div>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>إضافة مورد / مصنع جديد</span>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الموردين والمصانع"
            value={suppliers.length}
            subtitle="مصانع حديد وأسمنت ومحاجر"
            icon={Factory}
            color="primary"
          />
          <StatCard
            title="إجمالي المستحقات الدائنة للمصانع"
            value={formatCurrency(totalPayables)}
            subtitle="مستحقات واجبة السداد"
            icon={ArrowDownLeft}
            color="warning"
          />
          <StatCard
            title="مصانع حديد وأسمنت معتمدة"
            value={suppliers.filter((s) => ["STEEL_MILL", "CEMENT_FACTORY"].includes(s.supplier_type)).length}
            subtitle="عقود توريد وتسهيلات"
            icon={Building2}
            color="neutral"
          />
          <StatCard
            title="مقالع ومحاجر رمل وزلط"
            value={suppliers.filter((s) => s.supplier_type === "QUARRY").length}
            subtitle="توريد مباشر بالقلابات"
            icon={CheckCircle2}
            color="success"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم المصنع، الكود، أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[170px]"
            >
              <option value="ALL">جميع قطاعات التوريد</option>
              <option value="STEEL_MILL">مصانع حديد تسليح</option>
              <option value="CEMENT_FACTORY">مصانع أسمنت</option>
              <option value="QUARRY">مقالع ومحاجر رمل</option>
              <option value="BRICK_FACTORY">مصانع طوب</option>
            </select>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">كود المورد والاسم التجاري</th>
                  <th className="py-3 px-4">قطاع ونوع التوريد</th>
                  <th className="py-3 px-4">الهاتف والمقر الرئيسي</th>
                  <th className="py-3 px-4">البيانات الضريبية والتجارية</th>
                  <th className="py-3 px-4">إجمالي المستحقات الدائنة</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="text-sm">{supplier.name}</div>
                      <div className="text-gray-400 font-mono text-[11px]">{supplier.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {supplier.type_label_ar}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-800 font-mono text-xs flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {supplier.phone}
                      </div>
                      <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {supplier.address}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                      {supplier.tax_id ? (
                        <div>
                          <div>ضريبي: {supplier.tax_id}</div>
                          {supplier.commercial_reg && <div>س.ت: {supplier.commercial_reg}</div>}
                        </div>
                      ) : (
                        <span>محجر أهالي / توريد مباشر</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-amber-700">
                      {formatCurrency(supplier.current_balance)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        نشط
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSupplier(supplier)}
                        className="text-xs flex items-center gap-1 h-8"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span>كشف حساب</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supplier Statement Modal (كشف حساب مورد) */}
      {selectedSupplier && (
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
                    كشف حساب مورد / مصنع: {selectedSupplier.name}
                  </h3>
                  <div className="text-xs text-gray-500 font-mono">
                    الكود: {selectedSupplier.code} | الهاتف: {selectedSupplier.phone}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">إجمالي المستحقات الدائنة الحالية للمصنع:</span>
                  <span className="font-bold text-amber-700 text-xl mt-0.5 block font-mono">
                    {formatCurrency(selectedSupplier.current_balance)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">تصنيف المصنع / المورد:</span>
                  <span className="font-bold text-gray-900 text-base mt-0.5 block">
                    {selectedSupplier.type_label_ar}
                  </span>
                </div>
              </div>

              {/* Transactions Statement Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  دفتر الأستاذ المالي التفصيلي للتوريدات والسدادات (Running Ledger)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">نوع المستند ورقمه</th>
                        <th className="py-2.5 px-3">البيان والشرح</th>
                        <th className="py-2.5 px-3 text-amber-700 font-bold">دائن (توريد بضاعة)</th>
                        <th className="py-2.5 px-3 text-emerald-700 font-bold">مدين (سداد بسند صرف)</th>
                        <th className="py-2.5 px-3">الرصيد المستحق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {demoSupplierStatement.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 text-gray-600">{entry.date}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            {entry.doc_number}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-gray-700">
                            {entry.description}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-amber-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
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
                  كشف حساب معتمد لمطابقة أرصدة المصانع والموردين
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
                    onClick={() => alert("جاري تصدير كشف حساب المورد بصيغة Excel...")}
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

      {/* Add Supplier Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">إضافة مصنع / مورد جديد</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  اسم المصنع أو الشركة الموردة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة المصريين لصلب التسليح"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    كود المورد المختصر
                  </label>
                  <input
                    type="text"
                    placeholder="SUP-MASR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    قطاع ونوع التوريد *
                  </label>
                  <select
                    value={formData.supplier_type}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_type: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white font-semibold"
                  >
                    <option value="STEEL_MILL">مصنع حديد تسليح</option>
                    <option value="CEMENT_FACTORY">مصنع أسمنت وبطائن</option>
                    <option value="QUARRY">محجر / مقالع رمل وسن</option>
                    <option value="BRICK_FACTORY">مصنع طوب بناء</option>
                    <option value="GENERAL">مورد عام</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="02XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    المقر / المصنع
                  </label>
                  <input
                    type="text"
                    placeholder="المنطقة الصناعية..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
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
                  حفظ المصنع / المورد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
