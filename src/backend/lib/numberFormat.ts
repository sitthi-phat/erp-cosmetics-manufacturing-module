/**
 * Pure formatting helpers for document/entity numbers (ADR-006 rev.2).
 * Kept dependency-free (no Prisma/DB) so the padding/overflow rule can be unit tested in
 * isolation from the concurrency-safe counter mechanism (see lib/numberSequence.ts).
 */

export type SequenceKind =
  | "CUSTOMER"
  | "USER"
  | "PO"
  | "BATCH"
  | "SHIPMENT"
  | "INVOICE";

export interface SequenceDefinition {
  prefix: string;
  padLength: number;
  /** Returns the period_key to scope the running counter (e.g. "202607", "20260706", or "" for global). */
  periodKey: (now: Date) => string;
}

function yyyymm(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function yyyymmdd(d: Date): string {
  return `${yyyymm(d)}${String(d.getDate()).padStart(2, "0")}`;
}

function yyyy(d: Date): string {
  return `${d.getFullYear()}`;
}

// Global running numbers (Customer/User) use a fixed period key "ALL" so the counter never resets.
const GLOBAL_PERIOD = "ALL";

export const SEQUENCE_DEFINITIONS: Record<SequenceKind, SequenceDefinition> = {
  CUSTOMER: { prefix: "CUS", padLength: 8, periodKey: () => GLOBAL_PERIOD },
  USER: { prefix: "USR", padLength: 8, periodKey: () => GLOBAL_PERIOD },
  PO: { prefix: "PO", padLength: 6, periodKey: yyyymm },
  BATCH: { prefix: "B", padLength: 5, periodKey: yyyymmdd },
  SHIPMENT: { prefix: "SH", padLength: 5, periodKey: yyyymmdd },
  INVOICE: { prefix: "INV", padLength: 6, periodKey: yyyy }
};

/**
 * Compose the human-readable number from a raw counter value.
 * Padding NEVER truncates: if the counter overflows the configured digit width the number
 * simply gets longer (e.g. CUS-100000000) instead of wrapping/clashing (ADR-006 rev.2).
 */
export function formatSequenceNumber(
  kind: SequenceKind,
  counter: bigint | number,
  now: Date = new Date()
): string {
  const def = SEQUENCE_DEFINITIONS[kind];
  const counterStr = counter.toString();
  const padded = counterStr.padStart(def.padLength, "0");
  const period = def.periodKey(now);
  if (kind === "PO") return `${def.prefix}-${period}-${padded}`;
  if (kind === "BATCH" || kind === "SHIPMENT") return `${def.prefix}-${period}-${padded}`;
  if (kind === "INVOICE") return `${def.prefix}-${period}-${padded}`;
  // CUSTOMER / USER: no period segment.
  return `${def.prefix}-${padded}`;
}

export function periodKeyFor(kind: SequenceKind, now: Date = new Date()): string {
  return SEQUENCE_DEFINITIONS[kind].periodKey(now);
}

/** Build the display number for an invoice version, e.g. INV-2026-000123-v02 (ADR-006 rev.2). */
export function formatInvoiceDisplayNumber(invoiceNo: string, version: number): string {
  return `${invoiceNo}-v${String(version).padStart(2, "0")}`;
}
