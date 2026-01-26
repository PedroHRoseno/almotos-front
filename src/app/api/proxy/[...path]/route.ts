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

export async function OPTIONS() {
  // Resposta para preflight CORS requests
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    if (!apiBase) {
      console.error("[Proxy] NEXT_PUBLIC_API_URL não está configurado");
      return NextResponse.json(
        { error: "Backend URL não configurada" },
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
        { error: "URL do backend inválida" },
        { status: 500 }
      );
    }
    
    // Copiar os query parameters da requisição original
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Preparar headers para a requisição ao backend
    const headers = new Headers();
    
    // Copiar headers relevantes (exceto host e outros que podem causar problemas)
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Ignorar headers que não devem ser encaminhados
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length" &&
        lowerKey !== "transfer-encoding"
      ) {
        headers.set(key, value);
      }
    });
    
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
      } else if (contentType) {
        // Outros tipos de conteúdo
        body = await request.text();
        headers.set("content-type", contentType);
      }
    }
    
    // Fazer a requisição ao backend
    const response = await fetch(url.toString(), {
      method: request.method,
      headers: headers,
      body: body,
    });
    
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
    
    // Se for erro de DNS ou conexão, fornecer mensagem mais útil
    if (errorMessage.includes("DNS") || errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { 
          error: "Erro ao conectar com o backend",
          message: "Não foi possível resolver o hostname do backend. Verifique se NEXT_PUBLIC_API_URL está configurado corretamente com uma URL pública.",
          details: errorMessage
        },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao conectar com o backend",
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
