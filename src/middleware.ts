import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value || 
                request.headers.get("authorization")?.replace("Bearer ", "");

  // Permitir acesso à página de login sem autenticação
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Verificar se há token no localStorage (via header ou cookie)
  // Como não podemos acessar localStorage no middleware, vamos verificar no cliente
  // Por enquanto, permitimos todas as rotas e a verificação será feita no cliente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
