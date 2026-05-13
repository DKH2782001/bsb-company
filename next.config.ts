import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.97", "127.0.0.1"],
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "reactflow"],
  },
};

export default nextConfig;
