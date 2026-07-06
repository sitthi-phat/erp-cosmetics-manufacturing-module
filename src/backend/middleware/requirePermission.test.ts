import { requirePermission } from "./requirePermission";
import { AppError } from "../lib/errors";
import type { Request, Response } from "express";

function fakeReq(permissions?: any): Request {
  return { permissions } as unknown as Request;
}

describe("requirePermission middleware", () => {
  it("calls next() with no error when the tuple is allowed", () => {
    const req = fakeReq({
      permissions: [{ resource: "po", action: "view", allow: true }]
    });
    const next = jest.fn();
    requirePermission("po", "view")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next(403 AppError) when permission is missing (URL called directly)", () => {
    const req = fakeReq({ permissions: [{ resource: "po", action: "view", allow: true }] });
    const next = jest.fn();
    requirePermission("invoice", "revise")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.status).toBe(403);
  });

  it("calls next(401) when permissions were never resolved", () => {
    const req = fakeReq(undefined);
    const next = jest.fn();
    requirePermission("po", "view")(req, {} as Response, next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.status).toBe(401);
  });

  it("denies when the tuple exists but allow=false", () => {
    const req = fakeReq({ permissions: [{ resource: "po", action: "view", allow: false }] });
    const next = jest.fn();
    requirePermission("po", "view")(req, {} as Response, next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.status).toBe(403);
  });
});
