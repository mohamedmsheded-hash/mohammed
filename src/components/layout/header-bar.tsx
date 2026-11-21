"use client";

import React from "react";
import { Search, Bell, Menu, Building, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderBarProps {
  onToggleMenu: () => void;
  title?: string;
  breadcrumb?: string;
}

export function HeaderBar({ onToggleMenu, title = "لوحة التحكم", breadcrumb = "الرئيسية" }: HeaderBarProps) {
  return (
    <header className="h-[70px] bg-white/95 border-b border-border sticky top-0 z-20 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
      {/* Right Side: Title & Breadcrumbs + Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={onToggleMenu}
          aria-label="القائمة"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </Button>

        <div>
          <div className="text-[11px] text-muted flex items-center gap-1.5 font-medium">
            <span>{breadcrumb}</span>
            <span>/</span>
            <span className="text-foreground font-bold">{title}</span>
          </div>
          <div className="text-base font-extrabold text-foreground hidden sm:block">
            {title}
          </div>
        </div>
      </div>

      {/* Left Side: Search & Branch Indicator & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Active Branch Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-border rounded-element text-xs text-foreground font-bold">
          <Building className="w-3.5 h-3.5 text-brand" />
          <span>المخزن الرئيسي (طريق الواحات)</span>
        </div>

        {/* Global Search */}
        <div className="relative w-40 sm:w-56 hidden sm:block">
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="w-full bg-[#f8fafc] border border-border rounded-element py-1.5 pr-8 pl-3 text-xs outline-none focus:border-brand transition-colors"
          />
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted pointer-events-none" />
        </div>

        {/* Notifications Icon */}
        <button
          className="w-9 h-9 border border-border bg-white rounded-element grid place-items-center text-muted hover:text-foreground relative transition-colors shadow-sm"
          aria-label="التنبيهات"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-brand absolute top-2 left-2 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-border">
          <div className="w-8 h-8 rounded-element bg-brand-soft text-brand grid place-items-center font-extrabold text-xs">
            م
          </div>
          <div className="hidden md:block text-right">
            <b className="text-xs font-bold block text-foreground leading-tight">محمد أحمد</b>
            <div className="flex items-center gap-1 text-[10px] text-muted">
              <Shield className="w-3 h-3 text-brand" />
              <span>مدير عام النظام</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
