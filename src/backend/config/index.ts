import "dotenv/config";

/**
 * Central config loader (ADR-001: config via env, never hardcoded).
 * DevOps owns the actual values per environment - this module only defines the contract
 * and safe parsing/clamping rules mandated by the ADRs (e.g. PERMISSION_CACHE_TTL <= 300s).
 */

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw === "" ? fallback : raw;
}

// ADR-005 rev.2: default 60s, hard clamp <= 300s (5 min) no matter what is configured.
const PERMISSION_CACHE_TTL_MAX_SECONDS = 300;
const rawPermissionCacheTtl = readInt("PERMISSION_CACHE_TTL", 60);
const permissionCacheTtlSeconds = Math.min(
  Math.max(rawPermissionCacheTtl, 1),
  PERMISSION_CACHE_TTL_MAX_SECONDS
);

export const config = {
  nodeEnv: readString("NODE_ENV", "development"),
  port: readInt("PORT", 4000),
  corsOrigin: readString("CORS_ORIGIN", "http://localhost:5173"),
  databaseUrl: readString("DATABASE_URL", ""),

  jwtSecret: readString("JWT_SECRET", "dev-secret-change-me"),
  sessionTtlSeconds: readInt("SESSION_TTL", 8 * 60 * 60),
  permissionCacheTtlSeconds,

  vatDefaultRate: Number(readString("VAT_DEFAULT_RATE", "7.00")),
  invoiceEditAfterPayment: readString("INVOICE_EDIT_AFTER_PAYMENT", "allow") as
    | "allow"
    | "block",

  socketPath: readString("SOCKET_PATH", "/rt"),
  stockPollFallbackMs: readInt("STOCK_POLL_FALLBACK_MS", 30000)
};

export type AppConfig = typeof config;
