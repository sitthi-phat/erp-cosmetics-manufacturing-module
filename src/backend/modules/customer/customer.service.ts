import { CreateCustomerInput } from "./customer.schema";

export interface CustomerRecord {
  id: number;
  customerId: string;
  name: string;
  status: "Active" | "Inactive";
}

export interface CustomerRepository {
  findByExactName(name: string): Promise<CustomerRecord | null>;
  createCustomer(data: {
    customerId: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
  }): Promise<CustomerRecord>;
  countOpenPOs(customerId: number): Promise<number>;
}

export type CustomerIdGenerator = () => Promise<string>;

export interface CreateCustomerResult {
  customer: CustomerRecord;
  /** ECP-001 AC2: duplicate name warns but never blocks the save. */
  duplicateNameWarning: string | null;
}

/** ECP-001: auto-gen customer_id (AC1/AC4), warn (don't block) on exact-duplicate name (AC2). */
export async function createCustomer(
  repo: CustomerRepository,
  generateCustomerId: CustomerIdGenerator,
  input: CreateCustomerInput
): Promise<CreateCustomerResult> {
  const duplicate = await repo.findByExactName(input.name);
  const customerId = await generateCustomerId();
  const customer = await repo.createCustomer({
    customerId,
    name: input.name,
    address: input.address,
    phone: input.phone,
    email: input.email,
    contactPerson: input.contactPerson
  });
  return {
    customer,
    duplicateNameWarning: duplicate
      ? "พบชื่อลูกค้าที่คล้ายกันในระบบ กรุณาตรวจสอบก่อนดำเนินการต่อ"
      : null
  };
}

/** ECP-002 AC2: setting a customer Inactive while it still has open POs warns but doesn't block. */
export async function buildInactiveWarning(
  repo: CustomerRepository,
  customerId: number,
  nextStatus: "Active" | "Inactive"
): Promise<string | null> {
  if (nextStatus !== "Inactive") return null;
  const openCount = await repo.countOpenPOs(customerId);
  if (openCount === 0) return null;
  return `ลูกค้ารายนี้มี PO ที่ยังไม่ปิด ${openCount} รายการ`;
}
