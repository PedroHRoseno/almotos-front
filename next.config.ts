import type { NextConfig } from "next";

// Para desenvolvimento local com backend Kotlin, use: http://localhost:8080
// Para produção antiga, use: https://tcc-voting-pedro.fun/api
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
