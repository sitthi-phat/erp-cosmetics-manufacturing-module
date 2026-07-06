import { getVatConfig, updateVatConfig, VatConfigRecord, VatConfigRepository } from "./vatConfig.service";

class FakeVatConfigRepo implements VatConfigRepository {
  current: VatConfigRecord = { id: 1, rate: 7, updatedById: 7, updatedAt: new Date("2026-01-01") };
  async getCurrent() {
    return this.current;
  }
  async updateRate(rate: number, updatedById: number) {
    this.current = { ...this.current, rate, updatedById, updatedAt: new Date() };
    return this.current;
  }
}

describe("vatConfig.service (ECP-038)", () => {
  it("reads the current singleton rate (AC1)", async () => {
    const repo = new FakeVatConfigRepo();
    const config = await getVatConfig(repo);
    expect(config.rate).toBe(7);
  });

  it("updates the rate when within [0,100] (AC2 basis)", async () => {
    const repo = new FakeVatConfigRepo();
    const updated = await updateVatConfig(repo, 10, 7);
    expect(updated.rate).toBe(10);
  });

  it("rejects an out-of-range rate and leaves the old value untouched (AC3)", async () => {
    const repo = new FakeVatConfigRepo();
    await expect(updateVatConfig(repo, 150, 7)).rejects.toThrow(
      "อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%"
    );
    const stillOld = await getVatConfig(repo);
    expect(stillOld.rate).toBe(7);
  });

  it("rejects a negative rate", async () => {
    const repo = new FakeVatConfigRepo();
    await expect(updateVatConfig(repo, -5, 7)).rejects.toThrow();
  });
});
