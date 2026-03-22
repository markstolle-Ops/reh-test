import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CSP to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow SignWell iframe for embedded signing
              "frame-src https://www.signwell.com",
              // Allow SignWell embed script
              "script-src 'self' 'unsafe-inline' https://cdn.signwell.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://www.signwell.com https://api.clerk.dev https://*.clerk.accounts.dev",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
