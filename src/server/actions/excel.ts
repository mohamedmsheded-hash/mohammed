"use server";

import { ExcelEngine, DryRunResult } from "@/server/services/excel-engine";

/**
 * Simulates a Dry Run import on products data.
 */
export async function simulateProductsDryRunAction(rawRows: any[]): Promise<DryRunResult> {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error("الملف فارغ أو لا يحتوي على صفوف بيانات صالحة");
  }

  return ExcelEngine.validateProductsData(rawRows);
}

/**
 * Generates and returns base64-encoded XLSX template for products.
 */
export async function getProductsTemplateBase64(): Promise<string> {
  const buffer = await ExcelEngine.generateProductsTemplate();
  return buffer.toString("base64");
}
