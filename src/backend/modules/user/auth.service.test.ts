import { login, AuthLookupUser, AuthUserLookup, hashPassword } from "./auth.service";
import { AuditWriter } from "../../lib/audit";

class FakeLookup implements AuthUserLookup {
  constructor(private users: AuthLookupUser[]) {}
  touched: number[] = [];
  async findByUsername(username: string) {
    return this.users.find((u) => u.username === username) ?? null;
  }
  async touchLastLogin(userId: number) {
    this.touched.push(userId);
  }
}

describe("auth.service login (ECP-025)", () => {
  it("succeeds with correct credentials and logs Login success (AC1)", async () => {
    const hash = await hashPassword("secret123");
    const lookup = new FakeLookup([
      { id: 1, userId: "USR-00000001", username: "somchai", passwordHash: hash, status: "Active" }
    ]);
    const writer: AuditWriter = { write: jest.fn().mockResolvedValue(undefined) };

    const result = await login(lookup, writer, "somchai", "secret123");

    expect(result.userId).toBe(1);
    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "Login", userId: 1 })
    );
    expect(lookup.touched).toEqual([1]);
  });

  it("rejects a wrong password and still logs LoginFailed (AC2)", async () => {
    const hash = await hashPassword("secret123");
    const lookup = new FakeLookup([
      { id: 1, userId: "USR-00000001", username: "somchai", passwordHash: hash, status: "Active" }
    ]);
    const writer: AuditWriter = { write: jest.fn().mockResolvedValue(undefined) };

    await expect(login(lookup, writer, "somchai", "wrong")).rejects.toThrow(
      "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
    );
    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "LoginFailed" })
    );
  });

  it("rejects an inactive user even with the correct password", async () => {
    const hash = await hashPassword("secret123");
    const lookup = new FakeLookup([
      { id: 1, userId: "USR-00000001", username: "somchai", passwordHash: hash, status: "Inactive" }
    ]);
    const writer: AuditWriter = { write: jest.fn().mockResolvedValue(undefined) };
    await expect(login(lookup, writer, "somchai", "secret123")).rejects.toThrow();
  });

  it("still attempts to write the audit log even when the audit writer fails (AC3, never silent)", async () => {
    const hash = await hashPassword("secret123");
    const lookup = new FakeLookup([
      { id: 1, userId: "USR-00000001", username: "somchai", passwordHash: hash, status: "Active" }
    ]);
    const writer: AuditWriter = { write: jest.fn().mockRejectedValue(new Error("db down")) };

    // Login itself should still succeed (per ADR-007: don't block login on audit outage),
    // but the writer must have been called (attempted) - never a completely silent bypass.
    const result = await login(lookup, writer, "somchai", "secret123");
    expect(result.userId).toBe(1);
    expect(writer.write).toHaveBeenCalled();
  });
});
