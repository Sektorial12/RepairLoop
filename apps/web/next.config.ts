import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const apiOrigin =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://repairloop-api.onrender.com";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  "https://*.paypal.com",
  "https://*.paypalobjects.com"
].join(" ");

const connectSrc = [
  "'self'",
  apiOrigin,
  "https://*.paypal.com",
  "https://*.paypalobjects.com",
  ...(isDev ? ["ws:", "wss:", "http://127.0.0.1:3002", "http://localhost:3002"] : [])
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.paypalobjects.com",
  "font-src 'self' data: https://*.paypalobjects.com",
  `connect-src ${connectSrc}`,
  "frame-src https://*.paypal.com https://*.paypalobjects.com",
  "form-action 'self' https://*.paypal.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"])
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()"
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
