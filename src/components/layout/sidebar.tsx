"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  FileSpreadsheet,
  Truck,
  RotateCcw,
  Package,
  Boxes,
  Users,
  Building2,
  Wallet,
  CreditCard,
  BarChart3,
  FileUp,
  ShieldCheck,
  Archive,
  History,
  Settings,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم", href: "/", icon: LayoutDashboard },
  { id: "sales", label: "المبيعات والفواتير", href: "/sales", icon: Receipt, badge: "جديد" },
  { id: "purchases", label: "المشتريات والاستلام", href: "/purchases", icon: ShoppingCart },
  { id: "quotes", label: "عروض الأسعار والحجوزات", href: "/quotes", icon: FileSpreadsheet },
  { id: "delivery", label: "التوصيل والنقل", href: "/delivery", icon: Truck },
  { id: "returns", label: "المرتجعات والإلغاءات", href: "/returns", icon: RotateCcw },
  { id: "products", label: "المنتجات والتسعير", href: "/products", icon: Package },
  { id: "inventory", label: "المخزون والجرد", href: "/inventory", icon: Boxes },
  { id: "customers", label: "العملاء", href: "/customers", icon: Users },
  { id: "suppliers", label: "الموردون", href: "/suppliers", icon: Building2 },
  { id: "finance", label: "الخزنة والحسابات", href: "/finance", icon: Wallet },
  { id: "expenses", label: "المصروفات", href: "/expenses", icon: CreditCard },
  { id: "reports", label: "التقارير والتحليلات", href: "/reports", icon: BarChart3 },
  { id: "excel", label: "مركز Excel", href: "/excel", icon: FileUp, badge: "مهم" },
  { id: "users", label: "الموظفون والصلاحيات", href: "/users", icon: ShieldCheck },
  { id: "archive", label: "الأرشيف التاريخي", href: "/archive", icon: Archive },
  { id: "activity", label: "سجل النشاط والتدقيق", href: "/activity", icon: History },
  { id: "settings", label: "الإعدادات والنسخ الاحتياطي", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-[260px] bg-nav text-white fixed right-0 top-0 bottom-0 overflow-y-auto p-4 z-30 transition-transform duration-200 border-l border-white/5",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-4 mb-2 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff9b48] to-[#e56b19] grid place-items-center text-white shadow-accent font-extrabold text-xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <strong className="text-base tracking-wide block font-extrabold text-white">
              مخازن ERP
            </strong>
            <small className="text-[#9eacbe] text-[10px] block">
              نظام تجارة مواد البناء
            </small>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="text-[10px] text-[#77879d] font-extrabold px-3 py-2 uppercase tracking-wider">
          القائمة الرئيسية
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-element text-xs font-semibold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#ed802a] to-[#e46d1c] text-white shadow-accent"
                    : "text-nav-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-nav-muted")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "mr-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-white/10 text-nav-muted"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Operational Guard Footer Note */}
        <div className="mt-8 mx-1 p-3 bg-white/5 border border-white/10 rounded-xl text-[#b9c3d0] text-[10px] leading-relaxed">
          <b className="text-white block mb-1">الضابط المحاسبي:</b>
          تغير أسعار النهاردة مبيغيرش فواتير امبارح. التكاليف والأرباح القديمة مقفولة وثابتة.
        </div>
      </aside>
    </>
  );
}
