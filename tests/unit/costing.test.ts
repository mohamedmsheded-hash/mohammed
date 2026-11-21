import { describe, it, expect } from "vitest";
import { CostingEngine } from "@/server/services/costing-engine";
import { CostLayer } from "@/types/domain";

describe("CostingEngine (محرك احتساب التكلفة)", () => {
  it("يحسب تكلفة البضاعة المباعة بدقة وفق طريقة FIFO المعتمدة في الوثيقة (مثال 7.4)", () => {
    // استلام 100 وحدة بتكلفة 80، ثم 100 وحدة بتكلفة 90
    const mockLayers: CostLayer[] = [
      {
        id: "layer-1",
        organization_id: "org-1",
        warehouse_id: "wh-1",
        product_id: "prod-cement",
        initial_qty: 100,
        remaining_qty: 100,
        purchase_unit_price: 80,
        landed_cost_unit: 0,
        total_unit_cost: 80,
        is_exhausted: false,
        received_at: "2026-01-01T10:00:00Z",
      },
      {
        id: "layer-2",
        organization_id: "org-1",
        warehouse_id: "wh-1",
        product_id: "prod-cement",
        initial_qty: 100,
        remaining_qty: 100,
        purchase_unit_price: 90,
        landed_cost_unit: 0,
        total_unit_cost: 90,
        is_exhausted: false,
        received_at: "2026-01-10T10:00:00Z",
      },
    ];

    // بيع 120 وحدة
    const plan = CostingEngine.allocateFIFO(120, mockLayers, false);

    // التحقق: 100 من الطبقة الأولى (8000) + 20 من الطبقة الثانية (1800) = 9800
    expect(plan.totalAllocatedQty).toBe(120);
    expect(plan.totalCogs).toBe(9800);
    expect(plan.allocations).toHaveLength(2);
    expect(plan.allocations[0]).toEqual({
      cost_layer_id: "layer-1",
      quantity_consumed: 100,
      unit_cost: 80,
      total_cost: 8000,
    });
    expect(plan.allocations[1]).toEqual({
      cost_layer_id: "layer-2",
      quantity_consumed: 20,
      unit_cost: 90,
      total_cost: 1800,
    });
    expect(plan.remainingNeeded).toBe(0);
  });

  it("يرفض الصرف ويمنع المخزون السالب إذا كانت الكمية المطلوبة تتجاوز المتاح", () => {
    const mockLayers: CostLayer[] = [
      {
        id: "layer-1",
        organization_id: "org-1",
        warehouse_id: "wh-1",
        product_id: "prod-steel",
        initial_qty: 50,
        remaining_qty: 50,
        purchase_unit_price: 40000,
        landed_cost_unit: 500,
        total_unit_cost: 40500,
        is_exhausted: false,
        received_at: "2026-01-01T10:00:00Z",
      },
    ];

    // طلب 60 طن والمتاح 50 فقط مع إغلاق المخزون السالب
    expect(() => {
      CostingEngine.allocateFIFO(60, mockLayers, false);
    }).toThrow("المخزون المتاح غير كافٍ");
  });

  it("يحسب المتوسط المرجح المتحرك بدقة عند استلام شحنة جديدة (مثال 7.5)", () => {
    // 100 وحدة بمتوسط 80 + استلام 100 وحدة جديدة بتكلفة 90
    const newAverage = CostingEngine.calculateMovingAverage(100, 80, 100, 90);
    // (8000 + 9000) / 200 = 85
    expect(newAverage).toBe(85);
  });

  it("يوزع مصاريف النقل والتفريغ (Landed Costs) بنسبة الوزن على البنود", () => {
    const items = [
      { id: "item-steel-20t", weightKg: 20000, value: 800000 },
      { id: "item-cement-10t", weightKg: 10000, value: 45000 },
    ];
    // إجمالي نولون الشاحنة 6000 جنيه
    const allocations = CostingEngine.allocateLandedCost(items, 6000, "BY_WEIGHT");

    // نسبة الحديد: 20000 / 30000 = 2/3 -> 4000 ج.م
    // نسبة الأسمنت: 10000 / 30000 = 1/3 -> 2000 ج.م
    expect(allocations.get("item-steel-20t")).toBe(4000);
    expect(allocations.get("item-cement-10t")).toBe(2000);
  });
});
