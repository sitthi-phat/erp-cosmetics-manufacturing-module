import { prisma } from "../../lib/prisma";
import { VatConfigRecord, VatConfigRepository } from "./vatConfig.service";

export class PrismaVatConfigRepository implements VatConfigRepository {
  async getCurrent(): Promise<VatConfigRecord> {
    const row = await prisma.vATConfig.findFirst({ orderBy: { id: "desc" } });
    if (!row) {
      throw new Error("VATConfig has not been seeded yet");
    }
    return { id: row.id, rate: Number(row.rate), updatedById: row.updatedById, updatedAt: row.updatedAt };
  }

  async updateRate(rate: number, updatedById: number): Promise<VatConfigRecord> {
    const current = await this.getCurrent();
    const row = await prisma.vATConfig.update({
      where: { id: current.id },
      data: { rate, updatedById }
    });
    return { id: row.id, rate: Number(row.rate), updatedById: row.updatedById, updatedAt: row.updatedAt };
  }
}

/** Convenience used by invoice.routes.ts to read the rate at issue/revise time. */
export async function getCurrentVatRate(): Promise<number> {
  const repo = new PrismaVatConfigRepository();
  const config = await repo.getCurrent();
  return config.rate;
}
