import type { LogEvento } from "./types";

const acaoVerbo: Record<string, string> = {
  insert: "criou",
  update: "alterou",
  delete: "removeu",
};

const entidadeLabel: Record<string, string> = {
  linha: "uma linha",
  coluna: "uma coluna",
  aba: "uma aba",
  projeto: "um projeto",
  equipe: "uma equipe",
  usuario: "um usuário",
};

export function descreverLog(log: LogEvento): string {
  const verbo = acaoVerbo[log.acao] ?? log.acao;
  const alvo = entidadeLabel[log.entidade] ?? log.entidade;
  const nome =
    (log.dados?.nome as string) ||
    (log.dados?.dados && typeof log.dados.dados === "object"
      ? Object.values(log.dados.dados as Record<string, unknown>)[0]
      : null);
  return nome ? `${verbo} ${alvo} "${nome}"` : `${verbo} ${alvo}`;
}

export const acaoTone: Record<string, "green" | "blue" | "red"> = {
  insert: "green",
  update: "blue",
  delete: "red",
};
