import { describe, it, expect } from "vitest";
import { ExcelEngine } from "@/server/services/excel-engine";

describe("ExcelEngine (محرك الاستيراد والتصدير الآمن)", () => {
  it("يحمي من ثغرات حقن الصيغ (Formula Injection) بتعقيم الرموز = و + و - و @", () => {
    expect(ExcelEngine.sanitizeValue("=cmd|'/C calc'!A0")).toBe("'=cmd|'/C calc'!A0");
    expect(ExcelEngine.sanitizeValue("+1234567")).toBe("'+1234567");
    expect(ExcelEngine.sanitizeValue("-SUM(A1:A10)")).toBe("'-SUM(A1:A10)");
    expect(ExcelEngine.sanitizeValue("@evil.com")).toBe("'@evil.com");
    expect(ExcelEngine.sanitizeValue("أسمنت السويدي مقاوم")).toBe("أسمنت السويدي مقاوم");
  });

  it("يجري محاكاة تجريبية (Dry Run) ويكتشف الأخطاء والتكرارات على مستوى الصفوف", () => {
    const rawRows = [
      {
        "كود الصنف": "PRD-CEM-01",
        "اسم الصنف": "أسمنت السويدي",
        "وحدة الأساس": "BAG",
        "سعر البيع": "145",
      },
      {
        // خطأ: كود مكرر
        "كود الصنف": "PRD-CEM-01",
        "اسم الصنف": "أسمنت السويدي مكرر",
        "وحدة الأساس": "BAG",
        "سعر البيع": "150",
      },
      {
        // خطأ: وحدة أساس غير صحيحة وسعر سالب
        "كود الصنف": "PRD-STL-01",
        "اسم الصنف": "حديد تسليح",
        "وحدة الأساس": "INVALID_UNIT",
        "سعر البيع": "-100",
      },
    ];

    const result = ExcelEngine.validateProductsData(rawRows);

    expect(result.totalRows).toBe(3);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBeGreaterThan(0);
    expect(result.validRows[0].code).toBe("PRD-CEM-01");

    // فحص رسائل الخطأ
    const duplicateError = result.errors.find((e) => e.field === "code");
    expect(duplicateError?.error).toContain("مكرر داخل نفس الملف");

    const unitError = result.errors.find((e) => e.field === "base_unit");
    expect(unitError?.error).toContain("غير معتمدة");
  });

  it("يولد قالب Excel منسق بنجاح", async () => {
    const buffer = await ExcelEngine.generateProductsTemplate();
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
