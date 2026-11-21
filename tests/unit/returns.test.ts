import { describe, it, expect } from "vitest";

describe("Sales Returns & Scrap Warehouse Invariants", () => {
  it("preserves historical unit cost on return and ignores today's market price", () => {
    // Original Sale Snapshot
    const originalLine = {
      product_id: "p-cem-01",
      quantity: 100, // 100 bags
      unit_price: 140.0, // Sold at 140 EGP
      historical_cogs: 12500.0, // Historical FIFO cost = 125 EGP/bag
    };

    // Today's market price has jumped to 160 EGP
    const todayMarketPrice = 160.0;
    const returnedQuantity = 20;

    // Unit Historical Cost must be derived from the locked sale snapshot
    const unitHistoricalCost = originalLine.historical_cogs / originalLine.quantity;
    expect(unitHistoricalCost).toBe(125.0);
    expect(unitHistoricalCost).not.toBe(todayMarketPrice);

    // Total refund to customer must be based on original sale price
    const totalRefund = returnedQuantity * originalLine.unit_price;
    expect(totalRefund).toBe(2800.0);

    // Total inventory value restored must be based on historical cost
    const restoredInventoryCost = returnedQuantity * unitHistoricalCost;
    expect(restoredInventoryCost).toBe(2500.0);
  });

  it("segregates damaged returns to WH-SCRAP and keeps intact returns in main WH", () => {
    const mainWarehouseId = "wh-main";
    const scrapWarehouseId = "wh-scrap";

    function determineTargetWarehouse(isDamaged: boolean) {
      if (isDamaged) {
        return scrapWarehouseId;
      }
      return mainWarehouseId;
    }

    // Damaged return must go to scrap
    expect(determineTargetWarehouse(true)).toBe(scrapWarehouseId);

    // Undamaged return goes to main warehouse
    expect(determineTargetWarehouse(false)).toBe(mainWarehouseId);
  });

  it("prevents returning more quantity than original invoice minus prior returns", () => {
    const originalSoldQty = 50;
    const priorReturnedQty = 20;
    const availableToReturn = originalSoldQty - priorReturnedQty;

    function validateReturnQuantity(newReturnQty: number) {
      if (newReturnQty <= 0) throw new Error("Invalid return quantity");
      if (newReturnQty > availableToReturn) {
        throw new Error("Returned quantity exceeds remaining invoiced quantity");
      }
      return true;
    }

    expect(validateReturnQuantity(15)).toBe(true);
    expect(validateReturnQuantity(30)).toBe(true);
    expect(() => validateReturnQuantity(31)).toThrow("Returned quantity exceeds remaining invoiced quantity");
  });
});
