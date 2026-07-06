/**
 * Thai tax ID (เลขประจำตัวผู้เสียภาษี) format validation - shared between Customer (ECP-001
 * AC6, ECP-002 AC4) and CompanyProfile (ECP-041 AC3) since both use the IDENTICAL rule
 * (architecture.md §13.2): exactly 13 characters, all numeric digits, no dashes/spaces.
 *
 * Deliberately strict/pure (no trim, no normalization) - the caller (Zod schema layer) is
 * expected to decide whether/how to trim before calling this; this function's only job is the
 * FORMAT check itself, kept as a single shared source of truth so Customer and CompanyProfile
 * validation never silently drift apart from each other.
 */
export function isValidTaxId(value: string): boolean {
  return /^\d{13}$/.test(value);
}
