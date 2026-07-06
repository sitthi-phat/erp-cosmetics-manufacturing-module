import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { permissionCache } from "../lib/permissionCacheInstance";

/**
 * Resolves the caller's CURRENT role + permissions from permissionCache (TTL-bounded, DB is
 * source of truth). Must run after `auth` (needs req.userId) and before any `requirePermission`.
 */
export async function resolvePermission(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (req.userId === undefined) {
    next(AppError.unauthorized());
    return;
  }
  try {
    req.permissions = await permissionCache.resolve(req.userId);
    next();
  } catch (err) {
    next(err);
  }
}
