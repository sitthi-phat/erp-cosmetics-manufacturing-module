import { createUserSchema } from "./user.schema";

describe("createUserSchema (ECP-023 AC4: no client-supplied user_id ever survives)", () => {
  it("strips an attacker-supplied user_id field entirely", () => {
    const parsed = createUserSchema.parse({
      username: "somchai",
      fullName: "Somchai Prod",
      password: "secret123",
      roleId: 3,
      user_id: "USR-99999999"
    } as any);
    expect(parsed).not.toHaveProperty("user_id");
    expect(Object.keys(parsed).sort()).toEqual(
      ["fullName", "password", "roleId", "status", "username"].sort()
    );
  });

  it("rejects when required fields are missing", () => {
    expect(() => createUserSchema.parse({ username: "somchai" } as any)).toThrow();
  });
});
