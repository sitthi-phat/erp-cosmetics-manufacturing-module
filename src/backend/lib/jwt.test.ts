import { signUserToken, verifyUserToken } from "./jwt";

describe("JWT identity payload (ADR-005 rev.2)", () => {
  it("round-trips user_id only", () => {
    const token = signUserToken(7);
    const decoded = verifyUserToken(token);
    expect(decoded).toEqual({ user_id: 7 });
  });

  it("does not embed role_id or permissions in the payload", () => {
    const token = signUserToken(7);
    const [, payloadB64] = token.split(".");
    const payloadJson = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    expect(payloadJson).toHaveProperty("user_id", 7);
    expect(payloadJson).not.toHaveProperty("role_id");
    expect(payloadJson).not.toHaveProperty("permissions");
    expect(payloadJson).not.toHaveProperty("role");
  });

  it("rejects a tampered token", () => {
    const token = signUserToken(7);
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyUserToken(tampered)).toThrow();
  });
});
