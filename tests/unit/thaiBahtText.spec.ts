/**
 * Q8 — Unit: thaiBahtText (ECP-042 AC1/AC5, ADR-009 §3 "Thai baht text = pure function").
 *
 * CONTRACT (written parallel with Engineer, E32 not implemented yet at spec-writing time —
 * Gate 2 Round 2 policy: do not wait for code, write from documented contract, mark TODO for
 * anything ambiguous): pure fn `thaiBahtText(amount: number): string` exported from
 * `src/shared/thaiBahtText.ts` per ADR-009 decision #3 ("Engineer ต้องแยก thaiBahtText เป็น pure
 * function ใน src/shared/ เพื่อให้ QA unit-test ได้อิสระ").
 *
 * TODO(verify, when E32 lands): reconcile file path/export name against the real implementation
 * (same reconciliation pattern already used for invoiceVat.spec.ts/bomCheck.spec.ts during Gate 1
 * verify). The exact-string assertions below are anchored to the ONE concrete worked example
 * pond gave (51,360.00 -> "ห้าหมื่นหนึ่งพันสามร้อยหกสิบบาทถ้วน", ECP-042 AC1) plus the standard
 * Thai number-reading convention (เอ็ด/ยี่/ล้าน/สตางค์/ถ้วน) described in ADR-009 §3 — Thai
 * number-to-text has a few edge cases where different implementations disagree (e.g. exact
 * spelling at the satang-only boundary), so do not treat every assertion here as unquestionable
 * ground truth until cross-checked with Engineer's real output.
 */
import { thaiBahtText } from "../../src/shared/thaiBahtText";

describe("thaiBahtText (ECP-042 AC1/AC5)", () => {
  test("TC-Q8-BAHT-01 (ECP-042 AC5, exact required string): 0 => ศูนย์บาทถ้วน", () => {
    expect(thaiBahtText(0)).toBe("ศูนย์บาทถ้วน");
  });

  test("TC-Q8-BAHT-02 (ECP-042 AC1 worked example, exact string): 51360 => ห้าหมื่นหนึ่งพันสามร้อยหกสิบบาทถ้วน", () => {
    expect(thaiBahtText(51360)).toBe("ห้าหมื่นหนึ่งพันสามร้อยหกสิบบาทถ้วน");
  });

  test("TC-Q8-BAHT-03: whole-baht amounts (no satang) always end with ถ้วน (ECP-042 AC2/AC5 rule)", () => {
    expect(thaiBahtText(100)).toMatch(/ถ้วน$/);
    expect(thaiBahtText(4280)).toMatch(/ถ้วน$/);
  });

  test("TC-Q8-BAHT-04: satang portion is spelled out with สตางค์, no ถ้วน suffix when satang > 0", () => {
    const result = thaiBahtText(1280.5);
    expect(result).toContain("สตางค์");
    expect(result).not.toMatch(/ถ้วน$/);
  });

  test('TC-Q8-BAHT-05 ("เอ็ด" rule): units digit 1 with a non-zero tens digit reads as เอ็ด, not หนึ่ง', () => {
    expect(thaiBahtText(21)).toBe("ยี่สิบเอ็ดบาทถ้วน");
  });

  test('TC-Q8-BAHT-06: "สิบเอ็ด"/"สิบ" alone at the tens boundary (no leading หนึ่ง before สิบ)', () => {
    expect(thaiBahtText(11)).toBe("สิบเอ็ดบาทถ้วน");
    expect(thaiBahtText(10)).toBe("สิบบาทถ้วน");
  });

  test('TC-Q8-BAHT-07 ("ยี่" rule): tens digit 2 reads as ยี่สิบ, not สองสิบ', () => {
    expect(thaiBahtText(20)).toBe("ยี่สิบบาทถ้วน");
  });

  test("TC-Q8-BAHT-08 (ล้าน boundary): exactly 1,000,000", () => {
    expect(thaiBahtText(1000000)).toBe("หนึ่งล้านบาทถ้วน");
  });

  test("TC-Q8-BAHT-09: เอ็ด rule still applies to the remainder after a ล้าน chunk", () => {
    expect(thaiBahtText(2000001)).toBe("สองล้านเอ็ดบาทถ้วน");
  });

  test("TC-Q8-BAHT-10: satang-only amount (no whole baht) still reads ศูนย์บาท + satang, no ถ้วน", () => {
    // Documented as needing confirmation against Engineer's real output — several conventions
    // exist for "0.50 baht" style amounts; asserting the two invariants that DEFINITELY must hold
    // (contains สตางค์, does not end in ถ้วน) rather than a single hardcoded full string.
    const result = thaiBahtText(0.5);
    expect(result).toContain("สตางค์");
    expect(result).not.toMatch(/ถ้วน$/);
  });

  test("exploratory: negative amount does not throw (no AC reaches this path in practice — ECP-020 AC5 blocks discount>subtotal before a negative total could ever reach thaiBahtText)", () => {
    expect(() => thaiBahtText(-100)).not.toThrow();
  });

  test("exploratory: amount in the billions does not throw or silently truncate the ล้าน chain", () => {
    expect(() => thaiBahtText(1234567890.25)).not.toThrow();
    expect(thaiBahtText(1234567890.25)).toContain("ล้าน");
  });

  test("exploratory: floating-point input (e.g. 1280.1 + 0.4 style accumulation) must not leak float noise into the satang text", () => {
    const result = thaiBahtText(Math.round((1280.1 + 0.4) * 100) / 100); // caller is expected to round to 2dp first
    expect(result).not.toMatch(/\d/); // no raw digits should ever leak into the Thai text output
  });
});
