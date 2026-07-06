import { AppError } from "../../lib/errors";
import { hashPassword } from "./auth.service";
import { CreateUserInput, UpdateUserInput } from "./user.schema";

export interface UserRecord {
  id: number;
  userId: string;
  username: string;
  fullName: string;
  roleId: number;
  status: "Active" | "Inactive";
}

export interface UserRepository {
  findByUsername(username: string): Promise<{ id: number } | null>;
  createUser(data: {
    userId: string;
    username: string;
    fullName: string;
    passwordHash: string;
    roleId: number;
    status: "Active" | "Inactive";
  }): Promise<UserRecord>;
  updateUser(id: number, data: UpdateUserInput): Promise<UserRecord>;
}

export type UserIdGenerator = () => Promise<string>;

/** ECP-023 AC1/AC3/AC4: auto-gen user_id, reject duplicate username, ignore any client id. */
export async function createUser(
  repo: UserRepository,
  generateUserId: UserIdGenerator,
  input: CreateUserInput
): Promise<UserRecord> {
  const existing = await repo.findByUsername(input.username);
  if (existing) {
    throw AppError.validation("username นี้มีผู้ใช้งานอยู่แล้วในระบบ", { username: "duplicate" });
  }
  const userId = await generateUserId();
  const passwordHash = await hashPassword(input.password);
  return repo.createUser({
    userId,
    username: input.username,
    fullName: input.fullName,
    passwordHash,
    roleId: input.roleId,
    status: input.status
  });
}

export interface RoleChangeInvalidator {
  invalidate(userId: number): void;
}

/** ECP-023 AC2: after changing a user's role, proactively invalidate the permission cache. */
export async function updateUser(
  repo: UserRepository,
  invalidator: RoleChangeInvalidator,
  userId: number,
  input: UpdateUserInput
): Promise<UserRecord> {
  const updated = await repo.updateUser(userId, input);
  if (input.roleId !== undefined) {
    invalidator.invalidate(userId);
  }
  return updated;
}
