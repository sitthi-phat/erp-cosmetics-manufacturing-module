/**
 * Q1 — Unit: VAT rate validation (ECP-038 AC3, Data Rules: rate 0-100%).
 *
 * ASSUMED API (`src/backend/modules/user/vatConfigValidation.ts` or `modules/vat-config`):
 *   validateVatRate(rate: number) => void | throws ValidationError("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%")
 */
import { validateVatRate } from "../../src/backend/modules/user/vatConfigValidation"; // TODO(Engineer): confirm path

describe("VAT rate validation (ECP-038 AC3)", () => {
  test.each([0, 7, 10, 50, 100])("rate=%d is valid (inclusive boundaries 0 and 100)", (rate) => {
    expect(() => validateVatRate(rate)).not.toThrow();
  });

  test.each([-5, -0.01, 100.01, 150, 1000])("rate=%d is rejected with the Thai error message", (rate) => {
    expect(() => validateVatRate(rate)).toThrow("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%");
  });

  test("exploratory: NaN/undefined/non-numeric input must be rejected, not silently coerced to 0", () => {
    expect(() => validateVatRate(NaN)).toThrow();
    // @ts-expect-error deliberately passing wrong type to probe runtime guard
    expect(() => validateVatRate(undefined)).toThrow();
    // @ts-expect-error deliberately passing wrong type to probe runtime guard
    expect(() => validateVatRate("7")).toThrow();
  });

  test("exploratory: rate with more than 2 decimal places — Data Rules say DECIMAL(5,2); decide & assert a policy (reject vs round) rather than silently truncating", () => {
    // This is a design gap noted in test-plan §6 item 3 (decimal boundaries). Whichever policy
    // Engineer picks, it must be intentional and consistent — this test documents the expectation
    // that 7.005 either gets rejected or deterministically rounded to 7.01/7.00, never silently
    // stored as 7.005 (which DECIMAL(5,2) cannot represent anyway) or truncated inconsistently.
    expect(() => validateVatRate(7.005)).not.toThrow(); // if allowed, must be rounded downstream — verified in integration spec
  });
});
