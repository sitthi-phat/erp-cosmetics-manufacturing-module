import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { getVatConfig, updateVatConfig } from "./vatConfig.service";
import { PrismaVatConfigRepository } from "./vatConfig.repository";

export const vatConfigRouter = Router();
const repo = new PrismaVatConfigRepository();

vatConfigRouter.get(
  "/",
  requirePermission("admin", "manage_vat_config"),
  async (_req, res, next) => {
    try {
      const data = await getVatConfig(repo);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

vatConfigRouter.put(
  "/",
  requirePermission("admin", "manage_vat_config"),
  auditableRoute("UpdateVATConfig", "VATConfig", async (req) => {
    const { rate } = z.object({ rate: z.number() }).parse(req.body);
    const updated = await updateVatConfig(repo, rate, req.userId!);
    return { body: { data: updated }, entityId: String(updated.id), detail: { rate } };
  })
);
