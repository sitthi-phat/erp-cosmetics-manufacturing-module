import {
  CompanyProfileRecord,
  CompanyProfileRepository,
  getCompanyProfile,
  updateCompanyProfile
} from "./companyProfile.service";

class FakeCompanyProfileRepo implements CompanyProfileRepository {
  current: CompanyProfileRecord | null = null;

  async getCurrent() {
    return this.current;
  }

  async upsert(input: { companyName: string; address: string; taxId: string; phone: string; logoUrl?: string | null }, updatedById: number) {
    this.current = {
      id: this.current?.id ?? 1,
      companyName: input.companyName,
      address: input.address,
      taxId: input.taxId,
      phone: input.phone,
      logoUrl: input.logoUrl ?? null,
      updatedById,
      updatedAt: new Date()
    };
    return this.current;
  }
}

describe("companyProfile.service (ECP-041)", () => {
  it("returns null before any PUT has ever happened (AC1 basis)", async () => {
    const repo = new FakeCompanyProfileRepo();
    expect(await getCompanyProfile(repo)).toBeNull();
  });

  it("sets the profile with a valid 13-digit tax_id (AC1)", async () => {
    const repo = new FakeCompanyProfileRepo();
    const updated = await updateCompanyProfile(
      repo,
      { companyName: "บริษัท ทดสอบ จำกัด", address: "ที่อยู่", taxId: "0105558000001", phone: "021234567" },
      7
    );
    expect(updated.companyName).toBe("บริษัท ทดสอบ จำกัด");
    expect(updated.taxId).toBe("0105558000001");
  });

  it("a 2nd update reuses the SAME singleton row id, never creates a new one (AC1 singleton)", async () => {
    const repo = new FakeCompanyProfileRepo();
    const first = await updateCompanyProfile(
      repo,
      { companyName: "A", address: "a", taxId: "0000000000001", phone: "020000000" },
      7
    );
    const second = await updateCompanyProfile(
      repo,
      { companyName: "B", address: "b", taxId: "0000000000002", phone: "021111111" },
      7
    );
    expect(second.id).toBe(first.id);
  });

  it("rejects a tax_id with fewer than 13 digits, leaving the old value untouched (AC3)", async () => {
    const repo = new FakeCompanyProfileRepo();
    await updateCompanyProfile(
      repo,
      { companyName: "A", address: "a", taxId: "1111111111111", phone: "020000000" },
      7
    );
    await expect(
      updateCompanyProfile(repo, { companyName: "B", address: "b", taxId: "12345", phone: "021111111" }, 7)
    ).rejects.toThrow("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักเท่านั้น");
    const stillOld = await getCompanyProfile(repo);
    expect(stillOld?.taxId).toBe("1111111111111");
  });

  it("rejects a tax_id containing a non-digit character (AC3)", async () => {
    const repo = new FakeCompanyProfileRepo();
    await expect(
      updateCompanyProfile(repo, { companyName: "A", address: "a", taxId: "010555800000A", phone: "020000000" }, 7)
    ).rejects.toThrow();
  });
});
