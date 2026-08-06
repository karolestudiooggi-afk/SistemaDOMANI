import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { aplicarWorkspace, isRotaPublica } from "@/lib/workspace";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/redefinir-senha");

  // Redirect que NÃO descarta os cookies de sessão renovados acima.
  const redirecionar = (url: URL) => {
    const saida = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => saida.cookies.set(c));
    return saida;
  };

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirecionar(aplicarWorkspace(url));
  }

  // não redireciona para dashboard quem está redefinindo senha
  if (user && (path.startsWith("/login") || path === "/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirecionar(aplicarWorkspace(url));
  }

  // Rede de segurança do workspace_id: qualquer entrada sem o param (link colado,
  // F5, favorito, e-mail de recuperação de senha) leva redirect para o mesmo path
  // com ele. A navegação interna já sai correta via WsLink/useWsRouter.
  if (!isRotaPublica(path) && !request.nextUrl.searchParams.get("workspace_id")) {
    return redirecionar(aplicarWorkspace(request.nextUrl.clone()));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.png$).*)"],
};
