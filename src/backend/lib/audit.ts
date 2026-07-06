/**
 * Audit log write path (ADR-007). Append-only: there is intentionally no update/delete method
 * anywhere in this file or its callers (ECP-026 AC3).
 */

export interface AuditEntryInput {
  userId: number | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  detail?: unknown;
}

export interface AuditWriter {
  write(entry: AuditEntryInput): Promise<void>;
}

export interface SystemLogger {
  error(message: string, meta?: unknown): void;
}

export const consoleSystemLogger: SystemLogger = {
  // eslint-disable-next-line no-console
  error: (message, meta) => console.error(message, meta)
};

/**
 * Writes an audit entry with retries. If every attempt fails, the failure is reported to the
 * system logger (never swallowed silently - ECP-025 AC3) so an Admin can discover it later.
 * Login is the one caller expected to `await` this (so a totally silent audit outage doesn't
 * mask a login event); other callers (auditableRoute) may fire-and-forget after responding.
 */
export async function writeAuditLog(
  writer: AuditWriter,
  entry: AuditEntryInput,
  options: { retries?: number; logger?: SystemLogger } = {}
): Promise<boolean> {
  const retries = options.retries ?? 2;
  const logger = options.logger ?? consoleSystemLogger;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await writer.write(entry);
      return true;
    } catch (err) {
      lastError = err;
    }
  }

  logger.error("[audit] failed to write audit log after retries - investigate immediately", {
    entry,
    error: lastError
  });
  return false;
}
