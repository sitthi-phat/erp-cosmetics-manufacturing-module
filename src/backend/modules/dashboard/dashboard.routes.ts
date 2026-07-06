import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { hasPermission } from "../../lib/permissionCache";

export const dashboardRouter = Router();

const VALID_ROLES = ["sales", "warehouse", "production", "qc", "logistics", "finance", "admin"] as const;
type DashboardRole = (typeof VALID_ROLES)[number];

dashboardRouter.get("/:role", async (req, res, next) => {
  try {
    const role = req.params.role as DashboardRole;
    if (!VALID_ROLES.includes(role)) {
      throw AppError.notFound("ไม่พบ dashboard นี้");
    }
    if (!req.permissions || !hasPermission(req.permissions, "dashboard", role)) {
      throw AppError.forbidden();
    }

    switch (role) {
      case "sales": {
        const grouped = await prisma.purchaseOrder.groupBy({ by: ["status"], _count: true });
        const isEmpty = grouped.length === 0;
        res.json({
          data: {
            byStatus: grouped.map((g) => ({ status: g.status, count: g._count })),
            isEmpty,
            // ECP-027 AC2: exact Thai message shown when there are zero POs in the system yet.
            emptyStateMessage: isEmpty ? "เริ่มต้นสร้าง PO แรกของคุณ" : null
          }
        });
        return;
      }
      case "warehouse": {
        const materials = await prisma.rawMaterial.findMany({ include: { stockBalance: true } });
        const lowStockThreshold = 100;
        const lowStock = materials
          .map((m) => ({
            materialId: m.id,
            name: m.name,
            physicalQty: m.stockBalance ? Number(m.stockBalance.physicalQty) : 0
          }))
          .filter((m) => m.physicalQty < lowStockThreshold);

        // ECP-028 AC3: products missing a BOM must not crash the dashboard - surface a separate warning instead.
        const productsMissingBom = await prisma.product.count({ where: { bom: null } });

        res.json({
          data: {
            lowStock,
            productsMissingBomCount: productsMissingBom,
            missingBomWarning:
              productsMissingBom > 0 ? `มีสินค้า ${productsMissingBom} รายการที่ยังไม่มีสูตรในระบบ` : null
          }
        });
        return;
      }
      case "production": {
        const pending = await prisma.productionOrder.count({ where: { status: "Assigned" } });
        const orders = await prisma.productionOrder.findMany({
          where: { status: "Assigned" },
          include: { po: true, poLine: { include: { product: true } } }
        });
        res.json({
          data: {
            pendingCount: pending,
            orders,
            // ECP-029 AC2: exact Thai message when there is nothing pending, instead of a bare 0.
            emptyStateMessage: pending === 0 ? "ไม่มีงานผลิตค้างในขณะนี้" : null
          }
        });
        return;
      }
      case "qc": {
        const [pending, approved, rejected] = await Promise.all([
          prisma.batch.count({ where: { status: "QCPending" } }),
          prisma.batch.count({ where: { status: "QCApproved" } }),
          prisma.batch.count({ where: { status: "QCRejected" } })
        ]);
        res.json({
          data: {
            pending,
            approved,
            rejected,
            emptyStateMessage: pending === 0 && approved === 0 && rejected === 0 ? "ยังไม่มี Batch ในระบบ" : null
          }
        });
        return;
      }
      case "logistics": {
        const readyToShip = await prisma.batch.count({
          where: { status: "QCApproved", shipments: { none: {} } }
        });
        res.json({
          data: {
            readyToShip,
            emptyStateMessage: readyToShip === 0 ? "ไม่มีรายการรอจัดส่งในขณะนี้" : null
          }
        });
        return;
      }
      case "finance": {
        const invoices = await prisma.invoice.findMany({ where: { status: { not: "Superseded" } } });
        const outstanding = invoices.filter((i) => i.status !== "Paid");
        const totalOutstanding = outstanding.reduce(
          (sum, i) => sum + Number(i.totalAmount),
          0
        );
        res.json({
          data: {
            totalOutstanding: Number(totalOutstanding.toFixed(2)),
            countOutstanding: outstanding.length,
            emptyStateMessage: outstanding.length === 0 ? "ไม่มี invoice ค้างชำระในขณะนี้" : null
          }
        });
        return;
      }
      case "admin": {
        const roles = await prisma.role.findMany({ include: { users: true } });
        const recentAudit = await prisma.auditLog.findMany({
          orderBy: { timestamp: "desc" },
          take: 10
        });
        res.json({
          data: {
            usersByRole: roles.map((r) => ({ roleName: r.roleName, count: r.users.length })),
            recentAudit
          }
        });
        return;
      }
    }
  } catch (err) {
    next(err);
  }
});
