import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.50.91", "192.168.100.97", "127.0.0.1"],
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "reactflow"],
  },
  async rewrites() {
    return [
      { source: "/sb-proxy/:path*", destination: "http://127.0.0.1:54321/:path*" },
    ];
  },
};

export default nextConfig;
