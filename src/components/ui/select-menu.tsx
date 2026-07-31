"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

export interface OpcaoSelect {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Select totalmente customizado (dark, no estilo Domani).
 * Substitui o <select> nativo, cujo dropdown não é estilizável.
 */
export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Selecionar…",
  className,
  disabled,
  align = "start",
}: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: OpcaoSelect[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  const [aberto, setAberto] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selecionada = options.find((o) => o.value === value);

  function posicionar() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  function abrir() {
    if (disabled) return;
    posicionar();
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    function onDoc(e: MouseEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    }
    function onScrollResize() {
      posicionar();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-content",
          "transition-all duration-200",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-content-mute/40",
          aberto && "border-ember/50 ring-2 ring-ember/20",
          className
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2 truncate", !selecionada && "text-content-mute")}>
          {selecionada?.icon}
          <span className="truncate">{selecionada ? selecionada.label : placeholder}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-content-mute transition-transform duration-200", aberto && "rotate-180")}
        />
      </button>

      {aberto &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: align === "end" ? undefined : coords.left,
              right: align === "end" ? window.innerWidth - coords.left - coords.width : undefined,
              minWidth: coords.width,
              zIndex: 100,
            }}
            className="max-h-64 overflow-y-auto rounded-xl border border-line bg-surface-2 p-1 shadow-2xl animate-scale-in"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-content-mute">Nenhuma opção</div>
            ) : (
              options.map((o) => {
                const ativo = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setAberto(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      ativo ? "bg-ember/12 text-ember" : "text-content-soft hover:bg-surface-3 hover:text-content"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      {o.icon}
                      <span className="truncate">{o.label}</span>
                    </span>
                    {ativo && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}
