import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuditEntryInput, AuditWriter, writeAuditLog } from "../lib/audit";

export const prismaAuditWriter: AuditWriter = {
  async write(entry: AuditEntryInput) {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? undefined,
        actionType: entry.actionType,
        entityType: entry.entityType,
        entityId: entry.entityId ?? undefined,
        detail: entry.detail === undefined ? undefined : JSON.stringify(entry.detail)
      }
    });
  }
};

export interface AuditableResult {
  status?: number;
  body: unknown;
  entityId?: string | null;
  detail?: unknown;
}

/**
 * Central audit interceptor (ADR-007): wraps a route handler that returns `{status, body,
 * entityId, detail}` instead of calling res.json itself. After the response is sent, the
 * configured (actionType, entityType) pair is written to the append-only audit log. Route
 * handlers never need to sprinkle `audit.write()` calls themselves.
 */
export function auditableRoute(
  actionType: string,
  entityType: string,
  handler: (req: Request) => Promise<AuditableResult>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await handler(req);
      res.status(result.status ?? 200).json(result.body);
      void writeAuditLog(prismaAuditWriter, {
        userId: req.userId ?? null,
        actionType,
        entityType,
        entityId: result.entityId ?? null,
        detail: result.detail
      });
    } catch (err) {
      next(err);
    }
  };
}
