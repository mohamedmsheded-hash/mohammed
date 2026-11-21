"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { HeaderBar } from "./header-bar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string;
  breadcrumbs?: Array<{ label: string; href?: string }> | string;
}

export function AppShell({ children, title, breadcrumb, breadcrumbs }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayBreadcrumb = typeof breadcrumbs === "string" 
    ? breadcrumbs 
    : Array.isArray(breadcrumbs) 
    ? breadcrumbs.map((b) => b.label).join(" / ") 
    : breadcrumb;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:mr-[260px] min-w-0 flex flex-col">
        <HeaderBar
          onToggleMenu={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          breadcrumb={displayBreadcrumb}
        />
        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
