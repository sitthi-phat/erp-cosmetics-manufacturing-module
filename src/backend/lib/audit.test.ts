import { writeAuditLog, AuditWriter, SystemLogger } from "./audit";

describe("writeAuditLog retry + never-silent-failure (ADR-007, ECP-025 AC3)", () => {
  it("writes once when the writer succeeds immediately", async () => {
    const writer: AuditWriter = { write: jest.fn().mockResolvedValue(undefined) };
    const ok = await writeAuditLog(writer, {
      userId: 1,
      actionType: "Login",
      entityType: "User",
      entityId: "USR-00000001"
    });
    expect(ok).toBe(true);
    expect(writer.write).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on a later attempt", async () => {
    const writer: AuditWriter = {
      write: jest
        .fn()
        .mockRejectedValueOnce(new Error("db down"))
        .mockResolvedValueOnce(undefined)
    };
    const ok = await writeAuditLog(writer, {
      userId: 1,
      actionType: "Login",
      entityType: "User",
      entityId: null
    });
    expect(ok).toBe(true);
    expect(writer.write).toHaveBeenCalledTimes(2);
  });

  it("never fails silently: reports to the system logger after exhausting retries", async () => {
    const writer: AuditWriter = { write: jest.fn().mockRejectedValue(new Error("db down")) };
    const logger: SystemLogger = { error: jest.fn() };

    const ok = await writeAuditLog(
      writer,
      { userId: 1, actionType: "LoginFailed", entityType: "User", entityId: null },
      { retries: 2, logger }
    );

    expect(ok).toBe(false);
    expect(writer.write).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
