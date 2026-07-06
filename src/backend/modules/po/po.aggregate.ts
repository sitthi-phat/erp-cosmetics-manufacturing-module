export interface POLineForAggregate {
  productId: number;
  quantity: number;
}

export interface BomLookup {
  [productId: number]: Array<{ materialId: number; materialName: string; qtyPerUnit: number }> | undefined;
}

export interface AggregatedNeed {
  materialId: number;
  materialName: string;
  qtyPerUnit: number; // unused after aggregation, kept for clarity when debugging
}

/**
 * Aggregates the total raw-material need across every line of a PO (a PO can order several
 * products that share materials) - used by confirm/cancel to reserve/release the correct total
 * per material_id instead of naively looping per-line (which could double count or race).
 */
export function aggregateMaterialNeed(
  lines: POLineForAggregate[],
  bomByProduct: BomLookup
): Map<number, { materialName: string; qty: number }> {
  const result = new Map<number, { materialName: string; qty: number }>();
  for (const line of lines) {
    const bomLines = bomByProduct[line.productId];
    if (!bomLines) continue; // caller is expected to have already asserted BOM existence
    for (const bomLine of bomLines) {
      const needQty = bomLine.qtyPerUnit * line.quantity;
      const existing = result.get(bomLine.materialId);
      if (existing) {
        existing.qty += needQty;
      } else {
        result.set(bomLine.materialId, { materialName: bomLine.materialName, qty: needQty });
      }
    }
  }
  return result;
}
