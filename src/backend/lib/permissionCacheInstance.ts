import { prisma } from "./prisma";
import { config } from "../config";
import { PermissionCache, ResolvedUserPermissions } from "./permissionCache";
import { AppError } from "./errors";

async function loadFromDb(userId: number): Promise<ResolvedUserPermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } }
  });
  if (!user) {
    throw AppError.unauthorized("ไม่พบผู้ใช้งานนี้ในระบบ");
  }
  return {
    userId: user.id,
    roleId: user.roleId,
    roleName: user.role.roleName,
    permissions: user.role.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
      allow: p.allow
    }))
  };
}

/** Process-wide permission cache singleton (per-instance cache is fine - ADR-005 rev.2 §Consequences). */
export const permissionCache = new PermissionCache(
  loadFromDb,
  config.permissionCacheTtlSeconds * 1000
);
