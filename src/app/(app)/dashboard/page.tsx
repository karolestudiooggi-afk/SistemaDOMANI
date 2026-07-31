"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjetos } from "@/hooks/use-projetos";
import { PageHeader } from "@/components/page-header";
import { ProjetoPicker } from "@/components/projeto-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaLinhas, BarrasEquipes } from "@/components/dashboard/graficos";
import { SkeletonCards, Skeleton } from "@/components/ui/skeleton";
import { Avatar, Badge } from "@/components/ui/misc";
import { descreverLog, acaoTone } from "@/lib/logs";
import { relativeTime } from "@/lib/utils";
import type { LogEvento } from "@/lib/types";
import { Rows3, Users, LayoutGrid, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

type Periodo = 7 | 30 | 90;

interface DashData {
  linhas7d: number;
  linhasPrev: number;
  usuariosAtivos: number;
  totalAbas: number;
  projetosAtivos: number;
  serie: { dia: string; total: number }[];
  porAba: { nome: string; total: number }[];
  atividades: (LogEvento & { autor?: string })[];
}

export default function DashboardPage() {
  const supabase = createClient();
  const { projetos, projetoId, selecionar, loading: loadingProj } = useProjetos();
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!projetoId) return;
    setLoading(true);

    const agora = new Date();
    const inicio = new Date(agora.getTime() - periodo * 864e5);
    const inicioPrev = new Date(agora.getTime() - 2 * periodo * 864e5);

    // abas do projeto (com nome para o gráfico)
    const { data: abas } = await supabase.from("abas").select("id, nome").eq("projeto_id", projetoId);
    const abaIds = (abas ?? []).map((a) => a.id);

    // linhas do período atual e anterior
    const { data: linhasAtual } = await supabase
      .from("linhas")
      .select("id, criado_em, aba_id")
      .in("aba_id", abaIds.length ? abaIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("criado_em", inicio.toISOString());

    const { data: linhasPrev } = await supabase
      .from("linhas")
      .select("id")
      .in("aba_id", abaIds.length ? abaIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("criado_em", inicioPrev.toISOString())
      .lt("criado_em", inicio.toISOString());

    // total de linhas do projeto (todas, não só do período) para o gráfico por aba
    const { data: todasLinhas } = await supabase
      .from("linhas")
      .select("aba_id")
      .in("aba_id", abaIds.length ? abaIds : ["00000000-0000-0000-0000-000000000000"]);

    // usuários com acesso a este projeto
    const { data: acessosProj } = await supabase
      .from("acessos")
      .select("usuario_id")
      .eq("projeto_id", projetoId);

    // série diária (últimas 4 semanas)
    const dias = 28;
    const serie: { dia: string; total: number }[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(agora.getTime() - i * 864e5);
      const key = d.toISOString().slice(0, 10);
      const total = (linhasAtual ?? []).filter((l) => l.criado_em?.slice(0, 10) === key).length;
      serie.push({ dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total });
    }

    // distribuição REAL de linhas por aba
    const porAba = (abas ?? []).map((a) => ({
      nome: a.nome,
      total: (todasLinhas ?? []).filter((l) => l.aba_id === a.id).length,
    }));

    // atividades recentes
    const { data: logs } = await supabase
      .from("logs")
      .select("*")
      .eq("projeto_id", projetoId)
      .order("criado_em", { ascending: false })
      .limit(20);

    setData({
      linhas7d: linhasAtual?.length ?? 0,
      linhasPrev: linhasPrev?.length ?? 0,
      usuariosAtivos: (acessosProj ?? []).length,
      totalAbas: abaIds.length,
      projetosAtivos: projetos.length,
      serie,
      porAba,
      atividades: (logs as LogEvento[]) ?? [],
    });
    setLoading(false);
  }, [projetoId, periodo, supabase, projetos.length]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const variacao =
    data && data.linhasPrev > 0
      ? Math.round(((data.linhas7d - data.linhasPrev) / data.linhasPrev) * 100)
      : data && data.linhas7d > 0
      ? 100
      : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Indicadores de uso do projeto."
        action={
          !loadingProj && projetos.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-line bg-surface-2 p-1">
                {([7, 30, 90] as Periodo[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                      periodo === p ? "bg-ember text-white" : "text-content-soft hover:text-content"
                    )}
                  >
                    {p}d
                  </button>
                ))}
              </div>
              <ProjetoPicker projetos={projetos} projetoId={projetoId} onSelect={selecionar} />
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-6">
          <SkeletonCards />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={`Linhas criadas (${periodo}d)`}
              valor={data.linhas7d}
              variacao={variacao}
              icon={<Rows3 className="h-4 w-4" />}
            />
            <KpiCard
              label="Pessoas com acesso"
              valor={data.usuariosAtivos}
              icon={<Users className="h-4 w-4" />}
            />
            <KpiCard
              label="Abas no projeto"
              valor={data.totalAbas}
              icon={<LayoutGrid className="h-4 w-4" />}
            />
            <KpiCard
              label="Projetos ativos"
              valor={data.projetosAtivos}
              icon={<FolderKanban className="h-4 w-4" />}
            />
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface-2 p-5">
              <h3 className="mb-1 font-display text-base text-content">Linhas por dia</h3>
              <p className="mb-4 text-[13px] text-content-soft">Últimas 4 semanas</p>
              <AreaLinhas data={data.serie} />
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 p-5">
              <h3 className="mb-1 font-display text-base text-content">Linhas por aba</h3>
              <p className="mb-4 text-[13px] text-content-soft">Distribuição de linhas no projeto</p>
              {data.porAba.length ? (
                <BarrasEquipes data={data.porAba} />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-content-mute">
                  Sem abas para exibir
                </div>
              )}
            </div>
          </div>

          {/* Atividades recentes */}
          <div className="rounded-2xl border border-line bg-surface-2">
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-display text-base text-content">Atividade recente</h3>
              <p className="text-[13px] text-content-soft">Últimos 20 eventos do projeto</p>
            </div>
            {data.atividades.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-content-mute">
                Nenhuma atividade registrada ainda.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.atividades.map((log) => (
                  <li key={log.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={undefined} email={undefined} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-content">
                        <span className="text-content-soft">Alguém</span> {descreverLog(log)}
                      </p>
                    </div>
                    <Badge tone={acaoTone[log.acao]}>{log.entidade}</Badge>
                    <span className="hidden shrink-0 text-[12px] text-content-mute sm:block">
                      {relativeTime(log.criado_em)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
