import { formatSequenceNumber, formatInvoiceDisplayNumber, periodKeyFor } from "./numberFormat";

describe("numberFormat (ADR-006 rev.2)", () => {
  it("formats Customer ID as CUS-NNNNNNNN (8 digits, no period)", () => {
    expect(formatSequenceNumber("CUSTOMER", 42n)).toBe("CUS-00000042");
  });

  it("formats User ID as USR-NNNNNNNN (8 digits, no period)", () => {
    expect(formatSequenceNumber("USER", 15n)).toBe("USR-00000015");
  });

  it("formats PO number as PO-YYYYMM-NNNNNN", () => {
    const d = new Date(2026, 6, 6); // July 2026 (month index 6)
    expect(formatSequenceNumber("PO", 1n, d)).toBe("PO-202607-000001");
  });

  it("formats Batch number as B-YYYYMMDD-NNNNN", () => {
    const d = new Date(2026, 6, 6);
    expect(formatSequenceNumber("BATCH", 1n, d)).toBe("B-20260706-00001");
  });

  it("formats Shipment number as SH-YYYYMMDD-NNNNN", () => {
    const d = new Date(2026, 6, 6);
    expect(formatSequenceNumber("SHIPMENT", 1n, d)).toBe("SH-20260706-00001");
  });

  it("formats Invoice number as INV-YYYY-NNNNNN", () => {
    const d = new Date(2026, 6, 6);
    expect(formatSequenceNumber("INVOICE", 123n, d)).toBe("INV-2026-000123");
  });

  it("does NOT truncate when the counter overflows the padded width (grows instead)", () => {
    expect(formatSequenceNumber("CUSTOMER", 100000000n)).toBe("CUS-100000000");
    expect(formatSequenceNumber("CUSTOMER", 100000000n).length).toBeGreaterThan(
      "CUS-00000042".length
    );
  });

  it("builds the invoice display number with 2-digit version suffix", () => {
    expect(formatInvoiceDisplayNumber("INV-2026-000123", 1)).toBe("INV-2026-000123-v01");
    expect(formatInvoiceDisplayNumber("INV-2026-000123", 2)).toBe("INV-2026-000123-v02");
  });

  it("global-running kinds (CUSTOMER/USER) use a fixed period key regardless of date", () => {
    const p1 = periodKeyFor("CUSTOMER", new Date(2026, 0, 1));
    const p2 = periodKeyFor("CUSTOMER", new Date(2030, 11, 31));
    expect(p1).toBe(p2);
  });

  it("period-scoped kinds change period key across day/month/year boundaries", () => {
    expect(periodKeyFor("PO", new Date(2026, 6, 1))).not.toBe(periodKeyFor("PO", new Date(2026, 7, 1)));
    expect(periodKeyFor("BATCH", new Date(2026, 6, 1))).not.toBe(
      periodKeyFor("BATCH", new Date(2026, 6, 2))
    );
    expect(periodKeyFor("INVOICE", new Date(2026, 6, 1))).not.toBe(
      periodKeyFor("INVOICE", new Date(2027, 6, 1))
    );
  });
});
