import { assertNotLockedOut, PermissionTuple } from "./rbac.rules";

const basePermissions: PermissionTuple[] = [
  { roleId: 7, roleName: "AD", resource: "user_management", action: "manage_permission", allow: true },
  { roleId: 1, roleName: "SA", resource: "po", action: "view", allow: true }
];

describe("RBAC guardrail (ECP-024 AC2)", () => {
  it("allows saving when at least one role keeps manage_permission", () => {
    expect(() => assertNotLockedOut(basePermissions)).not.toThrow();
  });

  it("blocks saving a matrix where no role has manage_permission anymore", () => {
    const next: PermissionTuple[] = [
      { roleId: 7, roleName: "AD", resource: "user_management", action: "manage_permission", allow: false },
      { roleId: 1, roleName: "SA", resource: "po", action: "view", allow: true }
    ];
    expect(() => assertNotLockedOut(next)).toThrow(/ไม่สามารถถอดสิทธิ์นี้ออกจาก role Admin ได้/);
  });

  it("still allows other roles to also hold manage_permission alongside Admin", () => {
    const next: PermissionTuple[] = [
      ...basePermissions,
      { roleId: 2, roleName: "WH", resource: "user_management", action: "manage_permission", allow: true }
    ];
    expect(() => assertNotLockedOut(next)).not.toThrow();
  });
});
