import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { nextNumberInTx } from "../../lib/numberSequence";
import { requirePermission } from "../../middleware/requirePermission";
import { auth, AUTH_COOKIE_NAME } from "../../middleware/auth";
import { resolvePermission } from "../../middleware/resolvePermission";
import { auditableRoute, prismaAuditWriter } from "../../middleware/audit";
import { permissionCache } from "../../lib/permissionCacheInstance";
import { signUserToken } from "../../lib/jwt";
import { config } from "../../config";
import { login } from "./auth.service";
import { createUser, updateUser } from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { PrismaUserRepository } from "./user.repository";
import { assertNotLockedOut, PermissionTuple } from "./rbac.rules";

export const authRouter = Router();
export const userRouter = Router();
export const roleRouter = Router();
const repo = new PrismaUserRepository();

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: config.nodeEnv === "production",
  maxAge: config.sessionTtlSeconds * 1000
};

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = z
      .object({ username: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);
    const { userId } = await login(repo, prismaAuditWriter, username, password);
    const token = signUserToken(userId);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ data: { ok: true } });
});

authRouter.get("/me", auth, resolvePermission, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw AppError.unauthorized();
    res.json({
      data: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        role: req.permissions?.roleName,
        permissions: req.permissions?.permissions
      }
    });
  } catch (err) {
    next(err);
  }
});

userRouter.get("/", requirePermission("user_management", "view_users"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ include: { role: true } });
    res.json({
      data: users.map((u) => ({
        id: u.id,
        userId: u.userId,
        username: u.username,
        fullName: u.fullName,
        roleId: u.roleId,
        roleName: u.role.roleName,
        status: u.status
      }))
    });
  } catch (err) {
    next(err);
  }
});

userRouter.post(
  "/",
  requirePermission("user_management", "manage_users"),
  auditableRoute("CreateUser", "User", async (req) => {
    const input = createUserSchema.parse(req.body);
    const generateUserId = () => prisma.$transaction((tx) => nextNumberInTx(tx, "USER"));
    const user = await createUser(repo, generateUserId, input);
    return { status: 201, body: { data: user }, entityId: user.userId, detail: { username: user.username } };
  })
);

userRouter.put(
  "/:id",
  requirePermission("user_management", "manage_users"),
  auditableRoute("UpdateUser", "User", async (req) => {
    const id = Number(req.params.id);
    const input = updateUserSchema.parse(req.body);
    const invalidator = { invalidate: (uid: number) => permissionCache.invalidate(uid) };
    const user = await updateUser(repo, invalidator, id, input);
    return { body: { data: user }, entityId: user.userId, detail: input };
  })
);

roleRouter.get("/", requirePermission("user_management", "view_users"), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    res.json({ data: roles });
  } catch (err) {
    next(err);
  }
});

const updatePermissionsSchema = z.object({
  permissions: z.array(
    z.object({ resource: z.string(), action: z.string(), allow: z.boolean() })
  )
});

roleRouter.put(
  "/:id/permissions",
  requirePermission("user_management", "manage_permission"),
  auditableRoute("UpdateRolePermissions", "Role", async (req) => {
    const roleId = Number(req.params.id);
    const { permissions } = updatePermissionsSchema.parse(req.body);

    const allRoles = await prisma.role.findMany({ include: { permissions: true } });
    const nextState: PermissionTuple[] = allRoles.flatMap((role) =>
      (role.id === roleId ? permissions : role.permissions).map((p) => ({
        roleId: role.id,
        roleName: role.roleName,
        resource: p.resource,
        action: p.action,
        allow: p.allow
      }))
    );
    assertNotLockedOut(nextState); // ECP-024 AC2 guardrail, checked BEFORE any write

    await prisma.$transaction(async (tx) => {
      await tx.permission.deleteMany({ where: { roleId } });
      await tx.permission.createMany({
        data: permissions.map((p) => ({ roleId, resource: p.resource, action: p.action, allow: p.allow }))
      });
    });
    permissionCache.invalidateByRole(roleId); // proactive fast-path (still bounded by TTL either way)

    return {
      body: { data: { ok: true } },
      entityId: String(roleId),
      detail: { permissions }
    };
  })
);
