"use client";

import { useState, useEffect, useRef } from "react";
import type { Coluna } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

// Detecta valores que são timestamps em milissegundos (ex.: datas importadas do Excel)
function pareceTimestampMs(v: string | number | null): boolean {
  if (v == null) return false;
  return /^\d{12,}$/.test(String(v).trim());
}

export function Celula({
  coluna,
  valor,
  editavel,
  onCommit,
}: {
  coluna: Coluna;
  valor: string | number | null;
  editavel: boolean;
  onCommit: (v: string | number | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<string>(valor == null ? "" : String(valor));
  const inputRef = useRef<HTMLInputElement>(null);

  // trata como data se a coluna é data OU se o valor é claramente um timestamp
  const ehData = coluna.tipo === "data" || pareceTimestampMs(valor);

  useEffect(() => {
    setRascunho(valor == null ? "" : String(valor));
  }, [valor]);

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  function commit() {
    setEditando(false);
    let out: string | number | null = rascunho.trim() === "" ? null : rascunho;
    if (out != null && coluna.tipo === "numero") {
      const n = Number(out);
      out = Number.isNaN(n) ? null : n;
    }
    if (out !== valor) onCommit(out);
  }

  if (!editavel) {
    return (
      <div className="px-3.5 py-2.5 text-sm text-content">
        {ehData ? formatDate(valor) : valor ?? <span className="text-content-mute">—</span>}
      </div>
    );
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        type={coluna.tipo === "numero" ? "number" : coluna.tipo === "data" ? "date" : "text"}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setRascunho(valor == null ? "" : String(valor));
            setEditando(false);
          }
        }}
        className="h-full w-full bg-ember/5 px-3.5 py-2.5 text-sm text-content outline-none ring-1 ring-inset ring-ember/40"
      />
    );
  }

  return (
    <button
      onClick={() => setEditando(true)}
      className={cn(
        "flex h-full w-full items-center gap-1.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-surface-2",
        valor == null ? "text-content-mute" : "text-content"
      )}
    >
      {ehData && valor && <Calendar className="h-3 w-3 text-content-mute" />}
      <span className="truncate">
        {valor == null
          ? "—"
          : ehData
          ? formatDate(valor)
          : String(valor)}
      </span>
    </button>
  );
}
