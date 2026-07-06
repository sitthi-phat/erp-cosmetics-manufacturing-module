import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

/** Tags every request with a correlation id (useful for audit/log correlation). */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
