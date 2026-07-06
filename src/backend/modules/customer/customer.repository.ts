import { prisma } from "../../lib/prisma";
import { CustomerRecord, CustomerRepository } from "./customer.service";

export class PrismaCustomerRepository implements CustomerRepository {
  async findByExactName(name: string): Promise<CustomerRecord | null> {
    const row = await prisma.customer.findFirst({ where: { name } });
    return row ? { id: row.id, customerId: row.customerId, name: row.name, status: row.status } : null;
  }

  async createCustomer(data: {
    customerId: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
  }): Promise<CustomerRecord> {
    const row = await prisma.customer.create({ data });
    return { id: row.id, customerId: row.customerId, name: row.name, status: row.status };
  }

  async countOpenPOs(customerId: number): Promise<number> {
    return prisma.purchaseOrder.count({
      where: { customerId, status: { notIn: ["Closed", "Cancelled"] } }
    });
  }
}
