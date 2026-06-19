interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({
  src,
  alt,
  className = "object-cover transition duration-500 group-hover:scale-105",
}: ProductImageProps) {
  return (
    // Native img avoids next/image `fill` SSR/client inline-style drift (e.g. left: "0px" vs 0).
    // suppressHydrationWarning: browser extensions (e.g. Dark Reader) may inject color attrs before hydrate.
    // eslint-disable-next-line @next/next/no-img-element -- consistent markup for all product image hosts
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      loading="lazy"
      decoding="async"
      suppressHydrationWarning
    />
  );
}
