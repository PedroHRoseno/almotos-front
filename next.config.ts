import type { NextConfig } from "next";

/**
 * Proxy de API: o destino é definido por NEXT_PUBLIC_API_URL.
 * - Local: NEXT_PUBLIC_API_URL=http://localhost:8080 (backend na máquina)
 * - Vercel/Produção: NEXT_PUBLIC_API_URL=https://seu-app.railway.app (backend no Railway)
 * As requisições do cliente vão para /api/proxy/[...path], que encaminha para essa URL.
 */
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "⚠️ NEXT_PUBLIC_API_URL não definido. Defina na Vercel para o proxy apontar ao backend (Railway)."
  );
}

const nextConfig: NextConfig = {};

export default nextConfig;
