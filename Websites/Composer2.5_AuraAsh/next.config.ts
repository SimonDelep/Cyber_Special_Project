import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
