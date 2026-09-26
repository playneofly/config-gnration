import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg uses the Cloudflare-specific socket implementation at runtime.
  serverExternalPackages: ["pg-cloudflare"],
};

export default nextConfig;
