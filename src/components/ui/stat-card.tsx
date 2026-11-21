import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  color?: "primary" | "success" | "warning" | "neutral" | string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  color,
  trend,
  className,
}: StatCardProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      const colorClass =
        color === "primary"
          ? "text-brand"
          : color === "success"
          ? "text-status-green"
          : color === "warning"
          ? "text-amber-500"
          : "text-muted/80";
      return <IconComponent className={cn("w-5 h-5", colorClass)} />;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-card p-4 shadow-card min-w-0 transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted text-xs font-semibold mb-2">
        <span>{title}</span>
        {icon && <div className="text-muted/80">{renderIcon()}</div>}
      </div>
      <div className="flex items-baseline gap-1.5 text-xl font-extrabold text-foreground tracking-tight">
        <span>{value}</span>
        {unit && <span className="text-xs font-normal text-muted">{unit}</span>}
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "font-bold",
                trend.isPositive ? "text-status-green" : "text-status-red"
              )}
            >
              {trend.isPositive ? "↑ " : "↓ "}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
