import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { verifyUserToken } from "../lib/jwt";

export const AUTH_COOKIE_NAME = "erp_token";

/**
 * Verifies the JWT identity (httpOnly cookie) and sets req.userId. Does NOT resolve
 * permission here - see middleware/resolvePermission.ts (ADR-005 rev.2 pipeline order:
 * requestId -> auth -> resolvePermission -> requirePermission -> controller -> audit -> errorHandler).
 */
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    next(AppError.unauthorized());
    return;
  }
  try {
    const { user_id } = verifyUserToken(token);
    req.userId = user_id;
    next();
  } catch {
    next(AppError.unauthorized("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"));
  }
}
