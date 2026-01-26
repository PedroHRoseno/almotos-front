import type { NextConfig } from "next";

// NOTA: Removemos os rewrites porque eles causam problemas na Vercel
// com hostnames privados da Railway (erro DNS_HOSTNAME_RESOLVED_PRIVATE).
// Agora usamos API Routes em src/app/api/proxy/[...path]/route.ts
// que fazem o proxy corretamente no servidor.

// Validação em produção
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "⚠️  AVISO: NEXT_PUBLIC_API_URL não está configurado. Configure esta variável de ambiente na Vercel."
  );
}

const nextConfig: NextConfig = {
  // Rewrites removidos - usando API Routes ao invés
};

export default nextConfig;
