import { UnitConversion } from "@/types/domain";

export class UnitConverter {
  /**
   * Converts a given quantity from an entered unit to the product's base unit.
   * If enteredUnitId === baseUnitId, returns the quantity directly.
   */
  static toBaseUnit(
    quantity: number,
    enteredUnitId: string,
    baseUnitId: string,
    conversions: UnitConversion[]
  ): { baseQuantity: number; factor: number } {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    if (enteredUnitId === baseUnitId) {
      return { baseQuantity: quantity, factor: 1.0 };
    }

    const conversion = conversions.find(
      (c) =>
        c.is_active &&
        c.from_unit_id === enteredUnitId &&
        c.to_unit_id === baseUnitId
    );

    if (!conversion) {
      // Check reverse conversion
      const reverseConversion = conversions.find(
        (c) =>
          c.is_active &&
          c.from_unit_id === baseUnitId &&
          c.to_unit_id === enteredUnitId
      );

      if (reverseConversion && reverseConversion.multiplier > 0) {
        const factor = 1 / reverseConversion.multiplier;
        const baseQuantity = quantity * factor;
        return {
          baseQuantity: Math.round(baseQuantity * 1000) / 1000,
          factor,
        };
      }

      throw new Error(
        `لم يتم العثور على معامل تحويل سارٍ بين الوحدة المدخلة والوحدة الأساسية`
      );
    }

    const factor = conversion.multiplier;
    const baseQuantity = quantity * factor;

    return {
      baseQuantity: Math.round(baseQuantity * 1000) / 1000,
      factor,
    };
  }

  /**
   * Converts from base unit to a target display unit
   */
  static fromBaseUnit(
    baseQuantity: number,
    targetUnitId: string,
    baseUnitId: string,
    conversions: UnitConversion[]
  ): number {
    if (targetUnitId === baseUnitId) {
      return baseQuantity;
    }

    const conversion = conversions.find(
      (c) =>
        c.is_active &&
        c.from_unit_id === targetUnitId &&
        c.to_unit_id === baseUnitId
    );

    if (conversion && conversion.multiplier > 0) {
      return Math.round((baseQuantity / conversion.multiplier) * 1000) / 1000;
    }

    throw new Error(`معامل التحويل غير متاح للوحدة المستهدفة`);
  }
}
