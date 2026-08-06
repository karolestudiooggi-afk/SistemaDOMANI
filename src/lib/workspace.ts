/**
 * Workspace do cliente.
 *
 * Cada cliente tem o seu `workspace_id`, e o id precisa sobreviver a TODA
 * navegação do app — se ele se perde num clique, o app sai do contexto do
 * cliente. Por isso ninguém monta href na mão: usa-se `withWorkspace()`, ou o
 * `<WsLink>` / `useWsRouter` (que já chamam este helper).
 *
 * O valor vem de NEXT_PUBLIC_WORKSPACE_ID (ver .env.local.example). Como é uma
 * var NEXT_PUBLIC_*, ela é inlinada NO BUILD: trocar o valor exige `npm run build`.
 *
 * Fora de propósito: /auth/* — é o callback de sessão do Supabase, uma troca
 * máquina-a-máquina que já redireciona para /dashboard logo em seguida (e aí sim
 * o id entra). Sujar o callback só acrescentaria um salto de redirect no login.
 */

export const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "289883";

/** Rotas que NÃO recebem workspace_id. */
export const ROTAS_PUBLICAS = ["/auth"];

export function isRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Acrescenta `workspace_id` a um href preservando o que já existir na query.
 *
 * Merge, não concatenação: `/planilha?aba=3` vira `/planilha?aba=3&workspace_id=...`
 * (colar "?workspace_id=" no fim descartaria o `aba`). Hrefs externos (http,
 * mailto, tel) e âncoras (#) passam intactos, assim como as rotas públicas.
 */
export function withWorkspace(href: string, ws: string = WORKSPACE_ID): string {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|\/\/|#)/i.test(href)) return href;

  const [semHash, hash] = href.split("#");
  const [base, query = ""] = semHash.split("?");

  if (isRotaPublica(base)) return href;

  const sp = new URLSearchParams(query);
  sp.set("workspace_id", ws);
  return `${base}?${sp.toString()}${hash ? `#${hash}` : ""}`;
}

/** Mesma regra, aplicada a um objeto URL (usado no middleware). */
export function aplicarWorkspace(url: URL, ws: string = WORKSPACE_ID): URL {
  if (!isRotaPublica(url.pathname)) url.searchParams.set("workspace_id", ws);
  return url;
}
