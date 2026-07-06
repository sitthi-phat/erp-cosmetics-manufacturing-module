/**
 * Reference fixtures matching the seed strategy in architecture.md §8.
 * These are the *expected* seed identities — QA cannot know Prisma-generated internal IDs
 * ahead of time, so specs should look these up via the API (e.g. GET /customers?search=...)
 * rather than hardcoding internal PKs. Usernames/roles/known quantities below are stable
 * because they come directly from the documented seed plan.
 */

export const SEED_USERS = {
  sales: { username: "sales_demo", role: "SA" },
  warehouse: { username: "warehouse_demo", role: "WH" },
  production: { username: "production_demo", role: "PR" },
  qc: { username: "qc_demo", role: "QA" },
  logistics: { username: "logistics_demo", role: "LO" },
  finance: { username: "finance_demo", role: "FI" },
  admin: { username: "admin", role: "AD" },
} as const;

export const DEFAULT_PASSWORD = "Password123!";

export const ROLES = ["SA", "WH", "PR", "QA", "LO", "FI", "AD"] as const;

/** Dashboards keyed by role (ECP-027..033) — used for the RBAC 403 matrix test. */
export const DASHBOARDS_BY_ROLE: Record<(typeof ROLES)[number], string> = {
  SA: "sales",
  WH: "warehouse",
  PR: "production",
  QA: "qc",
  LO: "logistics",
  FI: "finance",
  AD: "admin",
};

/** Known seed facts per architecture.md §8 — used to assert exact numbers, not just "some data". */
export const SEED_FACTS = {
  materialWithZeroStock: "material with 0 remaining stock (seed §8)",
  materialWithLowStock: "material seeded below its low-stock threshold (seed §8)",
  productWithoutBom: "1 finished product intentionally has no BOM (tests ECP-009 AC3)",
  vatDefaultRate: 7.0,
  demoInvoiceChain: "1 demo PO already has Invoice v1 + v2 (revise) + partial payment carry-over",
};
