"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  PlusCircle,
  Search,
  Filter,
  Users,
  Warehouse,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Percent,
  Check,
  Edit2,
  UserX,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

interface UserProfileRow {
  id: string;
  full_name: string;
  phone: string;
  role_code: "ADMIN" | "ACCOUNTANT" | "WAREHOUSE_KEEPER" | "CASHIER" | "STAFF";
  role_name_ar: string;
  branch_name: string;
  warehouses: string[];
  max_discount_pct: number;
  is_active: boolean;
  created_at: string;
}

const initialUsers: UserProfileRow[] = [
  {
    id: "usr-001",
    full_name: "المهندس طارق منصور",
    phone: "01012345678",
    role_code: "ADMIN",
    role_name_ar: "مدير النظام العام",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["جميع المخازن والساحات (صلاحية كاملة)"],
    max_discount_pct: 15.0,
    is_active: true,
    created_at: "2026-01-01",
  },
  {
    id: "usr-002",
    full_name: "أحمد عبد الله مصطفى",
    phone: "01122334455",
    role_code: "ACCOUNTANT",
    role_name_ar: "مدير الحسابات والمالية",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["جميع المخازن (اطلاع وجرد مالي)"],
    max_discount_pct: 8.0,
    is_active: true,
    created_at: "2026-01-05",
  },
  {
    id: "usr-003",
    full_name: "محمود إبراهيم سيد",
    phone: "01233445566",
    role_code: "WAREHOUSE_KEEPER",
    role_name_ar: "أمين مخزن أول (ساحة التشوين)",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["ساحة تشوين حديد التسليح", "عنبر التوالف والهالك (WH-SCRAP)"],
    max_discount_pct: 0.0,
    is_active: true,
    created_at: "2026-02-10",
  },
  {
    id: "usr-004",
    full_name: "خالد صابر النجار",
    phone: "01099887766",
    role_code: "WAREHOUSE_KEEPER",
    role_name_ar: "أمين مخزن (مستودع الأسمنت)",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["مخزن الأسمنت والجبس المغطى"],
    max_discount_pct: 0.0,
    is_active: true,
    created_at: "2026-02-15",
  },
  {
    id: "usr-005",
    full_name: "سارة حسن عبد الرحمن",
    phone: "01555443322",
    role_code: "CASHIER",
    role_name_ar: "كاشير ومسؤول مبيعات معرض",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["صرف بيعي مباشر من المعرض"],
    max_discount_pct: 2.5,
    is_active: true,
    created_at: "2026-03-01",
  },
];

const permissionsMatrix = [
  { module: "دليل المنتجات والتسعير", admin: true, acct: true, wh: false, cashier: false },
  { module: "اعتماد فواتير المبيعات", admin: true, acct: true, wh: false, cashier: true },
  { module: "اعتماد أذونات استلام البضاعة والنولون", admin: true, acct: true, wh: true, cashier: false },
  { module: "صرف المخزون والتحويل بين المستودعات", admin: true, acct: false, wh: true, cashier: false },
  { module: "إدارة الخزينة وسندات القبض والصرف", admin: true, acct: true, wh: false, cashier: true },
  { module: "تسجيل المرتجعات وتوجيه التوالف", admin: true, acct: true, wh: true, cashier: false },
  { module: "مركز Excel والاستيراد الآمن", admin: true, acct: true, wh: false, cashier: false },
  { module: "التقارير المالية وهوامش الأرباح", admin: true, acct: true, wh: false, cashier: false },
  { module: "إدارة الموظفين والصلاحيات", admin: true, acct: false, wh: false, cashier: false },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfileRow[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"USERS" | "PERMISSIONS">("USERS");

  const handleToggleActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    );
  };

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    role_code: "CASHIER" as UserProfileRow["role_code"],
    max_discount_pct: 0,
    warehouses: [] as string[],
  });

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      full_name: "",
      phone: "",
      role_code: "CASHIER",
      max_discount_pct: 0,
      warehouses: ["مخزن الأسمنت والجبس المغطى"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfileRow) => {
    setEditingUserId(user.id);
    setFormData({
      full_name: user.full_name,
      phone: user.phone,
      role_code: user.role_code,
      max_discount_pct: user.max_discount_pct,
      warehouses: user.warehouses,
    });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.includes(searchTerm) ||
      u.phone.includes(searchTerm) ||
      u.role_name_ar.includes(searchTerm);
    const matchesRole = roleFilter === "ALL" || u.role_code === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "ACCOUNTANT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "WAREHOUSE_KEEPER":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CASHIER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      alert("برجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    const roleMap: Record<string, string> = {
      ADMIN: "مدير النظام العام",
      ACCOUNTANT: "محاسب مالي",
      WAREHOUSE_KEEPER: "أمين مخزن",
      CASHIER: "كاشير ومسؤول مبيعات",
      STAFF: "موظف عام",
    };

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                full_name: formData.full_name,
                phone: formData.phone,
                role_code: formData.role_code,
                role_name_ar: roleMap[formData.role_code] || u.role_name_ar,
                max_discount_pct: formData.max_discount_pct,
                warehouses:
                  formData.warehouses.length > 0
                    ? formData.warehouses
                    : u.warehouses,
              }
            : u
        )
      );
    } else {
      const newUser: UserProfileRow = {
        id: `usr-${Date.now()}`,
        full_name: formData.full_name,
        phone: formData.phone,
        role_code: formData.role_code,
        role_name_ar: roleMap[formData.role_code] || "موظف",
        branch_name: "الفرع الرئيسي - المنطقة الصناعية",
        warehouses:
          formData.warehouses.length > 0
            ? formData.warehouses
            : ["مخزن الأسمنت والجبس المغطى"],
        max_discount_pct: formData.max_discount_pct,
        is_active: true,
        created_at: new Date().toISOString().split("T")[0],
      };
      setUsers([newUser, ...users]);
    }

    setIsModalOpen(false);
    setEditingUserId(null);
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الموظفون والصلاحيات" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              الموظفون وإدارة الصلاحيات
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              إضافة الموظفين وتحديد أدوارهم والمخازن المسموح لكل واحد منهم بالصرف منها وسقف الخصم
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("USERS")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "USERS"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                دليل الموظفين
              </button>
              <button
                onClick={() => setActiveTab("PERMISSIONS")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "PERMISSIONS"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                مصفوفة الصلاحيات
              </button>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>إضافة موظف جديد</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المستخدمين"
            value={users.length}
            subtitle="حسابات نشطة بالنظام"
            icon={Users}
            color="primary"
          />
          <StatCard
            title="مدراء ومحاسبون ماليون"
            value={users.filter((u) => ["ADMIN", "ACCOUNTANT"].includes(u.role_code)).length}
            subtitle="صلاحية تقارير وخزينة"
            icon={Key}
            color="neutral"
          />
          <StatCard
            title="أمناء مخازن مقيدون"
            value={users.filter((u) => u.role_code === "WAREHOUSE_KEEPER").length}
            subtitle="مقيدون بمستودعات محددة"
            icon={Warehouse}
            color="warning"
          />
          <StatCard
            title="كاشيرات ونقاط بيع"
            value={users.filter((u) => u.role_code === "CASHIER").length}
            subtitle="سقف خصم محدد"
            icon={Percent}
            color="success"
          />
        </div>

        {activeTab === "USERS" ? (
          <>
            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث باسم الموظف، رقم الهاتف، أو الدور الوظيفي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[170px]"
                >
                  <option value="ALL">جميع الأدوار</option>
                  <option value="ADMIN">مدير النظام (Admin)</option>
                  <option value="ACCOUNTANT">محاسب مالي (Accountant)</option>
                  <option value="WAREHOUSE_KEEPER">أمين مخزن (Warehouse Keeper)</option>
                  <option value="CASHIER">كاشير ومبيعات (Cashier)</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">اسم الموظف وبيانات الاتصال</th>
                      <th className="py-3 px-4">الدور الوظيفي والصلاحية</th>
                      <th className="py-3 px-4">الفرع المخصص</th>
                      <th className="py-3 px-4">المخازن المسموح بها</th>
                      <th className="py-3 px-4">أقصى نسبة خصم</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">تاريخ الانضمام</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 text-sm">{user.full_name}</div>
                          <div className="text-gray-500 font-mono text-[11px]" dir="ltr">
                            {user.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeColor(
                              user.role_code
                            )}`}
                          >
                            {user.role_name_ar}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {user.branch_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.warehouses.map((wh, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[11px] px-2 py-0.5 rounded-md font-medium"
                              >
                                <Warehouse className="w-3 h-3 text-gray-500" />
                                {wh}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                          {user.max_discount_pct > 0 ? `${user.max_discount_pct}%` : "0% (ممنوع)"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${user.is_active ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-gray-500 bg-gray-100 border-gray-200"}`}>
                            {user.is_active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {user.is_active ? "نشط" : "موقوف"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                          {user.created_at}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="تعديل بيانات الموظف"
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title={user.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
                              onClick={() => handleToggleActive(user.id)}
                              className={`p-1.5 rounded-lg transition-colors ${user.is_active ? "text-gray-500 hover:bg-red-50 hover:text-red-600" : "text-gray-500 hover:bg-green-50 hover:text-green-600"}`}
                            >
                              {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Permissions Matrix */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                مصفوفة الصلاحيات حسب الأدوار الوظيفية
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                الصلاحيات دي مطبقة على مستوى قاعدة البيانات مباشرة — مفيش موظف يقدر يعدي حدوده حتى لو جرب
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-right">الوظيفة / العملية المحاسبية</th>
                    <th className="py-3 px-4">مدير النظام (Admin)</th>
                    <th className="py-3 px-4">مدير الحسابات (Accountant)</th>
                    <th className="py-3 px-4">أمين المخزن (Warehouse)</th>
                    <th className="py-3 px-4">الكاشير (Cashier)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {permissionsMatrix.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {item.module}
                      </td>
                      <td className="py-3 px-4">
                        {item.admin ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.acct ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.wh ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.cashier ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingUserId ? "تعديل بيانات وصلاحيات الموظف" : "إضافة موظف جديد للنظام"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUserId(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م/ كريم عثمان السروي"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
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
                    placeholder="010XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الدور الوظيفي *
                  </label>
                  <select
                    value={formData.role_code}
                    onChange={(e) =>
                      setFormData({ ...formData, role_code: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="ADMIN">مدير عام النظام</option>
                    <option value="ACCOUNTANT">محاسب مالي</option>
                    <option value="WAREHOUSE_KEEPER">أمين مخزن</option>
                    <option value="CASHIER">كاشير ومسؤول مبيعات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  سقف الخصم الأقصى المسموح به (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.max_discount_pct}
                  onChange={(e) =>
                    setFormData({ ...formData, max_discount_pct: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  أي خصم يتجاوز هذه النسبة سيتطلب موافقة وتوقيع إلكتروني من مدير الحسابات.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  المخازن المسموح بالصرف والاستلام منها
                </label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-xs">
                  <label className="flex items-center gap-2 text-gray-800">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-primary rounded-sm border-gray-300"
                    />
                    <span>ساحة تشوين حديد التسليح (WH-STL)</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-800">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-primary rounded-sm border-gray-300"
                    />
                    <span>مخزن الأسمنت والجبس المغطى (WH-CEM)</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-800">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded-sm border-gray-300"
                    />
                    <span>عنبر التوالف والهالك (WH-SCRAP)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUserId(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                  {editingUserId ? "حفظ التعديلات" : "إضافة الموظف"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
