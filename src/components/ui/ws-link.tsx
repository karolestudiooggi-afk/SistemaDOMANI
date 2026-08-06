"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { withWorkspace } from "@/lib/workspace";

/**
 * Navegação que preserva o `workspace_id`.
 *
 * Use SEMPRE `WsLink` no lugar de `next/link` e `useWsRouter` no lugar de
 * `useRouter`. Sem isso o id se perde no primeiro clique (o middleware corrige
 * com um redirect, mas a URL pisca e a navegação atrasa).
 *
 * Hrefs continuam escritos limpos no código (`/dashboard`, `/planilha`) — quem
 * injeta o id é `withWorkspace()`, na renderização. Assim o `usePathname()` do
 * estado ativo da sidebar segue funcionando com os hrefs do array `nav`.
 */
export function WsLink({
  href,
  ...rest
}: React.ComponentProps<typeof NextLink>) {
  const final = useMemo(() => withWorkspace(String(href)), [href]);
  return <NextLink href={final} {...rest} />;
}

/** `useRouter` com push/replace que carregam o workspace_id. */
export function useWsRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: Parameters<typeof router.push>[1]) =>
        router.push(withWorkspace(href), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) =>
        router.replace(withWorkspace(href), opts),
    }),
    [router],
  );
}
