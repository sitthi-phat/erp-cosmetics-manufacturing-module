import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requirePermission } from "../../middleware/requirePermission";

export const auditRouter = Router();

/**
 * GET /audit-logs (ECP-026 AC1/AC2) - filter by user/action/date range, paginated.
 * There is intentionally no PUT/DELETE handler anywhere in this router (ADR-007, ECP-026 AC3);
 * any such request falls through to Express's default 404, never reaching a mutation path.
 */
auditRouter.get("/", requirePermission("audit", "view"), async (req, res, next) => {
  try {
    const { userId, actionType, from, to, page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const where: any = {};
    if (userId) where.userId = Number(userId);
    if (actionType) where.actionType = actionType;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { timestamp: "desc" }, skip, take }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ data: items, meta: { total, page: Number(page) || 1, pageSize: take } });
  } catch (err) {
    next(err);
  }
});
