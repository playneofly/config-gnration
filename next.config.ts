import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // برای OpenNext/Cloudflare: pg و وابسته‌هایش به‌صورت کامل کپی می‌شوند
  // تا require("pg-cloudflare") داخل pg هنگام باندل worker قابل resolve باشد.
  serverExternalPackages: ["pg", "pg-cloudflare", "pg-pool", "pg-protocol", "pgpass"],
};

export default nextConfig;
