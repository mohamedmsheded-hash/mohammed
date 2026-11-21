import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "blue" | "amber" | "gray";

interface StatusBadgeProps {
  label: string;
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

export function StatusBadge({ label, variant = "gray", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
