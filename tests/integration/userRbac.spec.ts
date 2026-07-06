/**
 * Q2 — Integration: User Management & RBAC config (ECP-023, ECP-024).
 * Permission-TTL specific timing behavior lives in tests/integration/concurrency/permissionTtl.spec.ts —
 * this file covers the non-timing-dependent parts of the same ACs.
 * Endpoints per src/backend/modules/user/user.routes.ts (ground truth, DEF-08):
 *   GET/POST /users, PUT /users/:id, GET /roles, PUT /roles/:id/permissions
 * `roleId` is a NUMERIC role primary key (NOT a role code string like "PR"/"WH") - resolve it via
 * GET /roles first. `PUT /roles/:id/permissions` body field is `permissions` (not `grants`), and
 * it REPLACES the role's ENTIRE permission set - it is not a partial patch, so tests must submit
 * the full desired list (existing permissions + the one being changed).
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("User Management & RBAC (Epic 8)", () => {
  let admin: ReturnType<typeof request.agent>;
  let roleIdByCode: Record<string, number>;

  beforeAll(async () => {
    await resetSeed();
    admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
  });

  beforeEach(async () => {
    // Role.roleName IS the short code itself (prisma/seed.ts: `roleName: def.code`, e.g. "SA"/"WH"),
    // not a separate code column and not a Thai/English display name.
    const roles = await admin.get("/api/v1/roles");
    roleIdByCode = {};
    for (const r of roles.body.data) roleIdByCode[r.roleName] = r.id;
  });

  test("TC-023-AC1: creating a user auto-generates user_id distinct from username", async () => {
    const res = await admin.post("/api/v1/users").send({
      username: `somchai_${Date.now()}`,
      fullName: "สมชาย ใจดี",
      roleId: roleIdByCode["PR"],
      status: "Active",
      password: "InitialPass123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toMatch(/^USR-\d{8}$/);
    expect(res.body.data.userId).not.toBe(res.body.data.username);
  });

  test("TC-023-AC3: duplicate username is rejected", async () => {
    const username = `dupuser_${Date.now()}`;
    await admin.post("/api/v1/users").send({
      username,
      fullName: "ผู้ใช้ที่หนึ่ง",
      roleId: roleIdByCode["WH"],
      status: "Active",
      password: "InitialPass123!",
    });
    const second = await admin.post("/api/v1/users").send({
      username,
      fullName: "ผู้ใช้ที่สอง",
      roleId: roleIdByCode["WH"],
      status: "Active",
      password: "InitialPass123!",
    });
    // user.service.ts throws AppError.validation() (not conflict) -> 400
    expect(second.status).toBe(400);
    expect(second.body.error.message).toMatch(/มีผู้ใช้งานอยู่แล้ว/);
  });

  test("TC-023-AC4: client-supplied user_id is stripped and ignored", async () => {
    const res = await admin.post("/api/v1/users").send({
      user_id: "USR-HACKED1",
      username: `hackattempt_${Date.now()}`,
      fullName: "พยายามยัด ID",
      roleId: roleIdByCode["WH"],
      status: "Active",
      password: "InitialPass123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.userId).not.toBe("USR-HACKED1");
  });

  test("TC-024-AC1: enabling a permission for a role takes effect on that role's next login (baseline, non-TTL path)", async () => {
    const roles = await admin.get("/api/v1/roles");
    const loRole = roles.body.data.find((r: any) => r.id === roleIdByCode["LO"]);
    const nextPermissions = loRole.permissions
      .filter((p: any) => !(p.resource === "invoice" && p.action === "view"))
      .concat([{ resource: "invoice", action: "view", allow: true }])
      .map((p: any) => ({ resource: p.resource, action: p.action, allow: p.allow }));

    const res = await admin.put(`/api/v1/roles/${roleIdByCode["LO"]}/permissions`).send({
      permissions: nextPermissions,
    });
    expect(res.status).toBe(200);

    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD); // fresh login
    const me = await logistics.get("/api/v1/auth/me");
    expect(me.body.data.permissions).toEqual(
      expect.arrayContaining([expect.objectContaining({ resource: "invoice", action: "view", allow: true })])
    );
  });

  test("TC-024-AC2 (guardrail): removing user_management.manage_permission from Admin entirely is rejected", async () => {
    const roles = await admin.get("/api/v1/roles");
    const adRole = roles.body.data.find((r: any) => r.id === roleIdByCode["AD"]);
    const nextPermissions = adRole.permissions.map((p: any) =>
      p.resource === "user_management" && p.action === "manage_permission"
        ? { resource: p.resource, action: p.action, allow: false }
        : { resource: p.resource, action: p.action, allow: p.allow }
    );

    const res = await admin.put(`/api/v1/roles/${roleIdByCode["AD"]}/permissions`).send({
      permissions: nextPermissions,
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ไม่มีผู้ใช้ที่เข้าถึงหน้าจัดการสิทธิ์ได้อีก/);
  });

  test("exploratory guardrail: a non-existent bulk-update route must not silently accept a lockout either", async () => {
    const res = await admin.put("/api/v1/roles/bulk-permissions").send({
      updates: [{ roleId: roleIdByCode["AD"], grants: [{ resource: "user_management", action: "manage_permission", allow: false }] }],
    });
    // No such route exists (only /roles/:id/permissions) - Express's own 404 is acceptable here;
    // the important invariant is that no such call can ever succeed with a 2xx.
    expect([400, 404, 409]).toContain(res.status);
  });
});
