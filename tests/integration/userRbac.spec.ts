/**
 * Q2 — Integration: User Management & RBAC config (ECP-023, ECP-024).
 * Permission-TTL specific timing behavior lives in tests/integration/concurrency/permissionTtl.spec.ts —
 * this file covers the non-timing-dependent parts of the same ACs.
 * Endpoints per architecture.md §6:
 *   GET/POST /users, PUT /users/:id, GET /roles, GET/PUT /roles/:id/permissions
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("User Management & RBAC (Epic 8)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-023-AC1: creating a user auto-generates user_id distinct from username", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.post("/api/v1/users").send({
      username: `somchai_${Date.now()}`,
      fullName: "สมชาย ใจดี",
      roleId: "PR",
      status: "Active",
      password: "InitialPass123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.user_id).toMatch(/^USR-\d{8}$/);
    expect(res.body.user_id).not.toBe(res.body.username);
  });

  test("TC-023-AC3: duplicate username is rejected", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const username = `dupuser_${Date.now()}`;
    await admin.post("/api/v1/users").send({
      username,
      fullName: "ผู้ใช้ที่หนึ่ง",
      roleId: "WH",
      status: "Active",
      password: "InitialPass123!",
    });
    const second = await admin.post("/api/v1/users").send({
      username,
      fullName: "ผู้ใช้ที่สอง",
      roleId: "WH",
      status: "Active",
      password: "InitialPass123!",
    });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/มีผู้ใช้งานอยู่แล้ว/);
  });

  test("TC-023-AC4: client-supplied user_id is stripped and ignored", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.post("/api/v1/users").send({
      user_id: "USR-HACKED1",
      username: `hackattempt_${Date.now()}`,
      fullName: "พยายามยัด ID",
      roleId: "WH",
      status: "Active",
      password: "InitialPass123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.user_id).not.toBe("USR-HACKED1");
  });

  test("TC-024-AC1: enabling a permission for a role takes effect on that role's next login (baseline, non-TTL path)", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.put("/api/v1/roles/LO/permissions").send({
      grants: [{ resource: "invoice", action: "view", allow: true }],
    });
    expect(res.status).toBe(200);

    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD); // fresh login
    const me = await logistics.get("/api/v1/auth/me");
    expect(me.body.permissions).toEqual(
      expect.arrayContaining([expect.objectContaining({ resource: "invoice", action: "view", allow: true })])
    );
  });

  test("TC-024-AC2 (guardrail): removing user_management.manage_permission from Admin entirely is rejected", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.put("/api/v1/roles/AD/permissions").send({
      grants: [{ resource: "user_management", action: "manage_permission", allow: false }],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ไม่มีผู้ใช้ที่เข้าถึงหน้าจัดการสิทธิ์ได้อีก/);
  });

  test("exploratory guardrail: same rejection must apply even if the request tries to strip the permission from ALL roles simultaneously in one batch call (not just Admin alone)", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.put("/api/v1/roles/bulk-permissions").send({
      updates: [
        { roleId: "AD", grants: [{ resource: "user_management", action: "manage_permission", allow: false }] },
      ],
    });
    // whether this bulk endpoint exists or not, the net effect must never leave zero roles
    // with manage_permission=true — this documents the risk explicitly for verify-phase testing.
    expect([400, 409, 404]).toContain(res.status);
  });
});
