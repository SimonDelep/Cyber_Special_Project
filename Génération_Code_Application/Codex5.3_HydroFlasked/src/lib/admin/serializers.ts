import type { Product, User } from "../../../generated/prisma/client";

export type AdminUser = Omit<User, "passwordHash">;

export function toAdminUser(user: User): AdminUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function toAdminUsers(users: User[]): AdminUser[] {
  return users.map(toAdminUser);
}
