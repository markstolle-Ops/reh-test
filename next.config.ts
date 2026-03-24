import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const clerkDomain =
  process.env.NEXT_PUBLIC_CLERK_DOMAIN || "https://*.clerk.accounts.dev";

const cspHeader = isDev
  ? // Relaxed CSP for local development — Clerk needs broad access
    ""
  : // Strict CSP for production
    [
      "default-src 'self'",
      // Allow SignWell iframe, Clerk, and Cloudflare Turnstile (CAPTCHA)
      `frame-src https://www.signwell.com https://challenges.cloudflare.com ${clerkDomain}`,
      // Allow SignWell, Clerk, and Turnstile scripts
      `script-src 'self' 'unsafe-inline' https://cdn.signwell.com https://challenges.cloudflare.com ${clerkDomain}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' https://www.signwell.com https://api.clerk.dev https://challenges.cloudflare.com ${clerkDomain}`,
      "font-src 'self' https:",
      `worker-src 'self' blob: ${clerkDomain}`,
    ].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    if (!cspHeader) return [];
    return [
      {
        // Apply CSP to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
