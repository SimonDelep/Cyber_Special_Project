function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
} as const;

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided avatar hosts
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className={`rounded-full object-cover ring-2 ring-zinc-700 ${sizeClass} ${className}`}
        suppressHydrationWarning
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-violet-700 font-semibold text-white ring-2 ring-zinc-700 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initialsFromName(name)}
    </span>
  );
}
