import type { NextConfig } from "next";

const clerkDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN || "https://*.clerk.accounts.dev";

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
              `connect-src 'self' https://www.signwell.com https://api.clerk.dev ${clerkDomain}`,
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
