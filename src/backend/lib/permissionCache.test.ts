import { PermissionCache, ResolvedUserPermissions, hasPermission } from "./permissionCache";

function makeResolved(roleId: number, roleName: string): ResolvedUserPermissions {
  return {
    userId: 1,
    roleId,
    roleName,
    permissions: [{ resource: "po", action: "view", allow: true }]
  };
}

describe("PermissionCache TTL semantics (ADR-005 rev.2)", () => {
  it("serves from cache within TTL without calling the loader again", async () => {
    let clockValue = 0;
    const clock = () => clockValue;
    const loader = jest.fn().mockResolvedValue(makeResolved(2, "PR"));
    const cache = new PermissionCache(loader, 60_000, clock);

    await cache.resolve(1);
    clockValue += 30_000; // 30s later, still within 60s TTL
    await cache.resolve(1);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("reloads from DB once the TTL has elapsed (source of truth = DB)", async () => {
    let clockValue = 0;
    const clock = () => clockValue;
    const loader = jest
      .fn()
      .mockResolvedValueOnce(makeResolved(2, "PR"))
      .mockResolvedValueOnce(makeResolved(4, "QA"));
    const cache = new PermissionCache(loader, 60_000, clock);

    const first = await cache.resolve(1);
    expect(first.roleName).toBe("PR");

    clockValue += 60_001; // TTL just elapsed
    const second = await cache.resolve(1);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(second.roleName).toBe("QA");
  });

  it("guarantees a role change takes effect within <= PERMISSION_CACHE_TTL even without invalidate()", async () => {
    let clockValue = 0;
    const clock = () => clockValue;
    const ttlMs = 5 * 60 * 1000; // 300s clamp ceiling
    const loader = jest
      .fn()
      .mockResolvedValueOnce(makeResolved(2, "PR"))
      .mockResolvedValueOnce(makeResolved(7, "AD"));
    const cache = new PermissionCache(loader, ttlMs, clock);

    await cache.resolve(42); // PR, cached at t=0

    // Admin changes the role in the DB "out of band" at t=10s - no invalidate() called.
    clockValue += ttlMs; // exactly the TTL boundary has passed
    const resolved = await cache.resolve(42);

    expect(resolved.roleName).toBe("AD");
  });

  it("invalidate(userId) forces an immediate reload (fast-path)", async () => {
    const clockValue = 0;
    const clock = () => clockValue;
    const loader = jest
      .fn()
      .mockResolvedValueOnce(makeResolved(2, "PR"))
      .mockResolvedValueOnce(makeResolved(7, "AD"));
    const cache = new PermissionCache(loader, 60_000, clock);

    await cache.resolve(1);
    cache.invalidate(1);
    const resolved = await cache.resolve(1);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(resolved.roleName).toBe("AD");
  });

  it("invalidateByRole() evicts every cached user currently on that role", async () => {
    const clock = () => 0;
    const loader = jest.fn().mockImplementation((userId: number) =>
      Promise.resolve(makeResolved(userId === 1 ? 2 : 3, userId === 1 ? "PR" : "WH"))
    );
    const cache = new PermissionCache(loader, 60_000, clock);

    await cache.resolve(1); // roleId 2
    await cache.resolve(2); // roleId 3
    cache.invalidateByRole(2);

    expect(cache.size()).toBe(1);
  });

  it("hasPermission() checks resource+action+allow tuple", () => {
    const resolved = makeResolved(2, "PR");
    expect(hasPermission(resolved, "po", "view")).toBe(true);
    expect(hasPermission(resolved, "po", "create")).toBe(false);
  });
});
