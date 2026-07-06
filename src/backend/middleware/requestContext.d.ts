import type { ResolvedUserPermissions } from "../lib/permissionCache";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: number;
      permissions?: ResolvedUserPermissions;
    }
  }
}

export {};
