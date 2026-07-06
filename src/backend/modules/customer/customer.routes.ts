import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { AppError } from "../../lib/errors";
import { nextNumberInTx } from "../../lib/numberSequence";
import { createCustomerSchema, updateCustomerSchema } from "./customer.schema";
import { buildInactiveWarning, createCustomer } from "./customer.service";
import { PrismaCustomerRepository } from "./customer.repository";

export const customerRouter = Router();
const repo = new PrismaCustomerRepository();

customerRouter.get("/", requirePermission("customer", "view"), async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const customers = await prisma.customer.findMany({
      where: q ? { name: { contains: q } } : undefined,
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: customers });
  } catch (err) {
    next(err);
  }
});

customerRouter.get("/:id/pos", requirePermission("customer", "view"), async (req, res, next) => {
  try {
    const customerId = Number(req.params.id);
    const pos = await prisma.purchaseOrder.findMany({
      where: { customerId },
      orderBy: { orderDate: "desc" }
    });
    res.json({ data: pos });
  } catch (err) {
    next(err);
  }
});

customerRouter.post(
  "/",
  requirePermission("customer", "create"),
  auditableRoute("CreateCustomer", "Customer", async (req) => {
    const input = createCustomerSchema.parse(req.body);
    const generateCustomerId = () => prisma.$transaction((tx) => nextNumberInTx(tx, "CUSTOMER"));
    const result = await createCustomer(repo, generateCustomerId, input);
    return {
      status: 201,
      body: { data: result.customer, warning: result.duplicateNameWarning },
      entityId: result.customer.customerId,
      detail: { name: result.customer.name }
    };
  })
);

customerRouter.put(
  "/:id",
  requirePermission("customer", "update"),
  auditableRoute("UpdateCustomer", "Customer", async (req) => {
    const id = Number(req.params.id);
    const input = updateCustomerSchema.parse(req.body);
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("ไม่พบลูกค้ารายนี้ในระบบ");

    const warning = input.status
      ? await buildInactiveWarning(repo, id, input.status)
      : null;

    const updated = await prisma.customer.update({ where: { id }, data: input });
    return {
      body: { data: updated, warning },
      entityId: updated.customerId,
      detail: input
    };
  })
);
