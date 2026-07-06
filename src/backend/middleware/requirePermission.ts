import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { hasPermission } from "../lib/permissionCache";

/**
 * requirePermission(resource, action) - 403s whenever the resolved permission set does not
 * grant this exact (resource, action) tuple, even if the caller hits the URL directly
 * (ECP-016/022/027-033 AC3). Must run after resolvePermission.
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.permissions) {
      next(AppError.unauthorized());
      return;
    }
    if (!hasPermission(req.permissions, resource, action)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
}
