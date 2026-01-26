import { NextResponse } from "next/server";

/**
 * Endpoint de diagnóstico para verificar a configuração do proxy
 * Acesse: /api/proxy/health
 */
export async function GET() {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  
  const info = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiUrl: {
      configured: !!apiUrl,
      value: apiUrl || "não configurado",
      // Não expor a URL completa por segurança, apenas indicar se está configurada
      isPublic: !!process.env.NEXT_PUBLIC_API_URL,
      isPrivate: !!process.env.API_URL,
    },
    instructions: apiUrl 
      ? "Configuração parece estar correta. Se ainda houver erros, verifique se a URL do backend está acessível."
      : [
          "NEXT_PUBLIC_API_URL ou API_URL não está configurado.",
          "Configure na Vercel: Settings → Environment Variables",
          "Adicione: NEXT_PUBLIC_API_URL = https://seu-backend.up.railway.app",
          "Faça um re-deploy após configurar.",
        ],
  };

  return NextResponse.json(info, {
    status: apiUrl ? 200 : 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
