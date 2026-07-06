/**
 * Thai baht text conversion (ECP-042 AC1/AC5, ADR-009 §3). Pure function, no UI/DB dependency,
 * so it can be unit-tested completely independently (per ADR-009's explicit design goal).
 *
 * Standard Thai number-reading convention:
 *  - digit names: ศูนย์/หนึ่ง/สอง/สาม/สี่/ห้า/หก/เจ็ด/แปด/เก้า
 *  - positional suffixes within each 6-digit group: (units)/สิบ/ร้อย/พัน/หมื่น/แสน, then "ล้าน"
 *    repeats every 6 digits further up (so a 12-digit number reads as two ล้าน groups joined by
 *    "ล้าน", etc.)
 *  - "ยี่" replaces "สอง" specifically at the tens (สิบ) position (20 -> ยี่สิบ, not สองสิบ)
 *  - the tens-position digit 1 has NO digit-name prefix (10 -> สิบ, not หนึ่งสิบ)
 *  - the units-position digit 1 reads as "เอ็ด" instead of "หนึ่ง" whenever the number being read
 *    is not literally the single digit "1" alone (11 -> สิบเอ็ด, 21 -> ยี่สิบเอ็ด, 2,000,001 ->
 *    สองล้านเอ็ด) - this rule is evaluated once per digit-string being read (baht part and satang
 *    part each apply it independently, since they are read as separate numbers).
 */
const DIGIT_NAMES = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const POSITION_SUFFIXES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/**
 * Reads an arbitrary non-negative integer digit string (no leading zeros expected, though a
 * lone "0" is handled by the caller as a special case) into Thai words, per the classic
 * "place mod 6 / ล้าน every 6 digits" algorithm described above.
 */
function readDigitString(digitStr: string): string {
  const len = digitStr.length;
  let result = "";
  for (let i = 0; i < len; i += 1) {
    const digit = Number(digitStr[i]);
    const place = len - i - 1; // distance from the rightmost digit (0 = units)
    const placeInGroup = place % 6;

    if (digit !== 0) {
      if (placeInGroup === 0 && digit === 1 && len > 1 && i !== 0) {
        result += "เอ็ด";
      } else if (placeInGroup === 1 && digit === 2) {
        result += "ยี่";
      } else if (placeInGroup === 1 && digit === 1) {
        // "สิบ" alone, no leading digit name
      } else {
        result += DIGIT_NAMES[digit];
      }
      result += POSITION_SUFFIXES[placeInGroup];
    }

    if (placeInGroup === 0 && place !== 0) {
      result += "ล้าน";
    }
  }
  return result;
}

/** Reads a 0-99 satang value (2-digit, no ร้อย/พัน etc. - satang never exceeds 99). */
function readSatang(satang: number): string {
  if (satang === 0) return "";
  return readDigitString(String(satang));
}

/**
 * thaiBahtText(amount): converts a THB amount into its Thai-words representation, e.g.
 * 51360 -> "ห้าหมื่นหนึ่งพันสามร้อยหกสิบบาทถ้วน" (ECP-042 AC1 worked example).
 * 0 -> "ศูนย์บาทถ้วน" (ECP-042 AC5). Whole-baht amounts (no satang) always end in "ถ้วน";
 * amounts with a satang remainder spell it out with "สตางค์" instead, no "ถ้วน" suffix.
 */
export function thaiBahtText(amount: number): string {
  const sign = amount < 0 ? "ลบ" : "";
  const absAmount = Math.abs(amount);
  // Round to 2 decimal places first (caller's responsibility per convention, but round again
  // defensively here so float noise like 1280.099999999998 never leaks into the digit split).
  const rounded = Math.round((absAmount + Number.EPSILON) * 100) / 100;
  const bahtWhole = Math.floor(rounded);
  const satang = Math.round((rounded - bahtWhole) * 100);

  const bahtText = bahtWhole === 0 ? "ศูนย์" : readDigitString(String(bahtWhole));

  if (satang === 0) {
    return `${sign}${bahtText}บาทถ้วน`;
  }
  return `${sign}${bahtText}บาท${readSatang(satang)}สตางค์`;
}
