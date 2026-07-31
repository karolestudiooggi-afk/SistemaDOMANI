import type { Role } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(valor: string | number | null): string {
  if (valor == null || valor === "") return "—";

  let d: Date;
  const s = String(valor).trim();

  if (/^\d{12,}$/.test(s)) {
    // timestamp em milissegundos (ex.: vindo de importação de Excel)
    d = new Date(Number(s));
  } else if (/^\d{10,11}$/.test(s)) {
    // timestamp em segundos
    d = new Date(Number(s) * 1000);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
    // já está em dd/mm/aaaa — devolve como veio
    return s;
  } else {
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      // Data ISO pura (sem hora): montar como hora LOCAL para não voltar um dia
      // por causa do fuso (new Date("2026-08-01") seria UTC = 31/07 no Brasil).
      const [, ano, mes, dia] = iso;
      d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    } else {
      d = new Date(s);
    }
  }

  if (isNaN(d.getTime())) return s; // não é data válida: mostra o valor original
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((d - now) / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

export function initials(name: string | null | undefined, email?: string | null): string {
  const base = name?.trim() || email?.split("@")[0] || "?";
  const parts = base.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Papéis por projeto — na interface usamos dois níveis: Admin e Colaborador.
// No banco o enum é admin/editor/viewer; "Colaborador" corresponde a "editor"
// (usa, edita e exclui). O nível "viewer" não é mais oferecido na criação,
// mas continua sendo exibido caso algum acesso antigo ainda o utilize.
// ---------------------------------------------------------------------------
export const PAPEIS: { valor: Role; label: string; descricao: string }[] = [
  { valor: "admin", label: "Admin", descricao: "Gerencia o projeto e seus dados" },
  { valor: "editor", label: "Colaborador", descricao: "Usa, edita e exclui dados" },
];

export function labelPapel(role: Role | null | undefined): string {
  if (role === "admin") return "Admin";
  if (role === "editor") return "Colaborador";
  if (role === "viewer") return "Visitante";
  return "—";
}
