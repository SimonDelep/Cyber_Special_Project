import Image from "next/image";

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "lg";
};

export function UserAvatar({ name, imageUrl, size = "lg" }: UserAvatarProps) {
  const dimensions = size === "lg" ? 96 : 40;
  const className =
    size === "lg"
      ? "h-24 w-24 rounded-full object-cover ring-2 ring-sage-200"
      : "h-10 w-10 rounded-full object-cover ring-2 ring-sage-200";

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`${name} profile`}
        width={dimensions}
        height={dimensions}
        className={className}
        unoptimized={imageUrl.startsWith("/uploads/")}
      />
    );
  }

  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-sage-200 font-display font-semibold text-sage-800 ${size === "lg" ? "h-24 w-24 text-3xl" : "h-10 w-10 text-sm"}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
