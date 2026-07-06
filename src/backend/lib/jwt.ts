import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * JWT identity helper (ADR-005 rev.2). Payload is INTENTIONALLY limited to `user_id` - no
 * role/permission is ever embedded, so a role/permission change can never be "frozen" in a
 * stale token. Authorization always re-resolves from DB (via permissionCache).
 */
export interface TokenPayload {
  user_id: number;
}

export function signUserToken(userId: number): string {
  const payload: TokenPayload = { user_id: userId };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.sessionTtlSeconds });
}

export function verifyUserToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload & { iat: number; exp: number };
  return { user_id: decoded.user_id };
}
