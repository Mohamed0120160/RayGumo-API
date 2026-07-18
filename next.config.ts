import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run separately via `npm run lint`
    ignoreDuringBuilds: false,
  },
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
