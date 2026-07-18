import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note: the `eslint` config option was removed in Next.js 16 (`next build`
  // no longer runs linting at all). Linting is run separately via
  // `npm run lint`, which is unaffected by this.
  async headers() {
    return [
      {
        // Apply permissive CORS to all API routes so WhatsApp bots / external
        // services hosted elsewhere can call this API directly. All current
        // endpoints are read-only (GET), so only GET/OPTIONS are allowed.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
