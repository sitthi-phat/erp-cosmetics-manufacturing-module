/* eslint-disable @typescript-eslint/no-var-requires -- module must be re-required after
   jest.resetModules() in each test to observe a fresh env-driven config value. */
describe("config PERMISSION_CACHE_TTL clamp (ADR-005 rev.2)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("defaults to 60s when not set", () => {
    delete process.env.PERMISSION_CACHE_TTL;
    const { config } = require("./index");
    expect(config.permissionCacheTtlSeconds).toBe(60);
  });

  it("clamps values above 300s down to 300s", () => {
    process.env.PERMISSION_CACHE_TTL = "9999";
    const { config } = require("./index");
    expect(config.permissionCacheTtlSeconds).toBe(300);
  });

  it("keeps values within the allowed range unchanged", () => {
    process.env.PERMISSION_CACHE_TTL = "120";
    const { config } = require("./index");
    expect(config.permissionCacheTtlSeconds).toBe(120);
  });

  it("floors invalid/too-low values to at least 1s", () => {
    process.env.PERMISSION_CACHE_TTL = "0";
    const { config } = require("./index");
    expect(config.permissionCacheTtlSeconds).toBe(1);
  });
});
