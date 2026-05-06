import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API Route para encaminhar requisições do frontend para o backend
 * Resolve problemas de CORS e DNS_HOSTNAME_RESOLVED_PRIVATE na Vercel
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

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error("[Proxy] NEXT_PUBLIC_API_URL não está configurado");
      return NextResponse.json(
        { error: "Backend URL não configurado. Defina NEXT_PUBLIC_API_URL (local: http://localhost:8080, prod: URL do Railway)." },
        { status: 500 }
      );
    }

    // Construir o caminho completo
    const path = params.path && params.path.length > 0 ? params.path.join("/") : "";
    
    // Garantir que apiBase tenha protocolo
    let backendUrl = apiBase;
    if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
      backendUrl = `http://${backendUrl}`;
    }
    
    // Remover barra final se existir
    backendUrl = backendUrl.replace(/\/$/, "");
    
    const url = new URL(path || "/", backendUrl);

    // Copiar query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Preparar headers (remover headers CORS e de origem)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Filtrar headers que não devem ser encaminhados
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "origin" &&
        lowerKey !== "referer" &&
        !lowerKey.startsWith("sec-") &&
        !lowerKey.startsWith("x-forwarded-") &&
        !lowerKey.startsWith("x-vercel-")
      ) {
        headers[key] = value;
      }
    });

    // Adicionar User-Agent customizado para identificar requisições do proxy
    headers["User-Agent"] = "AlMotos-Frontend-Proxy/1.0";

    // Preparar body se existir
    let body: string | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        body = await request.text();
      } catch (e) {
        // Se não houver body, continua sem ele
      }
    }

    // Fazer requisição para o backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const response = await fetch(url.toString(), {
        method: request.method,
        headers,
        body: body || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Para 204/304, não pode haver body
      const isNoBodyStatus = response.status === 204 || response.status === 304;
      const responseText = isNoBodyStatus ? "" : await response.text();

      const nextResponse = isNoBodyStatus
        ? new NextResponse(null, { status: response.status, statusText: response.statusText })
        : new NextResponse(responseText, { status: response.status, statusText: response.statusText });

      // Copiar headers relevantes (exceto CORS)
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey !== "access-control-allow-origin" &&
          lowerKey !== "access-control-allow-methods" &&
          lowerKey !== "access-control-allow-headers" &&
          lowerKey !== "access-control-allow-credentials"
        ) {
          nextResponse.headers.set(key, value);
        }
      });

      return nextResponse;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Timeout ao conectar com o backend", message: "A requisição demorou mais de 30 segundos" },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: "Erro ao conectar com o backend", message: fetchError.message || "fetch failed" },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Proxy] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do proxy", message: error.message },
      { status: 500 }
    );
  }
}
