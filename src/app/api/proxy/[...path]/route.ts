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

/**
 * Base pública da API Spring (sem path de contexto: rotas são /vehicles, /api/auth/login, etc.).
 * Remove barra final e sufixo /api (/api/) — configurações comuns que geram 404 no backend.
 */
function normalizeBackendBase(raw: string): string {
  let base = raw.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  base = base.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -"/api".length);
  }
  return base.replace(/\/+$/, "");
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      process.env.BACKEND_URL?.trim();
    if (!apiBase) {
      console.error(
        "[Proxy] Defina NEXT_PUBLIC_API_URL ou BACKEND_URL (ex.: https://xxx.up.railway.app)"
      );
      return NextResponse.json(
        {
          error: "Backend URL não configurado.",
          hint: "Na Vercel: NEXT_PUBLIC_API_URL=https://<seu-servico>.up.railway.app (somente domínio, sem /api/ no final).",
        },
        { status: 500 }
      );
    }

    // Construir o caminho completo
    const path = params.path && params.path.length > 0 ? params.path.join("/") : "";

    let backendUrl = normalizeBackendBase(apiBase);

    const url = new URL(path || "/", backendUrl);

    // Copiar query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Headers que NUNCA encaminhamos para o backend (evita duplicidade, loops e header inválido).
    const BANNED_HEADERS = new Set([
      "host",
      "origin",
      "referer",
      "connection",
      "content-length",
      "transfer-encoding",
      "accept-encoding",
    ]);

    // Usamos Headers (case-insensitive) ao invés de objeto plano para evitar
    // "Authorization" + "authorization" virarem duas entradas e o backend ler
    // "Bearer x, Bearer x" (header malformado → 401).
    const outHeaders = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (BANNED_HEADERS.has(lower)) return;
      if (lower.startsWith("sec-")) return;
      if (lower.startsWith("x-forwarded-")) return;
      if (lower.startsWith("x-vercel-")) return;
      outHeaders.set(key, value);
    });

    // Encaminhar Authorization de forma explícita e única.
    const authorization = request.headers.get("authorization");
    if (authorization) {
      outHeaders.set("Authorization", authorization);
    } else {
      outHeaders.delete("Authorization");
    }

    outHeaders.set("User-Agent", "AlMotos-Frontend-Proxy/1.0");

    // Diagnóstico (aparece nos Function Logs da Vercel). Não imprime o token completo.
    const authPreview = authorization
      ? `${authorization.slice(0, 18)}…(${authorization.length} chars)`
      : "<ausente>";
    console.log(
      `[Proxy] ${request.method} ${url.pathname} | Authorization=${authPreview}`
    );

    // Preparar body se existir (precisa suportar multipart/binary)
    let body: ArrayBuffer | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        body = await request.arrayBuffer();
      } catch (e) {
        // Se não houver body, continua sem ele
      }
    }

    // Fazer requisição para o backend
    const controller = new AbortController();
    // Upload pode demorar (cold start do Railway + transferência). 120s é mais seguro.
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos

    try {
      const targetUrl = url.toString();
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: outHeaders,
        body: body ? new Uint8Array(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        console.warn(
          `[Proxy] Backend retornou 404. Confira NEXT_PUBLIC_API_URL (deve ser a raiz Railway, não .../api/). Destino:`,
          targetUrl
        );
      }

      if (response.status === 401 || response.status === 403) {
        console.warn(
          `[Proxy] Backend retornou ${response.status} para ${url.pathname} | Authorization enviado=${!!authorization}`
        );
      }

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
