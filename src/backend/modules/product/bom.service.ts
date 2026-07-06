import { AppError } from "../../lib/errors";

export interface BomLineNeed {
  materialId: number;
  materialName: string;
  qtyPerUnit: number;
}

export interface MaterialAvailability {
  materialId: number;
  availableQty: number;
}

export interface ShortageDetail {
  materialId: number;
  materialName: string;
  neededQty: number;
  availableQty: number;
  shortQty: number;
}

export interface BomCheckResult {
  sufficient: boolean;
  shortages: ShortageDetail[];
}

/** ECP-009 AC3: a product with no BOM at all can never be confirmed - block explicitly. */
export function assertHasBom(bomLines: BomLineNeed[] | null | undefined): asserts bomLines is BomLineNeed[] {
  if (!bomLines || bomLines.length === 0) {
    throw AppError.validation(
      "สินค้านี้ยังไม่มีสูตรการผลิต (BOM) ในระบบ กรุณาติดต่อผู้ดูแลระบบ"
    );
  }
}

/**
 * ECP-009: need = Sum(qty_per_unit x order_qty) per material, compared against `available`
 * (physical - reserved). Reports ONLY the materials that are actually short (AC2), never
 * flags materials that already have enough.
 */
export function checkBomStock(
  bomLines: BomLineNeed[],
  orderQty: number,
  availability: MaterialAvailability[]
): BomCheckResult {
  const availableByMaterial = new Map(availability.map((a) => [a.materialId, a.availableQty]));
  const shortages: ShortageDetail[] = [];

  for (const line of bomLines) {
    const neededQty = Number((line.qtyPerUnit * orderQty).toFixed(3));
    const availableQty = availableByMaterial.get(line.materialId) ?? 0;
    if (availableQty < neededQty) {
      shortages.push({
        materialId: line.materialId,
        materialName: line.materialName,
        neededQty,
        availableQty,
        shortQty: Number((neededQty - availableQty).toFixed(3))
      });
    }
  }

  return { sufficient: shortages.length === 0, shortages };
}
