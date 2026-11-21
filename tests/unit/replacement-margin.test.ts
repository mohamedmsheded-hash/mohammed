import { describe, it, expect } from "vitest";

describe("Replacement Margin Analysis for Volatile Construction Materials", () => {
  it("calculates accounting profit and replacement profit accurately", () => {
    // Steel Ton: Sold at 42,500 EGP, FIFO cost was 40,000 EGP, but today mill cost jumped to 42,200 EGP
    const salePrice = 42500;
    const historicalFifoCost = 40000;
    const currentFactoryReplacementCost = 42200;

    const accountingProfit = salePrice - historicalFifoCost;
    const accountingMarginPct = (accountingProfit / salePrice) * 100;

    const replacementProfit = salePrice - currentFactoryReplacementCost;
    const replacementMarginPct = (replacementProfit / salePrice) * 100;

    expect(accountingProfit).toBe(2500);
    expect(accountingMarginPct).toBeCloseTo(5.88, 1);

    expect(replacementProfit).toBe(300);
    expect(replacementMarginPct).toBeCloseTo(0.71, 1);
  });

  it("identifies negative replacement profit (selling at cash-drain despite book profit)", () => {
    // If steel price at the mill surged to 43,000 EGP while sale price was 42,500 EGP
    const salePrice = 42500;
    const historicalFifoCost = 40000;
    const currentFactoryReplacementCost = 43000;

    const accountingProfit = salePrice - historicalFifoCost; // +2500 (appears profitable on books)
    const replacementProfit = salePrice - currentFactoryReplacementCost; // -500 (drains cash on reorder)

    expect(accountingProfit).toBe(2500);
    expect(replacementProfit).toBe(-500);

    const isCashDrain = replacementProfit < 0;
    expect(isCashDrain).toBe(true);
  });
});
