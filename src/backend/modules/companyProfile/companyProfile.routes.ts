import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { getCompanyProfile, updateCompanyProfile } from "./companyProfile.service";
import { PrismaCompanyProfileRepository } from "./companyProfile.repository";

export const companyProfileRouter = Router();
const repo = new PrismaCompanyProfileRepository();

/** GET/PUT /admin/company-profile (ECP-041) - singleton, Admin only (§13.4 company_profile.manage). */
companyProfileRouter.get(
  "/",
  requirePermission("company_profile", "manage"),
  async (_req, res, next) => {
    try {
      const data = await getCompanyProfile(repo);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

const companyProfileSchema = z.object({
  companyName: z.string().min(1, "กรุณากรอกชื่อบริษัท"),
  address: z.string().min(1, "กรุณากรอกที่อยู่"),
  taxId: z.string(),
  phone: z.string().min(1, "กรุณากรอกเบอร์โทร"),
  logoUrl: z.string().optional().nullable()
});

companyProfileRouter.put(
  "/",
  requirePermission("company_profile", "manage"),
  auditableRoute("UpdateCompanyProfile", "CompanyProfile", async (req) => {
    const input = companyProfileSchema.parse(req.body);
    const updated = await updateCompanyProfile(repo, input, req.userId!);
    return { body: { data: updated }, entityId: String(updated.id), detail: { companyName: input.companyName } };
  })
);
