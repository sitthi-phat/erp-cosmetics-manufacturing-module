import { prisma } from "../../lib/prisma";
import { CustomerRecord, CustomerRepository } from "./customer.service";

function toRecord(row: { id: number; customerId: string; name: string; status: "Active" | "Inactive"; taxId: string | null; registeredAddress: string | null }): CustomerRecord {
  return {
    id: row.id,
    customerId: row.customerId,
    name: row.name,
    status: row.status,
    taxId: row.taxId,
    registeredAddress: row.registeredAddress
  };
}

export class PrismaCustomerRepository implements CustomerRepository {
  async findByExactName(name: string): Promise<CustomerRecord | null> {
    const row = await prisma.customer.findFirst({ where: { name } });
    return row ? toRecord(row) : null;
  }

  async createCustomer(data: {
    customerId: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    taxId?: string;
    registeredAddress?: string;
  }): Promise<CustomerRecord> {
    const row = await prisma.customer.create({ data });
    return toRecord(row);
  }

  async countOpenPOs(customerId: number): Promise<number> {
    return prisma.purchaseOrder.count({
      where: { customerId, status: { notIn: ["Closed", "Cancelled"] } }
    });
  }
}
