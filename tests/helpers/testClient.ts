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

// TODO(Engineer): confirm this import path once src/backend/app.ts exists (E0).
// import { app } from "../../src/backend/app";
type ExpressApp = any; // placeholder until app.ts exists — keeps this file type-checkable pre-E0
export const app: ExpressApp = undefined as any;

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
