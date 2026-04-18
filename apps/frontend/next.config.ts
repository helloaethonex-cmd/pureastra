import type { NextConfig } from "next";

const imageRemotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  { protocol: "https", hostname: "cdn.pureastra.com" },
  { protocol: "https", hostname: "*.r2.dev" },
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
];

try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL)
    : null;

  if (backendUrl) {
    imageRemotePatterns.push({
      protocol: backendUrl.protocol.replace(":", "") as "http" | "https",
      hostname: backendUrl.hostname,
      port: backendUrl.port || undefined,
    });
  }
} catch {
  // Ignore malformed local env values; Next will still validate image sources.
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    optimizePackageImports: [
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-regular-svg-icons",
      "@fortawesome/free-brands-svg-icons",
      "@fortawesome/react-fontawesome",
    ],
  },
};

export default nextConfig;
