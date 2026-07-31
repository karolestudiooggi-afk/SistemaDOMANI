"use client";

import { useState, useRef, useEffect } from "react";
import type { Projeto } from "@/lib/types";
import { ChevronDown, Check, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjetoPicker({
  projetos,
  projetoId,
  onSelect,
}: {
  projetos: Projeto[];
  projetoId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const atual = projetos.find((p) => p.id === projetoId);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-3"
      >
        <FolderKanban className="h-4 w-4 text-ember" />
        <span className="max-w-[160px] truncate">{atual?.nome ?? "Selecionar projeto"}</span>
        <ChevronDown className={cn("h-4 w-4 text-content-mute transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 animate-scale-in rounded-xl border border-line bg-surface-2 p-1.5 shadow-2xl">
          {projetos.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                p.id === projetoId ? "bg-ember/10 text-ember" : "text-content hover:bg-surface-3"
              )}
            >
              <span className="truncate">{p.nome}</span>
              {p.id === projetoId && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
