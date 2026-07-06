import { assertBatchShippable, assertCanMarkDelivered, assertDateNotInFuture } from "./shipping.rules";

describe("shipping.rules (ECP-018/019)", () => {
  it("only allows creating a shipment for a QCApproved batch (AC1), rejects others (AC2/AC3)", () => {
    expect(() => assertBatchShippable("QCApproved")).not.toThrow();
    expect(() => assertBatchShippable("QCRejected")).toThrow(/ไม่ผ่านการอนุมัติจาก QA/);
    expect(() => assertBatchShippable("QCPending")).toThrow();
  });

  it("only allows Shipped -> Delivered, blocks skipping from Draft (AC2)", () => {
    expect(() => assertCanMarkDelivered("Shipped")).not.toThrow();
    expect(() => assertCanMarkDelivered("Draft")).toThrow("ต้องมีสถานะ Shipped ก่อน");
  });

  it("rejects a future delivered date (AC3)", () => {
    const now = new Date("2026-07-06T00:00:00Z");
    const future = new Date("2026-07-07T00:00:00Z");
    const past = new Date("2026-07-01T00:00:00Z");
    expect(() => assertDateNotInFuture(future, now)).toThrow("วันที่ส่งถึงต้องไม่เกินวันที่ปัจจุบัน");
    expect(() => assertDateNotInFuture(past, now)).not.toThrow();
  });
});
