import type { User } from "@/db/schema";
import type { AdminUserView } from "@/lib/auth/types";

export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    balanceCents: user.balanceCents,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
