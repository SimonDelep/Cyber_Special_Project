import Image from "next/image";

type UserAvatarProps = {
  src: string | null | undefined;
  alt: string;
  size?: number;
};

export function UserAvatar({ src, alt, size = 40 }: UserAvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-brand-600/30 text-sm font-semibold text-brand-200"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {alt.charAt(0).toUpperCase()}
    </span>
  );
}
