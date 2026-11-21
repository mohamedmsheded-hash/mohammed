import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines tailwind classes safely with clsx and twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency amount in EGP with proper Arabic numerals or English numbers
 */
export function formatCurrency(amount: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a quantity with specific unit precision
 */
export function formatQuantity(qty: number, unitCode: string, locale = "ar-EG"): string {
  const decimals = ["TON", "M3", "KG"].includes(unitCode) ? 3 : 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(qty);
}

/**
 * Formats an ISO date string into readable Arabic date
 */
export function formatDate(dateString: string, locale = "ar-EG"): string {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}
