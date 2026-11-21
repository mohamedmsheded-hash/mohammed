import { CostLayer, CostAllocationResult } from "@/types/domain";

export interface AllocationPlan {
  totalAllocatedQty: number;
  totalCogs: number;
  averageUnitCost: number;
  allocations: CostAllocationResult[];
  remainingNeeded: number;
}

/**
 * Pure Domain Costing Engine: Computes FIFO Cost Layer Allocations
 * Invariant: Historical transactions are immutable and priced strictly based on actual inventory layers.
 */
export class CostingEngine {
  /**
   * Allocates cost from available open FIFO cost layers.
   * Throws an error if required quantity exceeds total available quantity and allowNegative is false.
   */
  static allocateFIFO(
    requiredQty: number,
    availableLayers: CostLayer[],
    allowNegative = false
  ): AllocationPlan {
    if (requiredQty <= 0) {
      throw new Error("Required quantity for allocation must be greater than zero");
    }

    let needed = requiredQty;
    let totalCogs = 0;
    const allocations: CostAllocationResult[] = [];

    // Filter and sort open layers strictly ascending by receipt date (FIFO)
    const openLayers = availableLayers
      .filter((layer) => !layer.is_exhausted && layer.remaining_qty > 0)
      .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());

    for (const layer of openLayers) {
      if (needed <= 0) break;

      const takeQty = Math.min(layer.remaining_qty, needed);
      const layerCost = takeQty * layer.total_unit_cost;

      allocations.push({
        cost_layer_id: layer.id,
        quantity_consumed: takeQty,
        unit_cost: layer.total_unit_cost,
        total_cost: layerCost,
      });

      totalCogs += layerCost;
      needed -= takeQty;
    }

    if (needed > 0 && !allowNegative) {
      throw new Error(
        `المخزون المتاح غير كافٍ لتغطية الكمية المطلوبة. العجز: ${needed.toFixed(3)}`
      );
    }

    const totalAllocatedQty = requiredQty - needed;
    const averageUnitCost = totalAllocatedQty > 0 ? totalCogs / totalAllocatedQty : 0;

    return {
      totalAllocatedQty,
      totalCogs: Math.round(totalCogs * 100) / 100,
      averageUnitCost: Math.round(averageUnitCost * 10000) / 10000,
      allocations,
      remainingNeeded: needed,
    };
  }

  /**
   * Calculates new Moving Weighted Average cost upon receiving new stock
   */
  static calculateMovingAverage(
    currentStockQty: number,
    currentAvgCost: number,
    newReceivedQty: number,
    newReceivedUnitCost: number
  ): number {
    const currentTotalValue = currentStockQty * currentAvgCost;
    const newTotalValue = newReceivedQty * newReceivedUnitCost;
    const totalQty = currentStockQty + newReceivedQty;

    if (totalQty <= 0) return 0;
    const newAverage = (currentTotalValue + newTotalValue) / totalQty;
    return Math.round(newAverage * 10000) / 10000;
  }

  /**
   * Calculates Landed Cost allocation per unit for a shipment
   * Supported methods: BY_WEIGHT, BY_VALUE
   */
  static allocateLandedCost(
    items: Array<{ id: string; weightKg: number; value: number }>,
    totalLandedExpense: number,
    method: "BY_WEIGHT" | "BY_VALUE"
  ): Map<string, number> {
    const results = new Map<string, number>();

    const totalBasis = items.reduce((sum, item) => {
      return sum + (method === "BY_WEIGHT" ? item.weightKg : item.value);
    }, 0);

    if (totalBasis <= 0) {
      // Split evenly if no weight/value basis exists
      const equalShare = totalLandedExpense / items.length;
      items.forEach((item) => results.set(item.id, equalShare));
      return results;
    }

    for (const item of items) {
      const basis = method === "BY_WEIGHT" ? item.weightKg : item.value;
      const share = (basis / totalBasis) * totalLandedExpense;
      results.set(item.id, Math.round(share * 100) / 100);
    }

    return results;
  }
}
