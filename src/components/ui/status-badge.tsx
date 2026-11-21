import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "blue" | "amber" | "gray";

interface StatusBadgeProps {
  label?: string;
  status?: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-status-green-bg text-status-green border-[#c2ebd5]",
  red: "bg-status-red-bg text-status-red border-[#fad7d7]",
  blue: "bg-status-blue-bg text-status-blue border-[#d1e5ff]",
  amber: "bg-status-amber-bg text-status-amber border-[#fce3bc]",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PREPARING: { label: "قيد التجهيز بالمستودع", variant: "amber" },
  DISPATCHED: { label: "في الطريق بالموقع", variant: "blue" },
  DELIVERED: { label: "تم التسليم بنجاح", variant: "green" },
  CANCELLED: { label: "ملغية", variant: "red" },
  APPROVED: { label: "معتمد ومقفل", variant: "green" },
  DRAFT: { label: "مسودة", variant: "gray" },
  PENDING_APPROVAL: { label: "بانتظار الاعتماد", variant: "amber" },
  NORMAL: { label: "سليم", variant: "green" },
  WARNING: { label: "تحذير", variant: "amber" },
  OVERDUE: { label: "متأخر", variant: "red" },
  VERIFIED: { label: "متحقق منه", variant: "green" },
  RESTORE_TESTED: { label: "تم اختبار الاستعادة", variant: "blue" },
};

export function StatusBadge({ label, status, variant, className }: StatusBadgeProps) {
  const resolved = status ? statusMap[status] : undefined;
  const displayLabel = label || resolved?.label || status || "غير محدد";
  const displayVariant = variant || resolved?.variant || "gray";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        variantStyles[displayVariant],
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
