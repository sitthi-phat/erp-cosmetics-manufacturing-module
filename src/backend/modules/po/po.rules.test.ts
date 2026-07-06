import { assertCanCancel, assertCanConfirm, assertHasLines, assertShippedForInvoice } from "./po.rules";

describe("PO state rules (ECP-004/005/020)", () => {
  it("blocks confirm without at least 1 line (ECP-004 AC3)", () => {
    expect(() => assertHasLines(0)).toThrow(/เพิ่มรายการสินค้าอย่างน้อย 1 รายการ/);
    expect(() => assertHasLines(1)).not.toThrow();
  });

  it("only allows confirm from Draft", () => {
    expect(() => assertCanConfirm("Draft")).not.toThrow();
    expect(() => assertCanConfirm("Confirmed")).toThrow();
  });

  it("allows cancel from Draft/Confirmed, blocks from InProduction (ECP-005 AC1/AC2)", () => {
    expect(() => assertCanCancel("Draft")).not.toThrow();
    expect(() => assertCanCancel("Confirmed")).not.toThrow();
    expect(() => assertCanCancel("InProduction")).toThrow(/เริ่มกระบวนการผลิตแล้ว/);
  });

  it("reports the original cancellation time on a repeated cancel, no double-processing (ECP-005 AC3)", () => {
    const cancelledAt = new Date("2026-07-01T10:00:00Z");
    expect(() => assertCanCancel("Cancelled", cancelledAt)).toThrow(/2026-07-01/);
  });

  it("blocks issuing an invoice before the PO has shipped (ECP-020 AC3)", () => {
    expect(() => assertShippedForInvoice("InProduction")).toThrow(
      "ไม่สามารถออก invoice ได้ PO นี้ยังไม่ถูกจัดส่ง"
    );
    expect(() => assertShippedForInvoice("Shipped")).not.toThrow();
  });
});
