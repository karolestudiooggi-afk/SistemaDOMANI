"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useProjetos } from "@/hooks/use-projetos";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { ProjetoPicker } from "@/components/projeto-picker";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Dialog, AlertDialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/misc";
import { Celula } from "@/components/planilha/celula";
import type { Aba, Coluna, Linha, ColunaTipo } from "@/lib/types";
import {
  Plus,
  Search,
  Columns3,
  Trash2,
  Pencil,
  Table2,
  Filter,
  X,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportarDialog } from "@/components/importar-dialog";

export default function PlanilhaPage() {
  const supabase = createClient();
  const toast = useToast();
  const { podeEditar, isSuperAdmin } = usePerfil();
  const { projetos, projetoId, selecionar, loading: loadingProj } = useProjetos();

  const [abas, setAbas] = useState<Aba[]>([]);
  const [abaId, setAbaId] = useState<string | null>(null);
  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroCol, setFiltroCol] = useState<string>("__all");
  const [importar, setImportar] = useState(false);

  // pode editar depende do papel no projeto ativo
  const canEdit = podeEditar(projetoId);

  // dialogs
  const [novaColuna, setNovaColuna] = useState(false);
  const [editarColuna, setEditarColuna] = useState<Coluna | null>(null);
  const [excluirColuna, setExcluirColuna] = useState<Coluna | null>(null);
  const [linhaSheet, setLinhaSheet] = useState<Linha | "nova" | null>(null);
  const [excluirLinha, setExcluirLinha] = useState<Linha | null>(null);
  const [busy, setBusy] = useState(false);

  // ---------- carregamento ----------
  const carregarAbas = useCallback(async () => {
    if (!projetoId) return;
    const { data } = await supabase
      .from("abas")
      .select("*")
      .eq("projeto_id", projetoId)
      .order("ordem");
    const list = (data as Aba[]) ?? [];
    setAbas(list);
    setAbaId((cur) => (list.find((a) => a.id === cur) ? cur : list[0]?.id ?? null));
  }, [projetoId, supabase]);

  const carregarAba = useCallback(async () => {
    if (!abaId) {
      setColunas([]);
      setLinhas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: cols }, { data: rows }] = await Promise.all([
      supabase.from("colunas").select("*").eq("aba_id", abaId).order("ordem"),
      supabase.from("linhas").select("*").eq("aba_id", abaId).order("criado_em"),
    ]);
    setColunas((cols as Coluna[]) ?? []);
    setLinhas((rows as Linha[]) ?? []);
    setLoading(false);
  }, [abaId, supabase]);

  useEffect(() => {
    carregarAbas();
  }, [carregarAbas]);
  useEffect(() => {
    carregarAba();
  }, [carregarAba]);

  // realtime colaborativo
  useRealtime("linhas", carregarAba, abaId ? { column: "aba_id", value: abaId } : undefined);
  useRealtime("colunas", carregarAba, abaId ? { column: "aba_id", value: abaId } : undefined);
  useRealtime("abas", carregarAbas, projetoId ? { column: "projeto_id", value: projetoId } : undefined);

  // ---------- filtros ----------
  const linhasFiltradas = useMemo(() => {
    if (!busca.trim()) return linhas;
    const q = busca.toLowerCase();
    return linhas.filter((l) => {
      const alvo =
        filtroCol === "__all"
          ? Object.values(l.dados)
          : [l.dados[colunas.find((c) => c.id === filtroCol)?.nome ?? ""]];
      return alvo.some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [linhas, busca, filtroCol, colunas]);

  // ---------- ações célula ----------
  async function salvarCelula(linha: Linha, coluna: Coluna, valor: string | number | null) {
    const dados = { ...linha.dados, [coluna.nome]: valor };
    setLinhas((prev) => prev.map((l) => (l.id === linha.id ? { ...l, dados } : l)));
    const { error } = await supabase.from("linhas").update({ dados }).eq("id", linha.id);
    if (error) {
      toast.error("Não foi possível salvar", error.message);
      carregarAba();
    }
  }

  // ---------- colunas ----------
  async function criarColuna(nome: string, tipo: ColunaTipo) {
    if (!abaId) return;
    setBusy(true);
    const ordem = colunas.length;
    const { error } = await supabase.from("colunas").insert({ aba_id: abaId, nome, tipo, ordem });
    setBusy(false);
    if (error) return toast.error("Erro ao criar coluna", error.message);
    toast.success("Coluna criada", `"${nome}" foi adicionada.`);
    setNovaColuna(false);
    carregarAba();
  }

  async function renomearColuna(col: Coluna, nome: string, tipo: ColunaTipo) {
    setBusy(true);
    const { error } = await supabase.from("colunas").update({ nome, tipo }).eq("id", col.id);
    setBusy(false);
    if (error) return toast.error("Erro ao atualizar", error.message);
    toast.success("Coluna atualizada");
    setEditarColuna(null);
    carregarAba();
  }

  async function removerColuna(col: Coluna) {
    setBusy(true);
    const { error } = await supabase.from("colunas").delete().eq("id", col.id);
    setBusy(false);
    if (error) return toast.error("Erro ao excluir", error.message);
    toast.success("Coluna removida");
    setExcluirColuna(null);
    carregarAba();
  }

  // ---------- linhas ----------
  async function criarLinha(dados: Record<string, string | number | null>) {
    if (!abaId) return;
    setBusy(true);
    const { error } = await supabase.from("linhas").insert({ aba_id: abaId, dados });
    setBusy(false);
    if (error) return toast.error("Erro ao criar linha", error.message);
    toast.success("Linha adicionada");
    setLinhaSheet(null);
    carregarAba();
  }

  async function editarLinha(linha: Linha, dados: Record<string, string | number | null>) {
    setBusy(true);
    const { error } = await supabase.from("linhas").update({ dados }).eq("id", linha.id);
    setBusy(false);
    if (error) return toast.error("Erro ao salvar", error.message);
    toast.success("Linha atualizada");
    setLinhaSheet(null);
    carregarAba();
  }

  async function removerLinha(linha: Linha) {
    setBusy(true);
    const { error } = await supabase.from("linhas").delete().eq("id", linha.id);
    setBusy(false);
    if (error) return toast.error("Erro ao excluir", error.message);
    toast.success("Linha removida");
    setExcluirLinha(null);
    carregarAba();
  }

  const gridCols = canEdit
    ? `minmax(0,2rem) ${colunas.map(() => "minmax(140px,1fr)").join(" ")} minmax(0,3rem)`
    : `${colunas.map(() => "minmax(140px,1fr)").join(" ")}`;

  return (
    <div>
      <PageHeader
        title="Planilha"
        subtitle="Edite dados por aba com colunas flexíveis."
        action={
          !loadingProj && projetos.length > 0 ? (
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setImportar(true)}>
                  <Upload className="h-4 w-4" /> Importar
                </Button>
              )}
              <ProjetoPicker projetos={projetos} projetoId={projetoId} onSelect={selecionar} />
            </div>
          ) : null
        }
      />

      {projetos.length === 0 && !loadingProj ? (
        <EmptyState
          icon={<Table2 className="h-6 w-6" />}
          title="Nenhum projeto ainda"
          description="Você ainda não tem acesso a nenhum projeto. Peça ao administrador para liberar um projeto para você."
        />
      ) : (
        <>
          {/* Tabs de abas */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-line pb-px">
            {abas.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaId(aba.id)}
                className={cn(
                  "relative shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  abaId === aba.id
                    ? "text-content"
                    : "text-content-soft hover:text-content"
                )}
              >
                {aba.nome}
                {abaId === aba.id && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember" />
                )}
              </button>
            ))}
            {abas.length === 0 && !loading && (
              <span className="px-2 py-2 text-sm text-content-mute">Nenhuma aba neste projeto</span>
            )}
          </div>

          {/* Barra de ferramentas */}
          {abaId && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                  <Input
                    placeholder="Filtrar linhas…"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-content-mute hover:text-content"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Filter className="h-4 w-4 text-content-mute" />
                  <Select
                    value={filtroCol}
                    onChange={(e) => setFiltroCol(e.target.value)}
                    className="w-40"
                  >
                    <option value="__all">Todas as colunas</option>
                    {colunas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setNovaColuna(true)}>
                    <Columns3 className="h-4 w-4" /> Coluna
                  </Button>
                  <Button size="sm" onClick={() => setLinhaSheet("nova")} disabled={colunas.length === 0}>
                    <Plus className="h-4 w-4" /> Linha
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tabela */}
          {loading ? (
            <SkeletonTable rows={7} cols={5} />
          ) : abaId && colunas.length === 0 ? (
            <EmptyState
              icon={<Columns3 className="h-6 w-6" />}
              title="Comece pelas colunas"
              description="Esta aba ainda não tem colunas. Crie a primeira para começar a preencher dados."
              action={
                canEdit && (
                  <Button onClick={() => setNovaColuna(true)}>
                    <Plus className="h-4 w-4" /> Criar coluna
                  </Button>
                )
              }
            />
          ) : abaId ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="overflow-x-auto">
                <div style={{ minWidth: "min-content" }}>
                  {/* Cabeçalho */}
                  <div
                    className="grid border-b border-line bg-surface-2"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {canEdit && <div className="px-2 py-3" />}
                    {colunas.map((col) => (
                      <div
                        key={col.id}
                        className="group flex items-center justify-between gap-1 border-l border-line px-3.5 py-3 first:border-l-0"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-content">
                            {col.nome}
                          </span>
                          <TipoTag tipo={col.tipo} />
                        </div>
                        {canEdit && (
                          <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setEditarColuna(col)}
                              className="rounded p-1 text-content-mute hover:text-content"
                              title="Editar coluna"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setExcluirColuna(col)}
                              className="rounded p-1 text-content-mute hover:text-red-400"
                              title="Excluir coluna"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {canEdit && <div className="border-l border-line" />}
                  </div>

                  {/* Linhas */}
                  {linhasFiltradas.length === 0 ? (
                    <div className="px-4 py-12 text-center text-sm text-content-mute">
                      {busca ? "Nenhuma linha corresponde ao filtro." : "Nenhuma linha ainda."}
                    </div>
                  ) : (
                    linhasFiltradas.map((linha, i) => (
                      <div
                        key={linha.id}
                        className="group grid border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/40"
                        style={{ gridTemplateColumns: gridCols }}
                      >
                        {canEdit && (
                          <div className="flex items-center justify-center text-[11px] text-content-mute tabular">
                            {i + 1}
                          </div>
                        )}
                        {colunas.map((col) => (
                          <div key={col.id} className="border-l border-line first:border-l-0">
                            <Celula
                              coluna={col}
                              valor={linha.dados[col.nome] ?? null}
                              editavel={canEdit}
                              onCommit={(v) => salvarCelula(linha, col, v)}
                            />
                          </div>
                        ))}
                        {canEdit && (
                          <div className="flex items-center justify-center gap-0.5 border-l border-line opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setLinhaSheet(linha)}
                              className="rounded p-1.5 text-content-mute hover:text-content"
                              title="Editar linha"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setExcluirLinha(linha)}
                              className="rounded p-1.5 text-content-mute hover:text-red-400"
                              title="Excluir linha"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* rodapé de contagem */}
              <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2.5 text-[12px] text-content-soft">
                <span>
                  {linhasFiltradas.length} {linhasFiltradas.length === 1 ? "linha" : "linhas"}
                  {busca && ` de ${linhas.length}`}
                </span>
                <span className="tabular">{colunas.length} colunas</span>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ----- Dialog: nova coluna ----- */}
      <ColunaDialog
        open={novaColuna}
        onClose={() => setNovaColuna(false)}
        onSave={criarColuna}
        busy={busy}
      />
      {/* ----- Dialog: editar coluna ----- */}
      <ColunaDialog
        open={!!editarColuna}
        coluna={editarColuna ?? undefined}
        onClose={() => setEditarColuna(null)}
        onSave={(nome, tipo) => editarColuna && renomearColuna(editarColuna, nome, tipo)}
        busy={busy}
      />
      {/* ----- Alert: excluir coluna ----- */}
      <AlertDialog
        open={!!excluirColuna}
        onClose={() => setExcluirColuna(null)}
        onConfirm={() => excluirColuna && removerColuna(excluirColuna)}
        title="Excluir coluna?"
        description={`A coluna "${excluirColuna?.nome}" e todos os seus valores serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir coluna"
        loading={busy}
      />
      {/* ----- Alert: excluir linha ----- */}
      <AlertDialog
        open={!!excluirLinha}
        onClose={() => setExcluirLinha(null)}
        onConfirm={() => excluirLinha && removerLinha(excluirLinha)}
        title="Excluir linha?"
        description="Esta linha será removida permanentemente."
        confirmLabel="Excluir linha"
        loading={busy}
      />
      {/* ----- Sheet: linha ----- */}
      {linhaSheet && (
        <LinhaSheet
          colunas={colunas}
          linha={linhaSheet === "nova" ? null : linhaSheet}
          onClose={() => setLinhaSheet(null)}
          onSave={(dados) =>
            linhaSheet === "nova" ? criarLinha(dados) : editarLinha(linhaSheet, dados)
          }
          busy={busy}
        />
      )}
      {importar && (
        <ImportarDialog
          projetos={projetos}
          projetoAtualId={projetoId}
          podeNovoProjeto={isSuperAdmin}
          onClose={() => setImportar(false)}
          onDone={(id) => {
            setImportar(false);
            if (id === projetoId) {
              carregarAbas();
              carregarAba();
            } else {
              selecionar(id);
            }
          }}
        />
      )}
    </div>
  );
}

function TipoTag({ tipo }: { tipo: ColunaTipo }) {
  const map = { texto: "Texto", numero: "Nº", data: "Data" };
  return <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-content-mute">{map[tipo]}</span>;
}

function ColunaDialog({
  open,
  coluna,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  coluna?: Coluna;
  onClose: () => void;
  onSave: (nome: string, tipo: ColunaTipo) => void;
  busy: boolean;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ColunaTipo>("texto");

  useEffect(() => {
    if (open) {
      setNome(coluna?.nome ?? "");
      setTipo(coluna?.tipo ?? "texto");
    }
  }, [open, coluna]);

  return (
    <Dialog open={open} onClose={onClose} title={coluna ? "Editar coluna" : "Nova coluna"}>
      <div className="space-y-4">
        <Field label="Nome da coluna">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Cliente"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && nome.trim() && onSave(nome.trim(), tipo)}
          />
        </Field>
        <Field label="Tipo de dado">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as ColunaTipo)}>
            <option value="texto">Texto</option>
            <option value="numero">Número</option>
            <option value="data">Data</option>
          </Select>
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => nome.trim() && onSave(nome.trim(), tipo)} loading={busy} disabled={!nome.trim()}>
          {coluna ? "Salvar" : "Criar coluna"}
        </Button>
      </div>
    </Dialog>
  );
}

function LinhaSheet({
  colunas,
  linha,
  onClose,
  onSave,
  busy,
}: {
  colunas: Coluna[];
  linha: Linha | null;
  onClose: () => void;
  onSave: (dados: Record<string, string | number | null>) => void;
  busy: boolean;
}) {
  const [dados, setDados] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    colunas.forEach((c) => {
      const v = linha?.dados[c.nome];
      init[c.nome] = v == null ? "" : String(v);
    });
    setDados(init);
  }, [linha, colunas]);

  function salvar() {
    const out: Record<string, string | number | null> = {};
    colunas.forEach((c) => {
      const raw = dados[c.nome]?.trim() ?? "";
      if (raw === "") out[c.nome] = null;
      else if (c.tipo === "numero") out[c.nome] = Number(raw);
      else out[c.nome] = raw;
    });
    onSave(out);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={linha ? "Editar linha" : "Nova linha"}
      description={linha ? "Atualize os campos desta linha." : "Preencha os campos da nova linha."}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={busy}>
            {linha ? "Salvar linha" : "Adicionar linha"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {colunas.map((c) => (
          <Field key={c.id} label={c.nome}>
            <Input
              type={c.tipo === "numero" ? "number" : c.tipo === "data" ? "date" : "text"}
              value={dados[c.nome] ?? ""}
              onChange={(e) => setDados((d) => ({ ...d, [c.nome]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
    </Sheet>
  );
}
