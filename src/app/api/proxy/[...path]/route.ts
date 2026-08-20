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

function sanitizeEnvUrl(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

/**
 * Origem absoluta do SoR (sem path). Remove barra final e sufixo /api —
 * configurações comuns que geram 404 ou `Invalid URL` no `new URL`.
 * BACKEND_URL (runtime) tem prioridade sobre NEXT_PUBLIC_API_URL (inlined no build).
 */
function resolveBackendOrigin():
  | { ok: true; origin: string }
  | { ok: false; reason: string; rawLength: number } {
  const raw =
    sanitizeEnvUrl(process.env.BACKEND_URL) ||
    sanitizeEnvUrl(process.env.API_URL) ||
    sanitizeEnvUrl(process.env.NEXT_PUBLIC_API_URL);

  if (!raw) {
    return { ok: false, reason: "variável ausente", rawLength: 0 };
  }

  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  candidate = candidate.replace(/\/+$/, "");
  if (candidate.toLowerCase().endsWith("/api")) {
    candidate = candidate.slice(0, -"/api".length).replace(/\/+$/, "");
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "protocolo inválido", rawLength: raw.length };
    }
    if (!parsed.hostname) {
      return { ok: false, reason: "hostname vazio", rawLength: raw.length };
    }
    return { ok: true, origin: parsed.origin };
  } catch {
    return { ok: false, reason: "URL absoluta inválida", rawLength: raw.length };
  }
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  try {
    const resolved = resolveBackendOrigin();
    if (!resolved.ok) {
      console.error(
        `[Proxy] Base do SoR inválida (${resolved.reason}, ${resolved.rawLength} chars). Defina BACKEND_URL ou NEXT_PUBLIC_API_URL.`
      );
      return NextResponse.json(
        {
          error: "Backend URL inválida no proxy.",
          hint: "Na Vercel: BACKEND_URL ou NEXT_PUBLIC_API_URL = https://api.almotoscaruaru.com.br (origem absoluta, sem /api no final). Depois, Redeploy.",
          reason: resolved.reason,
        },
        { status: 500 }
      );
    }

    const path =
      params.path && params.path.length > 0 ? params.path.join("/") : "";
    const url = new URL(resolved.origin);
    url.pathname = `/${path}`.replace(/\/{2,}/g, "/");

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
    // Evita resposta gzip do Railway; o fetch do Node descomprime, mas repassar
    // Content-Encoding quebrava o browser (ERR_CONTENT_DECODING_FAILED).
    outHeaders.set("Accept-Encoding", "identity");

    // Diagnóstico (aparece nos Function Logs da Vercel). Não imprime o token completo.
    const authPreview = authorization
      ? `${authorization.slice(0, 18)}…(${authorization.length} chars)`
      : "<ausente>";
    console.log(
      `[Proxy] ${request.method} ${url.pathname} → ${resolved.origin} | Authorization=${authPreview}`
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

      if (response.status === 404 && /Application not found/i.test(responseText)) {
        console.warn(
          `[Proxy] Railway: Application not found. Destino ${targetUrl} não é o SoR FastAPI.`
        );
        return NextResponse.json(
          {
            error: "Backend Railway não encontrado.",
            hint: "O proxy está apontando para o hostname antigo do Kotlin. Na Vercel, defina BACKEND_URL e NEXT_PUBLIC_API_URL = https://api.almotoscaruaru.com.br e faça Redeploy.",
            destination: resolved.origin,
          },
          { status: 502 }
        );
      }

      const nextResponse = isNoBodyStatus
        ? new NextResponse(null, { status: response.status, statusText: response.statusText })
        : new NextResponse(responseText, { status: response.status, statusText: response.statusText });

      // fetch() do Node já descomprime gzip/br — não repassar Content-Encoding/Length
      // ou o browser tenta descomprimir de novo → ERR_CONTENT_DECODING_FAILED (200 OK).
      const BANNED_RESPONSE_HEADERS = new Set([
        "access-control-allow-origin",
        "access-control-allow-methods",
        "access-control-allow-headers",
        "access-control-allow-credentials",
        "content-encoding",
        "content-length",
        "transfer-encoding",
      ]);

      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!BANNED_RESPONSE_HEADERS.has(lowerKey)) {
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
