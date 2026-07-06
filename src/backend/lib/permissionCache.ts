/**
 * permissionCache (ADR-005 rev.2 / E2-E3).
 *
 * JWT only carries `user_id` (no role/permission snapshot). Every request resolves the
 * user's CURRENT role + permissions from the DB, through an in-memory cache keyed by user_id
 * with TTL = PERMISSION_CACHE_TTL (default 60s, clamped <= 300s by config/index.ts). This is
 * what makes role/permission changes take effect within <= 5 minutes without forcing re-login:
 * DB is always the source of truth, the cache is purely a read optimization with bounded staleness.
 */

export interface ResolvedPermission {
  resource: string;
  action: string;
  allow: boolean;
}

export interface ResolvedUserPermissions {
  userId: number;
  roleId: number;
  roleName: string;
  permissions: ResolvedPermission[];
}

export type PermissionLoader = (userId: number) => Promise<ResolvedUserPermissions>;

interface CacheEntry {
  data: ResolvedUserPermissions;
  expiresAt: number;
}

export class PermissionCache {
  private store = new Map<number, CacheEntry>();

  constructor(
    private readonly loader: PermissionLoader,
    private readonly ttlMs: number,
    private readonly clock: () => number = Date.now
  ) {}

  /** Resolve permissions for a user - serves from cache while fresh, otherwise reloads from DB. */
  async resolve(userId: number): Promise<ResolvedUserPermissions> {
    const now = this.clock();
    const cached = this.store.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
    const data = await this.loader(userId);
    this.store.set(userId, { data, expiresAt: now + this.ttlMs });
    return data;
  }

  /** Proactive invalidation (optional fast-path) - e.g. right after Admin changes a user's role. */
  invalidate(userId: number): void {
    this.store.delete(userId);
  }

  /** Proactive invalidation for every cached user currently holding `roleId` (e.g. role permission edit). */
  invalidateByRole(roleId: number): void {
    for (const [userId, entry] of this.store.entries()) {
      if (entry.data.roleId === roleId) {
        this.store.delete(userId);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  /** Test/inspection helper. */
  size(): number {
    return this.store.size;
  }
}

export function hasPermission(
  resolved: ResolvedUserPermissions,
  resource: string,
  action: string
): boolean {
  return resolved.permissions.some(
    (p) => p.resource === resource && p.action === action && p.allow
  );
}
