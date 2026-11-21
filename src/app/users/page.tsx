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
  Trash2,
  Sliders,
  CheckSquare,
  Square,
  Building2,
  Phone,
  Shield,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";

interface GranularPermissions {
  // المبيعات
  sales_create: boolean;
  sales_approve: boolean;
  sales_discount: boolean;
  sales_cancel: boolean;

  // المشتريات والتوريد
  purchases_create: boolean;
  purchases_weighbridge: boolean;
  purchases_landed_cost: boolean;

  // المخازن والجرد
  inventory_dispatch: boolean;
  inventory_transfer: boolean;
  inventory_adjust: boolean;
  inventory_scrap_access: boolean;

  // الخزينة والمالية
  finance_receipt: boolean;
  finance_payment: boolean;
  finance_close_shift: boolean;
  finance_view_ledger: boolean;

  // الأسعار والمنتجات
  pricing_edit: boolean;
  pricing_add_product: boolean;

  // التقارير
  reports_view_profit: boolean;
  reports_view_debts: boolean;
  reports_export_excel: boolean;

  // إدارة المنظومة
  admin_manage_users: boolean;
  admin_system_settings: boolean;
}

interface UserProfileRow {
  id: string;
  full_name: string;
  phone: string;
  national_id?: string;
  role_code: "ADMIN" | "ACCOUNTANT" | "WAREHOUSE_KEEPER" | "CASHIER" | "STAFF";
  role_name_ar: string;
  branch_name: string;
  warehouses: string[];
  max_discount_pct: number;
  is_active: boolean;
  created_at: string;
  permissions: GranularPermissions;
}

// الصلاحيات الافتراضية لكل وظيفة
const defaultRolePermissions: Record<UserProfileRow["role_code"], GranularPermissions> = {
  ADMIN: {
    sales_create: true,
    sales_approve: true,
    sales_discount: true,
    sales_cancel: true,
    purchases_create: true,
    purchases_weighbridge: true,
    purchases_landed_cost: true,
    inventory_dispatch: true,
    inventory_transfer: true,
    inventory_adjust: true,
    inventory_scrap_access: true,
    finance_receipt: true,
    finance_payment: true,
    finance_close_shift: true,
    finance_view_ledger: true,
    pricing_edit: true,
    pricing_add_product: true,
    reports_view_profit: true,
    reports_view_debts: true,
    reports_export_excel: true,
    admin_manage_users: true,
    admin_system_settings: true,
  },
  ACCOUNTANT: {
    sales_create: true,
    sales_approve: true,
    sales_discount: true,
    sales_cancel: true,
    purchases_create: true,
    purchases_weighbridge: true,
    purchases_landed_cost: true,
    inventory_dispatch: false,
    inventory_transfer: true,
    inventory_adjust: true,
    inventory_scrap_access: false,
    finance_receipt: true,
    finance_payment: true,
    finance_close_shift: true,
    finance_view_ledger: true,
    pricing_edit: true,
    pricing_add_product: true,
    reports_view_profit: true,
    reports_view_debts: true,
    reports_export_excel: true,
    admin_manage_users: false,
    admin_system_settings: false,
  },
  WAREHOUSE_KEEPER: {
    sales_create: false,
    sales_approve: false,
    sales_discount: false,
    sales_cancel: false,
    purchases_create: true,
    purchases_weighbridge: true,
    purchases_landed_cost: false,
    inventory_dispatch: true,
    inventory_transfer: true,
    inventory_adjust: true,
    inventory_scrap_access: true,
    finance_receipt: false,
    finance_payment: false,
    finance_close_shift: false,
    finance_view_ledger: false,
    pricing_edit: false,
    pricing_add_product: false,
    reports_view_profit: false,
    reports_view_debts: false,
    reports_export_excel: false,
    admin_manage_users: false,
    admin_system_settings: false,
  },
  CASHIER: {
    sales_create: true,
    sales_approve: true,
    sales_discount: true,
    sales_cancel: false,
    purchases_create: false,
    purchases_weighbridge: false,
    purchases_landed_cost: false,
    inventory_dispatch: false,
    inventory_transfer: false,
    inventory_adjust: false,
    inventory_scrap_access: false,
    finance_receipt: true,
    finance_payment: false,
    finance_close_shift: true,
    finance_view_ledger: false,
    pricing_edit: false,
    pricing_add_product: false,
    reports_view_profit: false,
    reports_view_debts: false,
    reports_export_excel: false,
    admin_manage_users: false,
    admin_system_settings: false,
  },
  STAFF: {
    sales_create: true,
    sales_approve: false,
    sales_discount: false,
    sales_cancel: false,
    purchases_create: false,
    purchases_weighbridge: false,
    purchases_landed_cost: false,
    inventory_dispatch: false,
    inventory_transfer: false,
    inventory_adjust: false,
    inventory_scrap_access: false,
    finance_receipt: false,
    finance_payment: false,
    finance_close_shift: false,
    finance_view_ledger: false,
    pricing_edit: false,
    pricing_add_product: false,
    reports_view_profit: false,
    reports_view_debts: false,
    reports_export_excel: false,
    admin_manage_users: false,
    admin_system_settings: false,
  },
};

const permissionCategories: {
  category: string;
  items: { key: keyof GranularPermissions; label: string; desc: string }[];
}[] = [
  {
    category: "المبيعات والفواتير",
    items: [
      { key: "sales_create", label: "إنشاء فواتير بيع", desc: "فتح فاتورة جديدة وحجز المواد" },
      { key: "sales_approve", label: "اعتماد الفواتير وصرف المخزون", desc: "خصم البضاعة من المخازن وتثبيت التكلفة" },
      { key: "sales_discount", label: "منح خصم تجاري للعميل", desc: "الخصم في حدود السقف المحدد للموظف" },
      { key: "sales_cancel", label: "إلغاء فواتير البيع", desc: "إلغاء أو تعديل الفواتير المعلقة" },
    ],
  },
  {
    category: "المشتريات والتوريد",
    items: [
      { key: "purchases_create", label: "تسجيل شحنات استلام بضاعة", desc: "إدخال أذون توريد المصانع والمحاجر" },
      { key: "purchases_weighbridge", label: "اعتماد أوزان ميزان البسكول", desc: "إثبات الأوزان القائمة والفارغة للشاحنات" },
      { key: "purchases_landed_cost", label: "توزيع النولون والعتالة", desc: "تحميل تكاليف النقل على سعر الوحدة" },
    ],
  },
  {
    category: "المخازن وحركة المواد",
    items: [
      { key: "inventory_dispatch", label: "صرف وتسليم بضاعة من المخزن", desc: "إخراج الحديد والأسمنت بموجب إذن رسمي" },
      { key: "inventory_transfer", label: "التحويل بين المخازن والساحات", desc: "نقل المواد من ساحة لأخرى" },
      { key: "inventory_adjust", label: "إجراء تسويات الجرد والعجز", desc: "مطابقة الرصيد الدفتري بالفعلي" },
      { key: "inventory_scrap_access", label: "دخول عنبر التوالف والهالك", desc: "صرف وتوجيه المواد المعيبة والمكسرة" },
    ],
  },
  {
    category: "الخزينة والحسابات النقدية",
    items: [
      { key: "finance_receipt", label: "إصدار سند قبض نقدية", desc: "استلام دفعات ومقبوضات من العملاء" },
      { key: "finance_payment", label: "إصدار سند صرف نقدية", desc: "صرف مستحقات الموردين أو النولون" },
      { key: "finance_close_shift", label: "إغلاق وردية الخزينة", desc: "جرد الدرج اليومي وتوريد النقدية" },
      { key: "finance_view_ledger", label: "الاطلاع على دفتر حركة النقدية", desc: "متابعة كشف حساب الخزائن والبنوك" },
    ],
  },
  {
    category: "الأسعار ودليل المنتجات",
    items: [
      { key: "pricing_edit", label: "تعديل أسعار بيع المواد", desc: "تحديث أسعار طن الحديد وشيكارة الأسمنت" },
      { key: "pricing_add_product", label: "إضافة أصناف جديدة للكتالوج", desc: "تعريف مواد جديدة وتحديد وحدات القياس" },
    ],
  },
  {
    category: "التقارير والأرباح",
    items: [
      { key: "reports_view_profit", label: "الاطلاع على أرباح المبيعات", desc: "كشف هوامش الربح وتكلفة البضاعة" },
      { key: "reports_view_debts", label: "كشف أعمار الديون ومستحقات العملاء", desc: "متابعة مديونيات المقاولين والشركات" },
      { key: "reports_export_excel", label: "تصدير البيانات لملفات Excel", desc: "سحب نسخ كشوف الحسابات والجرد" },
    ],
  },
  {
    category: "إدارة النظام والأمان",
    items: [
      { key: "admin_manage_users", label: "إدارة الموظفين والصلاحيات", desc: "إضافة موظفين، تعديل بياناتهم وحذفهم" },
      { key: "admin_system_settings", label: "تعديل إعدادات وسياسات المنظومة", desc: "التحكم في قيود المخزون والنسخ الاحتياطي" },
    ],
  },
];

const initialUsers: UserProfileRow[] = [
  {
    id: "usr-001",
    full_name: "المهندس طارق منصور",
    phone: "01012345678",
    national_id: "28504121401234",
    role_code: "ADMIN",
    role_name_ar: "مدير عام النظام",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["ساحة تشوين حديد التسليح", "مخزن الأسمنت والجبس المغطى", "عنبر التوالف والهالك (WH-SCRAP)"],
    max_discount_pct: 15.0,
    is_active: true,
    created_at: "2026-01-01",
    permissions: defaultRolePermissions.ADMIN,
  },
  {
    id: "usr-002",
    full_name: "أحمد عبد الله مصطفى",
    phone: "01122334455",
    national_id: "29007152104567",
    role_code: "ACCOUNTANT",
    role_name_ar: "مدير الحسابات والمالية",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["مخزن الأسمنت والجبس المغطى", "ساحة تشوين حديد التسليح"],
    max_discount_pct: 8.0,
    is_active: true,
    created_at: "2026-01-05",
    permissions: defaultRolePermissions.ACCOUNTANT,
  },
  {
    id: "usr-003",
    full_name: "محمود إبراهيم سيد",
    phone: "01233445566",
    national_id: "28811051809876",
    role_code: "WAREHOUSE_KEEPER",
    role_name_ar: "أمين مخزن أول (ساحة التشوين)",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["ساحة تشوين حديد التسليح", "عنبر التوالف والهالك (WH-SCRAP)"],
    max_discount_pct: 0.0,
    is_active: true,
    created_at: "2026-02-10",
    permissions: defaultRolePermissions.WAREHOUSE_KEEPER,
  },
  {
    id: "usr-004",
    full_name: "خالد صابر النجار",
    phone: "01099887766",
    national_id: "29203191605432",
    role_code: "WAREHOUSE_KEEPER",
    role_name_ar: "أمين مخزن (مستودع الأسمنت)",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["مخزن الأسمنت والجبس المغطى"],
    max_discount_pct: 0.0,
    is_active: true,
    created_at: "2026-02-15",
    permissions: defaultRolePermissions.WAREHOUSE_KEEPER,
  },
  {
    id: "usr-005",
    full_name: "سارة حسن عبد الرحمن",
    phone: "01555443322",
    national_id: "29512011208765",
    role_code: "CASHIER",
    role_name_ar: "كاشير ومسؤول مبيعات معرض",
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    warehouses: ["مخزن الأسمنت والجبس المغطى"],
    max_discount_pct: 2.5,
    is_active: true,
    created_at: "2026-03-01",
    permissions: defaultRolePermissions.CASHIER,
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfileRow[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"USERS" | "PERMISSIONS_MATRIX">("USERS");

  // نوافذ التحكم
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permTargetUser, setPermTargetUser] = useState<UserProfileRow | null>(null);
  const [tempPermissions, setTempPermissions] = useState<GranularPermissions | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // فورم إضافة / تعديل الموظف
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    national_id: "",
    role_code: "CASHIER" as UserProfileRow["role_code"],
    branch_name: "الفرع الرئيسي - المنطقة الصناعية",
    max_discount_pct: 0,
    warehouses: ["مخزن الأسمنت والجبس المغطى"] as string[],
  });

  // فتح نافذة الإضافة
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      full_name: "",
      phone: "",
      national_id: "",
      role_code: "CASHIER",
      branch_name: "الفرع الرئيسي - المنطقة الصناعية",
      max_discount_pct: 0,
      warehouses: ["مخزن الأسمنت والجبس المغطى"],
    });
    setIsUserModalOpen(true);
  };

  // فتح نافذة التعديل
  const handleOpenEdit = (user: UserProfileRow) => {
    setEditingUserId(user.id);
    setFormData({
      full_name: user.full_name,
      phone: user.phone,
      national_id: user.national_id || "",
      role_code: user.role_code,
      branch_name: user.branch_name,
      max_discount_pct: user.max_discount_pct,
      warehouses: user.warehouses,
    });
    setIsUserModalOpen(true);
  };

  // فتح نافذة الصلاحيات التفصيلية
  const handleOpenPermissions = (user: UserProfileRow) => {
    setPermTargetUser(user);
    setTempPermissions({ ...user.permissions });
    setIsPermModalOpen(true);
  };

  // تبديل حالة صلاحية واحدة
  const handleToggleSinglePermission = (key: keyof GranularPermissions) => {
    if (!tempPermissions) return;
    setTempPermissions({
      ...tempPermissions,
      [key]: !tempPermissions[key],
    });
  };

  // تفعيل / تعطيل كل صلاحيات الموظف
  const handleSetAllPermissions = (value: boolean) => {
    if (!tempPermissions) return;
    const updated = { ...tempPermissions };
    (Object.keys(updated) as (keyof GranularPermissions)[]).forEach((k) => {
      updated[k] = value;
    });
    setTempPermissions(updated);
  };

  // استعادة الصلاحيات الافتراضية للدور
  const handleResetToRoleDefault = () => {
    if (!permTargetUser) return;
    const defaults = defaultRolePermissions[permTargetUser.role_code];
    setTempPermissions({ ...defaults });
  };

  // حفظ الصلاحيات المخصصة للموظف
  const handleSavePermissions = () => {
    if (!permTargetUser || !tempPermissions) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === permTargetUser.id ? { ...u, permissions: tempPermissions } : u))
    );
    setIsPermModalOpen(false);
    setPermTargetUser(null);
    setTempPermissions(null);
  };

  // تبديل حالة التفعيل / التعطيل
  const handleToggleActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    );
  };

  // تأكيد وحذف الموظف
  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleteConfirmId(null);
  };

  // حفظ بيانات الموظف (إضافة أو تعديل)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      alert("برجاء إدخال اسم الموظف ورقم هاتفه");
      return;
    }

    const roleMap: Record<string, string> = {
      ADMIN: "مدير عام النظام",
      ACCOUNTANT: "مدير الحسابات والمالية",
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
                national_id: formData.national_id,
                role_code: formData.role_code,
                role_name_ar: roleMap[formData.role_code] || u.role_name_ar,
                branch_name: formData.branch_name,
                max_discount_pct: formData.max_discount_pct,
                warehouses:
                  formData.warehouses.length > 0 ? formData.warehouses : u.warehouses,
              }
            : u
        )
      );
    } else {
      const newUser: UserProfileRow = {
        id: `usr-${Date.now()}`,
        full_name: formData.full_name,
        phone: formData.phone,
        national_id: formData.national_id,
        role_code: formData.role_code,
        role_name_ar: roleMap[formData.role_code] || "موظف",
        branch_name: formData.branch_name,
        warehouses:
          formData.warehouses.length > 0
            ? formData.warehouses
            : ["مخزن الأسمنت والجبس المغطى"],
        max_discount_pct: formData.max_discount_pct,
        is_active: true,
        created_at: new Date().toISOString().split("T")[0],
        permissions: defaultRolePermissions[formData.role_code],
      };
      setUsers([newUser, ...users]);
    }

    setIsUserModalOpen(false);
    setEditingUserId(null);
  };

  // تصفية وبحث
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.includes(searchTerm) ||
      u.phone.includes(searchTerm) ||
      u.role_name_ar.includes(searchTerm) ||
      (u.national_id && u.national_id.includes(searchTerm));
    const matchesRole = roleFilter === "ALL" || u.role_code === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.is_active) ||
      (statusFilter === "INACTIVE" && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
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

  // حساب كم صلاحية مفعلة عند الموظف
  const countActivePermissions = (p: GranularPermissions) => {
    return Object.values(p).filter(Boolean).length;
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
              الموظفون وإدارة الصلاحيات الشاملة
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تحكم كامل في إضافة وتعديل وحذف الموظفين، وضبط صلاحيات كل موظف بدقة، وتحديد المخازن وسقف الخصم
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
                دليل الموظفين ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("PERMISSIONS_MATRIX")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "PERMISSIONS_MATRIX"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                مصفوفة الصلاحيات العامة
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

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي فريق العمل"
            value={users.length}
            subtitle={`${users.filter((u) => u.is_active).length} حساب نشط حالياً`}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="الحسابات المالية والإدارة"
            value={users.filter((u) => ["ADMIN", "ACCOUNTANT"].includes(u.role_code)).length}
            subtitle="صلاحيات خزائن وفواتير وتقارير"
            icon={Key}
            color="neutral"
          />
          <StatCard
            title="أمناء ومسؤولو المخازن"
            value={users.filter((u) => u.role_code === "WAREHOUSE_KEEPER").length}
            subtitle="صرف واستلام وجرد بضاعة"
            icon={Warehouse}
            color="warning"
          />
          <StatCard
            title="مسؤولو المبيعات والكاشير"
            value={users.filter((u) => u.role_code === "CASHIER").length}
            subtitle="إصدار فواتير بسقوف خصم"
            icon={Percent}
            color="success"
          />
        </div>

        {activeTab === "USERS" ? (
          <>
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث باسم الموظف، الهاتف، الرقم القومي، أو المسمى الوظيفي..."
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[150px]"
                >
                  <option value="ALL">جميع الأدوار الوظيفية</option>
                  <option value="ADMIN">مدير عام النظام</option>
                  <option value="ACCOUNTANT">مدير حسابات ومالية</option>
                  <option value="WAREHOUSE_KEEPER">أمين مخزن</option>
                  <option value="CASHIER">كاشير ومبيعات</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[120px]"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="ACTIVE">نشط فقط</option>
                  <option value="INACTIVE">موقوف فقط</option>
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
                      <th className="py-3 px-4">الوظيفة</th>
                      <th className="py-3 px-4">المخازن المسموح بالصرف منها</th>
                      <th className="py-3 px-4">أقصى خصم</th>
                      <th className="py-3 px-4">الصلاحيات الممنوحة</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 text-center">إجراءات التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                          لا توجد نتائج مطابقة لخيارات البحث
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-sm">{user.full_name}</div>
                            <div className="flex items-center gap-2 text-gray-500 font-mono text-[11px] mt-0.5" dir="ltr">
                              <span>{user.phone}</span>
                              {user.national_id && (
                                <span className="text-gray-400 border-r pr-2">الرقم القومي: {user.national_id}</span>
                              )}
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
                            <div className="text-[10px] text-gray-400 mt-1">{user.branch_name}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.warehouses.map((wh, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-md font-medium"
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
                            <button
                              onClick={() => handleOpenPermissions(user)}
                              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors border border-primary/20"
                              title="اضغط لتعديل صلاحيات هذا الموظف بالتفصيل"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>{countActivePermissions(user.permissions)} من 21 صلاحية</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                user.is_active
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                  : "text-gray-500 bg-gray-100 border-gray-200"
                              }`}
                            >
                              {user.is_active ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-gray-400" />
                              )}
                              {user.is_active ? "نشط" : "موقوف"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* تعديل الصلاحيات */}
                              <button
                                title="تعديل الصلاحيات التفصيلية"
                                onClick={() => handleOpenPermissions(user)}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {/* تعديل البيانات الأساسية */}
                              <button
                                title="تعديل بيانات الموظف"
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* تفعيل / تعطيل */}
                              <button
                                title={user.is_active ? "تعطيل حساب الموظف مؤقتاً" : "إعادة تفعيل الحساب"}
                                onClick={() => handleToggleActive(user.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.is_active
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>

                              {/* حذف الموظف */}
                              <button
                                title="حذف الموظف نهائياً"
                                onClick={() => setDeleteConfirmId(user.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* General Role Matrix */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                مصفوفة الصلاحيات الافتراضية حسب الأدوار الوظيفية
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                توضح الصلاحيات القياسية الممنوحة لكل وظيفة. يمكنك تخصيص صلاحيات كل موظف على حدة من جدول الموظفين.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-right">العملية / الصلاحية</th>
                    <th className="py-3 px-4">مدير عام النظام</th>
                    <th className="py-3 px-4">مدير الحسابات والمالية</th>
                    <th className="py-3 px-4">أمين المخزن</th>
                    <th className="py-3 px-4">الكاشير ونقاط البيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {permissionCategories.flatMap((cat) =>
                    cat.items.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-bold text-gray-900 block">{item.label}</span>
                          <span className="text-[10px] text-gray-500">{item.desc}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          {defaultRolePermissions.ADMIN[item.key] ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {defaultRolePermissions.ACCOUNTANT[item.key] ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {defaultRolePermissions.WAREHOUSE_KEEPER[item.key] ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {defaultRolePermissions.CASHIER[item.key] ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* نافذة إضافة أو تعديل الموظف */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingUserId ? "تعديل بيانات الموظف" : "إضافة موظف جديد للمنظومة"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
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
                  placeholder="مثال: م/ محمود إبراهيم النجار"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم الهاتف المحمول *
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
                    الرقم القومي (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="14 رقم قومي"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الدور الوظيفي الرئيسي *
                  </label>
                  <select
                    value={formData.role_code}
                    onChange={(e) =>
                      setFormData({ ...formData, role_code: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="ADMIN">مدير عام النظام</option>
                    <option value="ACCOUNTANT">مدير الحسابات والمالية</option>
                    <option value="WAREHOUSE_KEEPER">أمين مخزن</option>
                    <option value="CASHIER">كاشير ومسؤول مبيعات</option>
                    <option value="STAFF">موظف عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الفرع المخصص
                  </label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  أقصى سقف خصم مسموح به في الفواتير (%)
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
                  إذا تجاوز الكاشير هذه النسبة، يطلب السيستم موافقة وتوقيع مدير الحسابات إلكترونياً.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  المخازن المسموح بالصرف والاستلام منها للموظف
                </label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-xs">
                  {[
                    "ساحة تشوين حديد التسليح",
                    "مخزن الأسمنت والجبس المغطى",
                    "عنبر التوالف والهالك (WH-SCRAP)",
                  ].map((whName) => {
                    const isChecked = formData.warehouses.includes(whName);
                    return (
                      <label key={whName} className="flex items-center gap-2 text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                warehouses: [...formData.warehouses, whName],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                warehouses: formData.warehouses.filter((w) => w !== whName),
                              });
                            }
                          }}
                          className="w-4 h-4 text-primary rounded-sm border-gray-300"
                        />
                        <span>{whName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUserModalOpen(false);
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

      {/* نافذة التحكم وتخصيص الصلاحيات الدقيقة لكل موظف */}
      {isPermModalOpen && permTargetUser && tempPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-gray-900 text-lg">
                    تخصيص صلاحيات الموظف: {permTargetUser.full_name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  الوظيفة: {permTargetUser.role_name_ar} | مفعل حالياً {countActivePermissions(tempPermissions)} من أصل 21 صلاحية
                </p>
              </div>

              <button
                onClick={() => {
                  setIsPermModalOpen(false);
                  setPermTargetUser(null);
                  setTempPermissions(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">أوامر سريعة:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetAllPermissions(true)}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold hover:bg-emerald-100"
                >
                  منح كل الصلاحيات
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllPermissions(false)}
                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold hover:bg-rose-100"
                >
                  إلغاء كل الصلاحيات
                </button>
                <button
                  type="button"
                  onClick={handleResetToRoleDefault}
                  className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md font-bold hover:bg-gray-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  الافتراضي للدور
                </button>
              </div>
            </div>

            {/* Permissions Categories List (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {permissionCategories.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 border-b pb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>{cat.category}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.items.map((item) => {
                      const isGranted = tempPermissions[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleSinglePermission(item.key)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isGranted
                              ? "bg-primary/5 border-primary/30 text-gray-900"
                              : "bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-gray-100/60"
                          }`}
                        >
                          <div className="mt-0.5">
                            {isGranted ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-xs font-bold block">{item.label}</span>
                            <span className="text-[10px] text-gray-500 block leading-tight">{item.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                تسري الصلاحيات الجديدة فور الحفظ على جلسة عمل الموظف
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPermModalOpen(false);
                    setPermTargetUser(null);
                    setTempPermissions(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={handleSavePermissions} className="bg-primary hover:bg-primary-hover text-white">
                  حفظ الصلاحيات المخصصة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد حذف الموظف */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">هل أنت متأكد من حذف هذا الموظف؟</h3>
              <p className="text-xs text-gray-500 mt-1">
                سيتم مسح حساب الموظف من قائمة الفريق فوراً وإلغاء تسجيل دخوله للمنظومة. المعاملات والفواتير السابقة التي سجلها ستظل محفوظة برقمها وموثقة بأرشيف النظام دون أي حذف.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                تراجع
              </Button>
              <Button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                تأكيد الحذف نهائياً
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
