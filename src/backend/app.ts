import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { execFile } from "child_process";
import { promisify } from "util";
import { config } from "./config";
import { requestId } from "./middleware/requestId";
import { auth } from "./middleware/auth";
import { resolvePermission } from "./middleware/resolvePermission";
import { errorHandler } from "./middleware/errorHandler";

import { authRouter, userRouter, roleRouter } from "./modules/user/user.routes";
import { customerRouter } from "./modules/customer/customer.routes";
import { productRouter } from "./modules/product/product.routes";
import { stockRouter } from "./modules/stock/stock.routes";
import { traceRouter } from "./modules/stock/trace.routes";
import { poRouter } from "./modules/po/po.routes";
import { productionRouter } from "./modules/production/production.routes";
import { qcRouter } from "./modules/qc/qc.routes";
import { shippingRouter } from "./modules/shipping/shipping.routes";
import { invoiceRouter, poInvoiceRouter } from "./modules/invoice/invoice.routes";
import { vatConfigRouter } from "./modules/vatConfig/vatConfig.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";

const execFileAsync = promisify(execFile);

/**
 * Middleware pipeline per architecture.md §1/§6:
 *   requestId -> auth(JWT identity) -> resolvePermission(cache<=5min) -> RBAC -> controller
 *   -> audit -> errorHandler
 * `auth`/`resolvePermission` are mounted on the whole /api/v1 router except /auth/login
 * (public) and /auth/logout (idempotent, no permission needed) and /auth/me (needs auth only,
 * resolves permission itself for the response body).
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(requestId);

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  const api = express.Router();
  api.use("/auth", authRouter);

  /**
   * QA test-only seed-reset hook (tests/helpers/testClient.ts#resetSeed, DEF-02 reconciliation).
   * Never mounted in production. Re-runs prisma/seed.ts (idempotent full reset+reseed) as a
   * child process so integration/e2e specs can start every suite from the known seed state
   * without the test runner needing its own Prisma/DB wiring.
   */
  if (config.nodeEnv !== "production") {
    api.post("/test/seed-reset", async (_req, res, next) => {
      try {
        await execFileAsync("npx", ["tsx", "prisma/seed.ts"], {
          cwd: process.cwd(),
          shell: true
        });
        res.status(200).json({ data: { ok: true } });
      } catch (err) {
        next(err);
      }
    });
  }

  // Everything below requires a valid session + resolved (fresh, TTL-bounded) permissions.
  api.use(auth, resolvePermission);
  api.use("/users", userRouter);
  api.use("/roles", roleRouter);
  api.use("/customers", customerRouter);
  api.use("/", productRouter);
  api.use("/stock", stockRouter);
  api.use("/trace", traceRouter);
  api.use("/pos", poRouter);
  api.use("/pos", poInvoiceRouter);
  api.use("/production", productionRouter);
  api.use("/qc", qcRouter);
  api.use("/shipments", shippingRouter);
  api.use("/invoices", invoiceRouter);
  api.use("/admin/vat-config", vatConfigRouter);
  api.use("/audit-logs", auditRouter);
  api.use("/dashboard", dashboardRouter);

  app.use("/api/v1", api);

  app.use(errorHandler);

  return app;
}

/**
 * Ready-made instance (architecture.md §2 assumption, reconciled with QA's
 * tests/helpers/testClient.ts which imports a named `app` export directly for supertest).
 * `server.ts` still uses `createApp()` directly; this singleton exists purely for test wiring.
 */
export const app: Express = createApp();
