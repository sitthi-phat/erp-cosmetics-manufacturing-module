import { createUser, updateUser, UserRecord, UserRepository, RoleChangeInvalidator } from "./user.service";

class FakeUserRepo implements UserRepository {
  users: UserRecord[] = [];
  async findByUsername(username: string) {
    const u = this.users.find((x) => x.username === username);
    return u ? { id: u.id } : null;
  }
  async createUser(data: any): Promise<UserRecord> {
    const record: UserRecord = {
      id: this.users.length + 1,
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      roleId: data.roleId,
      status: data.status
    };
    this.users.push(record);
    return record;
  }
  async updateUser(id: number, data: any): Promise<UserRecord> {
    const u = this.users.find((x) => x.id === id)!;
    Object.assign(u, data);
    return u;
  }
}

describe("user.service.createUser (ECP-023)", () => {
  it("auto-generates user_id via the sequence generator (AC1)", async () => {
    const repo = new FakeUserRepo();
    const generateUserId = jest.fn().mockResolvedValue("USR-00000001");
    const user = await createUser(repo, generateUserId, {
      username: "somchai",
      fullName: "Somchai",
      password: "secret123",
      roleId: 3,
      status: "Active"
    });
    expect(generateUserId).toHaveBeenCalledTimes(1);
    expect(user.userId).toBe("USR-00000001");
  });

  it("rejects a duplicate username (AC3)", async () => {
    const repo = new FakeUserRepo();
    const generateUserId = jest.fn().mockResolvedValue("USR-00000001");
    await createUser(repo, generateUserId, {
      username: "somchai",
      fullName: "Somchai",
      password: "secret123",
      roleId: 3,
      status: "Active"
    });
    await expect(
      createUser(repo, generateUserId, {
        username: "somchai",
        fullName: "Somchai 2",
        password: "secret123",
        roleId: 3,
        status: "Active"
      })
    ).rejects.toThrow("username นี้มีผู้ใช้งานอยู่แล้วในระบบ");
  });

  it("never persists any client-supplied id (AC4) - generator is the only id source", async () => {
    const repo = new FakeUserRepo();
    const generateUserId = jest.fn().mockResolvedValue("USR-00000042");
    const user = await createUser(repo, generateUserId, {
      username: "somying",
      fullName: "Somying",
      password: "secret123",
      roleId: 4,
      status: "Active"
      // Note: CreateUserInput type has no user_id field at all - this is enforced at the
      // Zod schema layer (user.schema.test.ts) before this function is ever called.
    });
    expect(user.userId).toBe("USR-00000042");
  });
});

describe("user.service.updateUser (ECP-023 AC2)", () => {
  it("invalidates the permission cache when the role changes", async () => {
    const repo = new FakeUserRepo();
    const generateUserId = jest.fn().mockResolvedValue("USR-00000001");
    const user = await createUser(repo, generateUserId, {
      username: "somchai",
      fullName: "Somchai",
      password: "secret123",
      roleId: 3,
      status: "Active"
    });
    const invalidator: RoleChangeInvalidator = { invalidate: jest.fn() };

    await updateUser(repo, invalidator, user.id, { roleId: 7 });

    expect(invalidator.invalidate).toHaveBeenCalledWith(user.id);
  });

  it("does not invalidate the cache for changes unrelated to role", async () => {
    const repo = new FakeUserRepo();
    const generateUserId = jest.fn().mockResolvedValue("USR-00000001");
    const user = await createUser(repo, generateUserId, {
      username: "somchai",
      fullName: "Somchai",
      password: "secret123",
      roleId: 3,
      status: "Active"
    });
    const invalidator: RoleChangeInvalidator = { invalidate: jest.fn() };

    await updateUser(repo, invalidator, user.id, { fullName: "Somchai Updated" });

    expect(invalidator.invalidate).not.toHaveBeenCalled();
  });
});
