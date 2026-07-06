import bcrypt from "bcryptjs";
import { AppError } from "../../lib/errors";
import { AuditWriter, writeAuditLog } from "../../lib/audit";

export interface AuthLookupUser {
  id: number;
  userId: string;
  username: string;
  passwordHash: string;
  status: "Active" | "Inactive";
}

export interface AuthUserLookup {
  findByUsername(username: string): Promise<AuthLookupUser | null>;
  touchLastLogin(userId: number): Promise<void>;
}

/**
 * Login (ECP-025): verifies credentials and ALWAYS attempts to write an audit log entry
 * (Success or Failed) before returning - never a silent login/rejection with zero audit trail
 * (AC1/AC2/AC3). A failed audit write is retried and, if still failing, reported to the system
 * logger (see lib/audit.ts) rather than blocking the login flow itself.
 */
export async function login(
  lookup: AuthUserLookup,
  auditWriter: AuditWriter,
  username: string,
  password: string
): Promise<{ userId: number }> {
  const user = await lookup.findByUsername(username);
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
  const success = Boolean(user) && user!.status === "Active" && passwordOk;

  await writeAuditLog(auditWriter, {
    userId: user?.id ?? null,
    actionType: success ? "Login" : "LoginFailed",
    entityType: "User",
    entityId: user?.userId ?? username,
    detail: { username }
  });

  if (!success) {
    throw AppError.unauthorized("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  await lookup.touchLastLogin(user!.id);
  return { userId: user!.id };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
