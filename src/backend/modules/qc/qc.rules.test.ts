import { assertInspectable, assertLotUsable } from "./qc.rules";

describe("qc.rules (ECP-015/017)", () => {
  it("allows inspecting a QCPending batch", () => {
    expect(() => assertInspectable("QCPending", null)).not.toThrow();
  });

  it("blocks re-inspecting an already-approved batch and reports who/when (AC3)", () => {
    const at = new Date("2026-07-02T08:00:00Z");
    expect(() =>
      assertInspectable("QCApproved", { result: "Approved", inspectedAt: at, inspectorName: "QA คนที่ 1" })
    ).toThrow(/2026-07-02.*QA คนที่ 1/s);
  });

  it("blocks inspecting a batch that isn't ready for QC at all", () => {
    expect(() => assertInspectable("InProgress", null)).toThrow();
  });

  it("blocks selecting a Failed lot for production (AC2)", () => {
    expect(() => assertLotUsable("Failed")).toThrow("ไม่ผ่านการตรวจสอบคุณภาพ ไม่สามารถนำไปใช้ผลิตได้");
  });

  it("blocks selecting a Pending (not-yet-inspected) lot (AC3)", () => {
    expect(() => assertLotUsable("Pending")).toThrow("ยังไม่ผ่านการตรวจสอบคุณภาพขาเข้า");
  });

  it("allows a Passed lot", () => {
    expect(() => assertLotUsable("Passed")).not.toThrow();
  });
});
