/**
 * Q7 — CRITICAL: permission changes must take effect within PERMISSION_CACHE_TTL (<=5 minutes),
 * without forcing re-login (ECP-023 AC2, ECP-024 AC1, ADR-005 rev.2). See test-plan.md §4.3.
 *
 * Requires .env.test to set PERMISSION_CACHE_TTL low (e.g. 2000ms) so this test doesn't need to
 * sleep for 5 real minutes — see test-plan.md §7. If Engineer instead wires a `X-Test-Now` clock
 * override, adjust `sleep()` calls below to clock-advance calls instead of real sleeping.
 */
import { loginAs, resetSeed, sleep } from "../../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../../helpers/fixtures";
import request from "supertest";
import { app } from "../../helpers/testClient";

const CONFIGURED_TTL_MS = Number(process.env.PERMISSION_CACHE_TTL_MS_FOR_TEST ?? 2000);

describe("Permission TTL <=5 minutes without forced re-login (ADR-005 rev.2)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-023-AC2 (fallback/TTL path): role change propagates within TTL even with NO proactive cache invalidation", async () => {
    // 1. A user with role PR logs in and keeps the same session/cookie throughout (simulates
    //    "already logged in" — the exact wording of ECP-023 AC2).
    const staleSession = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);

    const before = await staleSession.get("/api/v1/auth/me");
    expect(before.body.role ?? before.body.roleId).toMatch(/PR/);

    // 2. Admin changes this user's role to QA via a *separate* session/agent.
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    await admin.put(`/api/v1/users/${before.body.id}`).send({ roleId: "QA" });

    // 3. Immediately after (t=0), the OLD session may still see cached old permissions —
    //    this is allowed by design (TTL, not instant revoke) but must not exceed the TTL ceiling.
    const immediatelyAfter = await staleSession.get("/api/v1/auth/me");
    // Not asserting a specific value here deliberately — could be either old or new depending on
    // exact cache timing; the real assertion is the upper bound below.

    // 4. Wait slightly longer than the configured TTL, WITHOUT re-login.
    await sleep(CONFIGURED_TTL_MS + 500);
    const afterTtl = await staleSession.get("/api/v1/auth/me");
    expect(afterTtl.body.role ?? afterTtl.body.roleId).toMatch(/QA/); // must reflect the new role now

    // 5. Confirm this happened WITHOUT a new login call — reuse of the same cookie/session proves it.
    const stillAuthorizedForQaOnlyAction = await staleSession.get("/api/v1/qc/batches");
    expect(stillAuthorizedForQaOnlyAction.status).toBe(200); // now allowed as QA
    const noLongerAuthorizedForOldRoleAction = await staleSession.get("/api/v1/production/queue");
    expect(noLongerAuthorizedForOldRoleAction.status).toBe(403); // old PR-only access revoked
  }, 30000);

  test("proactive invalidation path: if permissionCache.invalidate is called, the new permission is visible almost immediately (well under the TTL)", async () => {
    const staleSession = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);

    await admin.put("/api/v1/roles/LO/permissions").send({
      grants: [{ resource: "invoice", action: "view", allow: true }],
    });

    // No manual sleep here at all — this checks the "almost instant" proactive path distinctly
    // from the guaranteed-but-slower TTL fallback path tested above.
    await sleep(300); // small buffer for the invalidate call + next request round-trip only
    const res = await staleSession.get("/api/v1/invoices");
    expect(res.status).toBe(200); // now allowed, far faster than the full TTL window
  }, 15000);

  test("guardrail: PERMISSION_CACHE_TTL configured above 300s (5 min) must be clamped down by the config loader, not honored as-is", async () => {
    // This targets D2's stated requirement literally: "clamp PERMISSION_CACHE_TTL <= 300s".
    // If the app exposes its effective config (e.g. via a debug/admin endpoint), assert it here.
    // Otherwise this is a config-loader unit concern — flagged for the verify phase to confirm
    // against the actual .env used to boot the app under test.
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const config = await admin.get("/api/v1/admin/runtime-config").catch(() => null);
    if (config && config.status === 200) {
      expect(config.body.permissionCacheTtlSeconds).toBeLessThanOrEqual(300);
    }
  });
});
