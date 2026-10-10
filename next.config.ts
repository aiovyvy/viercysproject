import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: {
    "/*": [
      "./data/**",
      "./.env*",
      "./.git/**",
      "./test-results/**",
      "./playwright-report/**",
      "./design-references/**",
      "./debug.log",
    ],
  },
  outputFileTracingIncludes: {
    "/*": ["./database/sqlite.sql", "./src/assets/fonts/*"],
  },
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};
export default nextConfig;
