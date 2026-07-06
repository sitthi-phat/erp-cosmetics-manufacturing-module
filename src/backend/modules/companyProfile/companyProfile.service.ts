import { AppError } from "../../lib/errors";
import { isValidTaxId } from "../../../shared/taxId";

export interface CompanyProfileRecord {
  id: number;
  companyName: string;
  address: string;
  taxId: string;
  phone: string;
  logoUrl: string | null;
  updatedById: number;
  updatedAt: Date;
}

export interface UpdateCompanyProfileInput {
  companyName: string;
  address: string;
  taxId: string;
  phone: string;
  logoUrl?: string | null;
}

export interface CompanyProfileRepository {
  getCurrent(): Promise<CompanyProfileRecord | null>;
  upsert(input: UpdateCompanyProfileInput, updatedById: number): Promise<CompanyProfileRecord>;
}

/** GET /admin/company-profile (ECP-041 AC1). Null before first PUT (no seed row exists yet). */
export async function getCompanyProfile(repo: CompanyProfileRepository): Promise<CompanyProfileRecord | null> {
  return repo.getCurrent();
}

/**
 * PUT /admin/company-profile (ECP-041 AC1/AC2/AC3): validates tax_id (13-digit numeric) before
 * ever touching the DB, and always updates the SAME singleton row (never creates a 2nd one) -
 * same "singleton config" pattern as VATConfig (vatConfig.service.ts).
 */
export async function updateCompanyProfile(
  repo: CompanyProfileRepository,
  input: UpdateCompanyProfileInput,
  updatedById: number
): Promise<CompanyProfileRecord> {
  if (!isValidTaxId(input.taxId)) {
    throw AppError.validation("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักเท่านั้น");
  }
  return repo.upsert(input, updatedById);
}
