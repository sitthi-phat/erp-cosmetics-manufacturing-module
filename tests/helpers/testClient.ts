/**
 * Shared test client / setup helpers for integration & concurrency specs.
 *
 * ASSUMPTIONS (see docs/test-plans/erp-core-prototype/test-plan.md §0/§7):
 * - Engineer exposes the Express app as a named export `app` from `src/backend/app.ts`
 *   (per architecture.md §2). Adjust the import path below once E0 lands if different.
 * - A test-only seed-reset mechanism exists: either `POST /test/seed-reset` (disabled in prod)
 *   or a CLI invoked via `resetSeed()` below. Until Engineer/DevOps confirm, this file wraps both
 *   possibilities behind one function so specs don't need to change later.
 * - `.env.test` provides DATABASE_URL pointing at an isolated test schema.
 */

import request from "supertest";

// RECONCILED by Engineer 2026-07-07 (QA verify DEF-02): src/backend/app.ts now exists and
// exports a ready-made `app` singleton (see src/backend/app.ts bottom for the reconciliation
// note) alongside the `createApp()` factory used by server.ts. This is the one line in this
// file the Engineer changed - everything else in tests/helpers and tests/*.spec.ts is
// untouched, per the QA hand-off boundary.
import { app } from "../../src/backend/app";
export { app };

export const agent = () => request(app);

/**
 * Logs in a seeded user (see fixtures.ts for seeded usernames per role) and returns
 * a supertest agent with the auth cookie attached, so subsequent calls act "as" that user.
 */
export async function loginAs(username: string, password = "Password123!") {
  const a = request.agent(app);
  const res = await a.post("/api/v1/auth/login").send({ username, password });
  if (res.status !== 200) {
    throw new Error(
      `loginAs("${username}") failed with status ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  return a;
}

/**
 * Resets DB to the known seed state (architecture.md §8) between test cases/suites.
 * TODO(DevOps/Engineer): confirm exact mechanism — placeholder calls a test-only endpoint.
 */
export async function resetSeed() {
  await request(app).post("/api/v1/test/seed-reset").expect((res) => {
    if (![200, 204].includes(res.status)) {
      throw new Error(
        `resetSeed() failed (status ${res.status}) — confirm seed-reset mechanism with DevOps/Engineer`
      );
    }
  });
}

/** Fires N async operations truly concurrently (no await between dispatch) — for Q7 specs. */
export async function fireConcurrently<T>(factories: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(factories.map((f) => f()));
}

/** Small sleep helper for TTL-based tests (kept short; PERMISSION_CACHE_TTL should be configured
 *  low in .env.test, see test-plan §7, so these sleeps stay in the seconds range, not minutes). */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- DEF-08 reconciliation helpers (QA verify-3) -----------------------------------------
// Seed data does not expose Prisma-generated primary keys ahead of time (fixtures.ts always
// said so). These resolve real IDs through the actual API instead of guessing/hardcoding a
// placeholder string, per src/backend/modules/product/product.routes.ts and
// src/backend/modules/customer/customer.routes.ts (ground truth for response shape).

type Agent = ReturnType<typeof request.agent>;

/** First customer whose name matches `q` (default: the seeded "บริษัท ABC จำกัด"). */
export async function resolveCustomer(agent: Agent, q = "ABC"): Promise<{ id: number; customerId: string; name: string }> {
  const res = await agent.get("/api/v1/customers").query({ q });
  const match = res.body.data?.[0];
  if (!match) throw new Error(`resolveCustomer("${q}") - no seeded customer matched (status ${res.status})`);
  return match;
}

/** The one seeded product that DOES have an active BOM (prisma/seed.ts: all but the last product). */
export async function resolveProductWithBom(agent: Agent): Promise<{ id: number; name: string; uom: string; hasBom: boolean }> {
  const res = await agent.get("/api/v1/products");
  const match = (res.body.data ?? []).find((p: any) => p.hasBom);
  if (!match) throw new Error(`resolveProductWithBom() - no seeded product has hasBom=true (status ${res.status})`);
  return match;
}

/** The one seeded product that intentionally has NO BOM (ECP-009 AC3, prisma/seed.ts last product). */
export async function resolveProductWithoutBom(agent: Agent): Promise<{ id: number; name: string; uom: string; hasBom: boolean }> {
  const res = await agent.get("/api/v1/products");
  const match = (res.body.data ?? []).find((p: any) => !p.hasBom);
  if (!match) throw new Error(`resolveProductWithoutBom() - every seeded product has a BOM (status ${res.status})`);
  return match;
}

/** All seeded raw materials with their current physical/reserved stock (prisma/seed.ts §8). */
export async function resolveMaterials(
  agent: Agent
): Promise<Array<{ id: number; name: string; uom: string; physicalQty: number; reservedQty: number }>> {
  const res = await agent.get("/api/v1/materials");
  return res.body.data ?? [];
}

/** The material seeded with physicalQty === 0 (last material, ECP-007 AC2). */
export async function resolveZeroStockMaterial(agent: Agent) {
  const materials = await resolveMaterials(agent);
  const match = materials.find((m) => m.physicalQty === 0);
  if (!match) throw new Error("resolveZeroStockMaterial() - no seeded material has physicalQty=0");
  return match;
}
