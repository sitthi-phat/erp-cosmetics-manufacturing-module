import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton (ADR-003). Repositories/services import this instead of
 * instantiating PrismaClient themselves so there is exactly one connection pool per process.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
