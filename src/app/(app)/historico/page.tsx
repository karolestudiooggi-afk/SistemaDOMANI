"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjetos } from "@/hooks/use-projetos";
import { PageHeader } from "@/components/page-header";
import { ProjetoPicker } from "@/components/projeto-picker";
import { SelectMenu } from "@/components/ui/select-menu";
import { SkeletonList } from "@/components/ui/skeleton";
import { Badge, EmptyState } from "@/components/ui/misc";
import { descreverLog, acaoTone } from "@/lib/logs";
import { formatDateTime, relativeTime } from "@/lib/utils";
import type { LogEvento } from "@/lib/types";
import { History, Plus, Pencil, Trash2 } from "lucide-react";

const acaoIcon = {
  insert: <Plus className="h-3.5 w-3.5" />,
  update: <Pencil className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
};

export default function HistoricoPage() {
  const supabase = createClient();
  const { projetos, projetoId, selecionar, loading: loadingProj } = useProjetos();

  const [logs, setLogs] = useState<LogEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState("__all");
  const [filtroEntidade, setFiltroEntidade] = useState("__all");

  const carregar = useCallback(async () => {
    if (!projetoId) return;
    setLoading(true);
    const { data } = await supabase
      .from("logs")
      .select("*")
      .eq("projeto_id", projetoId)
      .order("criado_em", { ascending: false })
      .limit(200);
    setLogs((data as LogEvento[]) ?? []);
    setLoading(false);
  }, [projetoId, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(
    () =>
      logs.filter(
        (l) =>
          (filtroAcao === "__all" || l.acao === filtroAcao) &&
          (filtroEntidade === "__all" || l.entidade === filtroEntidade)
      ),
    [logs, filtroAcao, filtroEntidade]
  );

  return (
    <div>
      <PageHeader
        title="Histórico de alterações"
        subtitle="Quem mudou o quê, e quando."
        action={
          !loadingProj && projetos.length > 0 ? (
            <ProjetoPicker projetos={projetos} projetoId={projetoId} onSelect={selecionar} />
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <SelectMenu
          value={filtroAcao}
          onChange={setFiltroAcao}
          className="w-44"
          options={[
            { value: "__all", label: "Todas as ações" },
            { value: "insert", label: "Criações" },
            { value: "update", label: "Alterações" },
            { value: "delete", label: "Remoções" },
          ]}
        />
        <SelectMenu
          value={filtroEntidade}
          onChange={setFiltroEntidade}
          className="w-44"
          options={[
            { value: "__all", label: "Tudo" },
            { value: "linha", label: "Linhas" },
            { value: "coluna", label: "Colunas" },
            { value: "aba", label: "Abas" },
            { value: "projeto", label: "Projetos" },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonList count={6} />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Nada por aqui ainda"
          description="Assim que os dados começarem a ser editados, todas as alterações aparecerão nesta linha do tempo."
        />
      ) : (
        <div className="relative">
          <div className="absolute bottom-2 left-[19px] top-2 w-px bg-line" />
          <ul className="space-y-1">
            {filtrados.map((log) => (
              <li key={log.id} className="relative flex gap-4 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2 animate-fade-up">
                <div className="relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-content-soft">
                  {acaoIcon[log.acao]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-content">
                      <span className="font-medium">Alguém</span>{" "}
                      <span className="text-content-soft">{descreverLog(log)}</span>
                    </p>
                    <Badge tone={acaoTone[log.acao]}>{log.entidade}</Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-content-mute" title={formatDateTime(log.criado_em)}>
                    {relativeTime(log.criado_em)} · {formatDateTime(log.criado_em)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
