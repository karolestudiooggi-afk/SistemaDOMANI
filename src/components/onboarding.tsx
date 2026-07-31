"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  Table2,
  FolderKanban,
  History,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STORAGE_KEY = "domani-onboarding-visto";

const passos = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    titulo: "Bem-vindo ao Domani",
    texto:
      "Seu espaço para planilhas colaborativas. Organize dados por projeto e aba — com todo mundo na mesma página, em tempo real.",
  },
  {
    icon: <Table2 className="h-6 w-6" />,
    titulo: "Planilhas flexíveis",
    texto:
      "Cada aba tem suas próprias colunas e linhas. Clique numa célula para editar na hora. Colunas podem ser texto, número ou data.",
  },
  {
    icon: <FolderKanban className="h-6 w-6" />,
    titulo: "Acesso sob controle",
    texto:
      "O administrador geral cria os logins e define quais projetos cada pessoa acessa, com papéis: viewer só olha, editor edita, admin comanda.",
  },
  {
    icon: <History className="h-6 w-6" />,
    titulo: "Nada se perde",
    texto:
      "Toda alteração fica registrada no Histórico. Veja quem mudou o quê e quando, sempre que precisar.",
  },
];

export function Onboarding() {
  const supabase = createClient();
  const { perfil } = usePerfil();
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const visto = localStorage.getItem(STORAGE_KEY);
    if (!visto) setAberto(true);
  }, []);

  function fechar() {
    localStorage.setItem(STORAGE_KEY, "1");
    setAberto(false);
  }

  if (!aberto) return null;

  const atual = passos[passo];
  const ultimo = passo === passos.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={fechar} />
      <div className="relative z-10 w-full max-w-md animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-2xl">
        {/* atmosfera */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-ember/20 blur-3xl" />

        <div className="relative p-8">
          <div className="mb-6 flex items-center justify-between">
            <LogoMark size={36} />
            <button onClick={fechar} className="text-[13px] text-content-mute hover:text-content">
              Pular
            </button>
          </div>

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember/12 text-ember">
            {atual.icon}
          </div>

          <h2 className="font-display text-2xl text-content">{atual.titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-content-soft">{atual.texto}</p>

          {/* progresso */}
          <div className="mt-6 flex items-center gap-1.5">
            {passos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === passo ? "w-6 bg-ember" : "w-1.5 bg-surface-3"
                )}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPasso((p) => p - 1)}
              className={cn(passo === 0 && "invisible")}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            {ultimo ? (
              <Button onClick={fechar}>
                <Check className="h-4 w-4" /> Começar a usar
              </Button>
            ) : (
              <Button onClick={() => setPasso((p) => p + 1)}>
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
