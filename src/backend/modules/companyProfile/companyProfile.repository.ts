import { prisma } from "../../lib/prisma";
import { CompanyProfileRecord, CompanyProfileRepository, UpdateCompanyProfileInput } from "./companyProfile.service";

function toRecord(row: any): CompanyProfileRecord {
  return {
    id: row.id,
    companyName: row.companyName,
    address: row.address,
    taxId: row.taxId,
    phone: row.phone,
    logoUrl: row.logoUrl ?? null,
    updatedById: row.updatedById,
    updatedAt: row.updatedAt
  };
}

export class PrismaCompanyProfileRepository implements CompanyProfileRepository {
  async getCurrent(): Promise<CompanyProfileRecord | null> {
    const row = await prisma.companyProfile.findFirst({ orderBy: { id: "desc" } });
    return row ? toRecord(row) : null;
  }

  /** Singleton semantics (ECP-041 AC1): update the existing row if one exists, else create the first. */
  async upsert(input: UpdateCompanyProfileInput, updatedById: number): Promise<CompanyProfileRecord> {
    const current = await this.getCurrent();
    const data = {
      companyName: input.companyName,
      address: input.address,
      taxId: input.taxId,
      phone: input.phone,
      logoUrl: input.logoUrl ?? null,
      updatedById
    };
    const row = current
      ? await prisma.companyProfile.update({ where: { id: current.id }, data })
      : await prisma.companyProfile.create({ data });
    return toRecord(row);
  }
}

/** Convenience used by invoice.routes.ts to read the issuer snapshot at issue/revise time. */
export async function getCurrentCompanyProfile(): Promise<CompanyProfileRecord | null> {
  const repo = new PrismaCompanyProfileRepository();
  return repo.getCurrent();
}
