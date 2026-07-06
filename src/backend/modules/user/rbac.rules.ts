import { AppError } from "../../lib/errors";

export interface PermissionTuple {
  roleId: number;
  roleName: string;
  resource: string;
  action: string;
  allow: boolean;
}

/**
 * Guardrail (ECP-024 AC2): reject any permission-matrix save that would leave NO role at all
 * with `user_management.manage_permission = allow` - that would lock everyone out of the
 * config screen forever. `nextState` is the FULL proposed permission matrix after the edit.
 */
export function assertNotLockedOut(nextState: PermissionTuple[]): void {
  const stillHasManager = nextState.some(
    (p) => p.resource === "user_management" && p.action === "manage_permission" && p.allow
  );
  if (!stillHasManager) {
    throw AppError.conflict(
      "ไม่สามารถถอดสิทธิ์นี้ออกจาก role Admin ได้ เนื่องจากจะทำให้ไม่มีผู้ใช้ที่เข้าถึงหน้าจัดการสิทธิ์ได้อีก"
    );
  }
}
