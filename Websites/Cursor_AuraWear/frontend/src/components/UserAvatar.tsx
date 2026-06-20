import type { User } from "../types/user";

export function userInitials(user: Pick<User, "username" | "first_name" | "last_name">): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.first_name) return user.first_name.slice(0, 2).toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
}

interface UserAvatarProps {
  user: Pick<User, "username" | "first_name" | "last_name" | "avatar_url">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-20 w-20 text-xl",
  lg: "h-28 w-28 text-3xl",
};

export default function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={`${user.username} profile`}
        className={`rounded-full object-cover ring-2 ring-aura-200 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-aura-200 font-semibold text-aura-800 ring-2 ring-aura-200 ${sizeClass} ${className}`}
      aria-label={`${user.username} profile`}
    >
      {userInitials(user)}
    </div>
  );
}
