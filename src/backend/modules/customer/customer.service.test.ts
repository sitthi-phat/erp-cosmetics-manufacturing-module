import { createCustomer, buildInactiveWarning, CustomerRecord, CustomerRepository } from "./customer.service";

class FakeCustomerRepo implements CustomerRepository {
  customers: CustomerRecord[] = [];
  openPoCounts = new Map<number, number>();
  async findByExactName(name: string) {
    return this.customers.find((c) => c.name === name) ?? null;
  }
  async createCustomer(data: any): Promise<CustomerRecord> {
    const record: CustomerRecord = {
      id: this.customers.length + 1,
      customerId: data.customerId,
      name: data.name,
      status: "Active"
    };
    this.customers.push(record);
    return record;
  }
  async countOpenPOs(customerId: number): Promise<number> {
    return this.openPoCounts.get(customerId) ?? 0;
  }
}

describe("customer.service.createCustomer (ECP-001)", () => {
  it("auto-generates customer_id (AC1)", async () => {
    const repo = new FakeCustomerRepo();
    const generateId = jest.fn().mockResolvedValue("CUS-00000001");
    const result = await createCustomer(repo, generateId, { name: "บริษัท ABC" });
    expect(result.customer.customerId).toBe("CUS-00000001");
    expect(generateId).toHaveBeenCalledTimes(1);
  });

  it("warns (does not block) on an exact duplicate name (AC2)", async () => {
    const repo = new FakeCustomerRepo();
    const generateId = jest
      .fn()
      .mockResolvedValueOnce("CUS-00000001")
      .mockResolvedValueOnce("CUS-00000002");
    await createCustomer(repo, generateId, { name: "บริษัท ABC" });
    const second = await createCustomer(repo, generateId, { name: "บริษัท ABC" });

    expect(second.duplicateNameWarning).toMatch(/พบชื่อลูกค้าที่คล้ายกัน/);
    expect(second.customer.customerId).toBe("CUS-00000002"); // still saved successfully
  });

  it("has no warning for a unique name", async () => {
    const repo = new FakeCustomerRepo();
    const generateId = jest.fn().mockResolvedValue("CUS-00000001");
    const result = await createCustomer(repo, generateId, { name: "บริษัท Unique" });
    expect(result.duplicateNameWarning).toBeNull();
  });
});

describe("customer.service.buildInactiveWarning (ECP-002 AC2)", () => {
  it("warns with the exact open PO count when deactivating a customer with open POs", async () => {
    const repo = new FakeCustomerRepo();
    repo.openPoCounts.set(1, 3);
    const warning = await buildInactiveWarning(repo, 1, "Inactive");
    expect(warning).toBe("ลูกค้ารายนี้มี PO ที่ยังไม่ปิด 3 รายการ");
  });

  it("does not warn when there are no open POs", async () => {
    const repo = new FakeCustomerRepo();
    const warning = await buildInactiveWarning(repo, 1, "Inactive");
    expect(warning).toBeNull();
  });

  it("does not warn when the customer stays Active", async () => {
    const repo = new FakeCustomerRepo();
    repo.openPoCounts.set(1, 5);
    const warning = await buildInactiveWarning(repo, 1, "Active");
    expect(warning).toBeNull();
  });
});
