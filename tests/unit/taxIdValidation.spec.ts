/**
 * Q8 — Unit: tax_id validation — 13-digit numeric (ECP-001 AC6, ECP-041 AC3).
 * Rule (identical wording used for both Customer.tax_id and CompanyProfile.tax_id in
 * architecture.md §13.2): must be exactly 13 characters, all numeric digits, when a value is
 * provided at all. tax_id itself is OPTIONAL on Customer at creation time (ECP-001 AC7) — that
 * "is it required right now" business decision is a SEPARATE concern from this validator, which
 * only cares about FORMAT when a non-empty value is actually given.
 *
 * CONTRACT ASSUMPTION (E22/E23/E31 not implemented yet at spec-writing time): recommends (not
 * requires) a single shared pure validator so the same rule isn't duplicated/drifted between
 * Customer and CompanyProfile code paths — assumed `src/shared/taxId.ts` exporting
 * `isValidTaxId(value: string): boolean`. TODO(verify, when E22/E23/E31 land): confirm whether
 * Engineer actually shares one validator or duplicates the regex in customer.schema.ts AND a new
 * companyProfile schema — if duplicated, this same test suite's assertions should be re-run
 * against BOTH real validators to make sure they didn't drift from each other.
 */
import { isValidTaxId } from "../../src/shared/taxId";

describe("tax_id format validation (ECP-001 AC6, ECP-041 AC3)", () => {
  test("TC-Q8-TAX-01: exactly 13 numeric digits -> valid", () => {
    expect(isValidTaxId("0105558000001")).toBe(true);
  });

  test("TC-Q8-TAX-02: fewer than 13 digits -> invalid", () => {
    expect(isValidTaxId("0105558000")).toBe(false); // 10 digits
  });

  test("TC-Q8-TAX-03: more than 13 digits -> invalid", () => {
    expect(isValidTaxId("01055580000012")).toBe(false); // 14 digits
  });

  test("TC-Q8-TAX-04: 13 characters but containing a non-digit -> invalid", () => {
    expect(isValidTaxId("010555800000A")).toBe(false);
  });

  test("TC-Q8-TAX-05: leading zero must be preserved/accepted — validated as a STRING, not coerced to a number (0105558000001 is the exact example given in ECP-001 AC5)", () => {
    expect(isValidTaxId("0105558000001")).toBe(true);
    // if some code path ever coerced to Number then back to string, the leading 0 would be lost
    // and this exact seeded/example value would silently fail - guard against that regression.
  });

  test("TC-Q8-TAX-06: whitespace-padded input is NOT auto-trimmed by this validator (documents strictness — caller/schema layer is expected to .trim() before calling, not this pure fn)", () => {
    expect(isValidTaxId(" 0105558000001 ")).toBe(false);
  });

  test("exploratory: common Thai tax-ID display formatting WITH dashes (e.g. 0-1055-58000-00-1) - flagging as an open question for BA/Engineer: should input be normalized (strip dashes) before validating, or must the user type digits only?", () => {
    // No AC or Data Rule specifies whether dash-formatted input should be accepted/normalized.
    // Documenting REJECTED as the current expected behavior (strict digits-only) until BA says
    // the UI should accept and auto-strip formatting characters.
    expect(isValidTaxId("0-1055-58000-00-1")).toBe(false);
  });

  test("exploratory: empty string - this validator's concern is FORMAT ONLY; whether an empty tax_id is allowed at all (ECP-001 AC7: optional at creation) is a separate schema-level concern, not this function's job", () => {
    expect(isValidTaxId("")).toBe(false);
  });
});
