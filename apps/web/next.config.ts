import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@merchandise/contracts", "@merchandise/db"],
};

export default nextConfig;
