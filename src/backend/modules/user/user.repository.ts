import { prisma } from "../../lib/prisma";
import { AuthLookupUser, AuthUserLookup } from "./auth.service";
import { UserRecord, UserRepository } from "./user.service";
import { UpdateUserInput } from "./user.schema";

function toRecord(row: {
  id: number;
  userId: string;
  username: string;
  fullName: string;
  roleId: number;
  status: "Active" | "Inactive";
}): UserRecord {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    fullName: row.fullName,
    roleId: row.roleId,
    status: row.status
  };
}

export class PrismaUserRepository implements UserRepository, AuthUserLookup {
  async findByUsername(username: string): Promise<AuthLookupUser | null> {
    const row = await prisma.user.findUnique({ where: { username } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      username: row.username,
      passwordHash: row.passwordHash,
      status: row.status
    };
  }

  async touchLastLogin(userId: number): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async createUser(data: {
    userId: string;
    username: string;
    fullName: string;
    passwordHash: string;
    roleId: number;
    status: "Active" | "Inactive";
  }): Promise<UserRecord> {
    const row = await prisma.user.create({ data });
    return toRecord(row);
  }

  async updateUser(id: number, data: UpdateUserInput): Promise<UserRecord> {
    const row = await prisma.user.update({ where: { id }, data });
    return toRecord(row);
  }
}
