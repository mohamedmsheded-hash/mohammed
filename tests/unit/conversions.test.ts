import { describe, it, expect } from "vitest";
import { UnitConverter } from "@/server/services/unit-converter";
import { UnitConversion } from "@/types/domain";

describe("UnitConverter (محول وحدات مواد البناء)", () => {
  const cementConversions: UnitConversion[] = [
    {
      id: "conv-1",
      product_id: "prod-cement-swd",
      from_unit_id: "unit-ton",
      to_unit_id: "unit-bag",
      multiplier: 20, // 1 طن = 20 شيكارة زنة 50 كجم
      version: 1,
      is_active: true,
    },
  ];

  it("يحول من الطن إلى الشكائر بدقة بناء على معامل تحويل الصنف", () => {
    // 5 أطنان أسمنت -> 5 × 20 = 100 شيكارة
    const result = UnitConverter.toBaseUnit(
      5,
      "unit-ton",
      "unit-bag",
      cementConversions
    );
    expect(result.baseQuantity).toBe(100);
    expect(result.factor).toBe(20);
  });

  it("يحول العكس من الشكائر إلى الطن بدقة", () => {
    // 50 شيكارة أسمنت -> 50 / 20 = 2.5 طن
    const tons = UnitConverter.fromBaseUnit(
      50,
      "unit-ton",
      "unit-bag",
      cementConversions
    );
    expect(tons).toBe(2.5);
  });

  it("يعيد نفس الكمية إذا كانت الوحدة المدخلة هي نفسها وحدة الأساس", () => {
    const result = UnitConverter.toBaseUnit(
      15.5,
      "unit-ton",
      "unit-ton",
      cementConversions
    );
    expect(result.baseQuantity).toBe(15.5);
    expect(result.factor).toBe(1.0);
  });

  it("يرفض التحويل إذا لم يتوفر معامل تحويل مسجل للصنف", () => {
    expect(() => {
      UnitConverter.toBaseUnit(
        10,
        "unit-meter",
        "unit-bag",
        cementConversions
      );
    }).toThrow("لم يتم العثور على معامل تحويل");
  });
});
