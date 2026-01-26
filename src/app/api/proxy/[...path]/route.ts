import { NextRequest, NextResponse } from "next/server";

/**
 * API Route que faz proxy das requisições para o backend
 * Isso resolve o problema de DNS_HOSTNAME_RESOLVED_PRIVATE na Vercel
 * 
 * Uso: /api/proxy/vehicles -> https://backend.railway.app/vehicles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Resposta para preflight CORS requests do navegador para o proxy
  // Como o proxy é mesma origem (localhost:3000), não precisa fazer proxy para o backend
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "3600",
    },
  });
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  try {
    // Obter a URL base do backend da variável de ambiente
    // Tenta NEXT_PUBLIC_API_URL primeiro (disponível em cliente e servidor)
    // Depois tenta API_URL (apenas servidor, mais seguro)
    const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    // Log das variáveis de ambiente (apenas em desenvolvimento ou se houver erro)
    if (process.env.NODE_ENV === "development" || !apiBase || apiBase === "http://localhost:8080") {
      console.log("[Proxy] Variáveis de ambiente:", {
        API_URL: process.env.API_URL ? "configurada" : "não configurada",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ? "configurada" : "não configurada",
        apiBase: apiBase,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
    
    if (!apiBase || apiBase === "http://localhost:8080") {
      const errorMsg = `NEXT_PUBLIC_API_URL ou API_URL não está configurado. Valor atual: ${apiBase}`;
      console.error(`[Proxy] ${errorMsg}`);
      return NextResponse.json(
        { 
          error: "Backend URL não configurada",
          message: "Configure NEXT_PUBLIC_API_URL ou API_URL na Vercel com a URL do backend",
          instructions: [
            "1. Vá em Settings → Environment Variables na Vercel",
            "2. Adicione: NEXT_PUBLIC_API_URL = https://seu-backend.up.railway.app",
            "3. Ou use API_URL (mais seguro, apenas no servidor)",
            "4. Faça um re-deploy após configurar",
          ],
          currentValue: apiBase,
          environment: process.env.NODE_ENV,
        },
        { status: 500 }
      );
    }
    
    // Construir o caminho completo
    const path = params.path && params.path.length > 0 ? params.path.join("/") : "";
    const url = new URL(path || "/", apiBase);
    
    // Validar que a URL é válida
    if (!url.hostname) {
      console.error("[Proxy] URL inválida:", url.toString());
      return NextResponse.json(
        { error: "URL do backend inválida", attemptedUrl: url.toString() },
        { status: 500 }
      );
    }
    
    // Log para debug (apenas em desenvolvimento ou se houver erro)
    console.log(`[Proxy] Fazendo requisição: ${request.method} ${url.toString()}`);
    
    // Copiar os query parameters da requisição original
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Preparar headers para a requisição ao backend
    const headers = new Headers();
    
    // Copiar headers relevantes (exceto host, CORS e outros que podem causar problemas)
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Ignorar headers que não devem ser encaminhados ao backend
      // (requisição server-to-server não precisa de CORS)
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length" &&
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "origin" &&           // Remove Origin (causa problemas de CORS)
        lowerKey !== "referer" &&          // Remove Referer
        lowerKey !== "user-agent" &&        // Remove User-Agent (opcional, mas limpo)
        !lowerKey.startsWith("sec-") &&     // Remove headers de segurança do navegador
        lowerKey !== "access-control-request-method" &&
        lowerKey !== "access-control-request-headers"
      ) {
        headers.set(key, value);
      }
    });
    
    // Adicionar User-Agent para identificar requisições do proxy
    if (!headers.has("user-agent")) {
      headers.set("user-agent", "AlMotos-Frontend-Proxy/1.0");
    }
    
    // Obter o body se existir (apenas para métodos que podem ter body)
    let body: string | undefined;
    const methodsWithBody = ["POST", "PUT", "PATCH"];
    
    if (methodsWithBody.includes(request.method)) {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await request.text();
        // Garantir Content-Type se não estiver definido
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
      } else if (contentType?.includes("multipart/form-data")) {
        // Para multipart, precisamos passar o body como está
        body = await request.text();
        // Manter o Content-Type com boundary se existir
        if (contentType) {
          headers.set("content-type", contentType);
        }
      } else if (contentType) {
        // Outros tipos de conteúdo
        body = await request.text();
        headers.set("content-type", contentType);
      }
    }
    
    // Fazer a requisição ao backend com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
    
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: request.method,
        headers: headers,
        body: body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Log detalhado do erro
      console.error("[Proxy] Erro ao fazer fetch:", {
        url: url.toString(),
        method: request.method,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
      });
      
      // Verificar se é erro de timeout
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { 
            error: "Timeout ao conectar com o backend",
            message: "A requisição demorou mais de 30 segundos. Verifique se o backend está acessível.",
            url: url.toString()
          },
          { status: 504 }
        );
      }
      
      throw fetchError; // Re-throw para ser capturado no catch externo
    }
    
    // Preparar a resposta
    const responseHeaders = new Headers();
    
    // Copiar headers relevantes da resposta
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Copiar headers importantes
      if (
        lowerKey === "content-type" ||
        lowerKey === "content-length" ||
        lowerKey === "cache-control" ||
        lowerKey === "etag"
      ) {
        responseHeaders.set(key, value);
      }
    });
    
    // Adicionar CORS headers se necessário
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Obter o body da resposta
    const responseBody = await response.text();
    
    // Retornar a resposta
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Proxy] Erro ao fazer proxy:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log completo do erro
    console.error("[Proxy] Detalhes do erro:", {
      message: errorMessage,
      stack: errorStack,
      apiBase: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL,
    });
    
    // Se for erro de DNS ou conexão, fornecer mensagem mais útil
    if (
      errorMessage.includes("DNS") || 
      errorMessage.includes("ENOTFOUND") || 
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("Failed to fetch")
    ) {
      return NextResponse.json(
        { 
          error: "Erro ao conectar com o backend",
          message: "Não foi possível conectar ao backend. Verifique:",
          details: [
            "1. NEXT_PUBLIC_API_URL está configurado na Vercel?",
            "2. A URL do backend está correta e acessível?",
            "3. O backend está rodando no Railway?",
            `4. URL configurada: ${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "não configurada"}`,
          ],
          errorMessage: errorMessage
        },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao conectar com o backend",
        message: errorMessage,
        details: errorStack
      },
      { status: 500 }
    );
  }
}
