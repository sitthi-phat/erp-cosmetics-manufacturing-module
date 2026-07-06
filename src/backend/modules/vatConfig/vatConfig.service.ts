import { validateVatRate } from "../invoice/invoice.calc";

export interface VatConfigRecord {
  id: number;
  rate: number;
  updatedById: number;
  updatedAt: Date;
}

export interface VatConfigRepository {
  getCurrent(): Promise<VatConfigRecord>;
  updateRate(rate: number, updatedById: number): Promise<VatConfigRecord>;
}

/** GET /admin/vat-config (ECP-038 AC1). */
export async function getVatConfig(repo: VatConfigRepository): Promise<VatConfigRecord> {
  return repo.getCurrent();
}

/**
 * PUT /admin/vat-config (ECP-038 AC2/AC3). Validates range before ever touching the DB so an
 * out-of-range submission leaves the existing rate completely untouched.
 */
export async function updateVatConfig(
  repo: VatConfigRepository,
  rate: number,
  updatedById: number
): Promise<VatConfigRecord> {
  validateVatRate(rate); // throws before any write - old rate is preserved (AC3)
  return repo.updateRate(rate, updatedById);
}
