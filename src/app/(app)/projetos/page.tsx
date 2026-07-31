"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Dialog, AlertDialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { ImportarDialog } from "@/components/importar-dialog";
import type { Projeto, Usuario, Acesso, Role } from "@/lib/types";
import { formatDate, labelPapel } from "@/lib/utils";
import { FolderPlus, Plus, Pencil, Trash2, FolderKanban, Upload, Users } from "lucide-react";

interface ProjetoFull extends Projeto {
  membros: { usuario: Usuario; papel: string }[];
}

export default function ProjetosPage() {
  const supabase = createClient();
  const toast = useToast();
  const { isSuperAdmin, loading: loadingPerfil } = usePerfil();

  const [projetos, setProjetos] = useState<ProjetoFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState<Projeto | null>(null);
  const [excluir, setExcluir] = useState<Projeto | null>(null);
  const [importar, setImportar] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [{ data: pr }, { data: us }, { data: ac }] = await Promise.all([
      supabase.from("projetos").select("*").order("created_at"),
      supabase.from("usuarios").select("*"),
      supabase.from("acessos").select("*"),
    ]);
    const usuarios = (us as Usuario[]) ?? [];
    const acessos = (ac as Acesso[]) ?? [];
    const full: ProjetoFull[] = ((pr as Projeto[]) ?? []).map((p) => ({
      ...p,
      membros: acessos
        .filter((a) => a.projeto_id === p.id)
        .map((a) => ({ usuario: usuarios.find((u) => u.id === a.usuario_id)!, papel: a.papel }))
        .filter((m) => m.usuario),
    }));
    setProjetos(full);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!loadingPerfil && !isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Projetos" />
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Acesso restrito"
          description="Apenas o administrador geral gerencia projetos."
        />
      </div>
    );
  }

  async function criar(nome: string) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("createProjeto", { body: { nome } });
    setBusy(false);
    if (error || data?.error) return toast.error("Erro ao criar", data?.error ?? error?.message);
    toast.success("Projeto criado", `"${nome}" está pronto.`);
    setNovo(false);
    carregar();
  }

  async function salvarNome(p: Projeto, nome: string) {
    setBusy(true);
    const { error } = await supabase.from("projetos").update({ nome }).eq("id", p.id);
    setBusy(false);
    if (error) return toast.error("Erro ao renomear", error.message);
    toast.success("Projeto atualizado");
    setEditar(null);
    carregar();
  }

  async function remover(p: Projeto) {
    setBusy(true);
    const { error } = await supabase.from("projetos").delete().eq("id", p.id);
    setBusy(false);
    if (error) return toast.error("Erro ao excluir", error.message);
    toast.success("Projeto excluído");
    setExcluir(null);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle="Crie projetos e importe planilhas prontas."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportar(true)}>
              <Upload className="h-4 w-4" /> Importar
            </Button>
            <Button onClick={() => setNovo(true)}>
              <FolderPlus className="h-4 w-4" /> Novo projeto
            </Button>
          </div>
        }
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : projetos.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Nenhum projeto"
          description="Crie seu primeiro projeto do zero ou importe uma planilha pronta."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportar(true)}><Upload className="h-4 w-4" /> Importar</Button>
              <Button onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Criar projeto</Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {projetos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface-2 animate-fade-up">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember/12 text-ember">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-content">{p.nome}</h3>
                    <p className="text-[12px] text-content-mute">Criado em {formatDate(p.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditar(p)} title="Renomear">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setExcluir(p)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="mb-2 flex items-center gap-2 text-[13px] text-content-soft">
                  <Users className="h-4 w-4" /> Com acesso
                  <Badge>{p.membros.length}</Badge>
                </div>
                {p.membros.length === 0 ? (
                  <p className="text-[13px] text-content-mute">
                    Ninguém além do admin geral. Conceda acesso em Usuários.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {p.membros.map((m) => (
                      <div key={m.usuario.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5">
                        <Avatar name={m.usuario.nome} email={m.usuario.email} url={m.usuario.avatar_url} size={26} />
                        <span className="text-[13px] text-content">{m.usuario.nome || m.usuario.email}</span>
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-content-soft">{labelPapel(m.papel as Role)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {novo && <NomeDialog title="Novo projeto" onClose={() => setNovo(false)} onSave={criar} busy={busy} />}
      {editar && (
        <NomeDialog title="Renomear projeto" inicial={editar.nome} onClose={() => setEditar(null)} onSave={(n) => salvarNome(editar, n)} busy={busy} />
      )}
      <AlertDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={() => excluir && remover(excluir)}
        title="Excluir projeto?"
        description={`"${excluir?.nome}" e todas as suas abas, colunas e linhas serão removidos permanentemente.`}
        confirmLabel="Excluir projeto"
        loading={busy}
      />
      {importar && (
        <ImportarDialog
          projetos={projetos}
          podeNovoProjeto={isSuperAdmin}
          onClose={() => setImportar(false)}
          onDone={() => {
            setImportar(false);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function NomeDialog({
  title,
  inicial,
  onClose,
  onSave,
  busy,
}: {
  title: string;
  inicial?: string;
  onClose: () => void;
  onSave: (nome: string) => void;
  busy: boolean;
}) {
  const [nome, setNome] = useState(inicial ?? "");
  return (
    <Dialog open onClose={onClose} title={title}>
      <Field label="Nome do projeto">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Operação 2026" autoFocus onKeyDown={(e) => e.key === "Enter" && nome.trim() && onSave(nome.trim())} />
      </Field>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => nome.trim() && onSave(nome.trim())} loading={busy} disabled={!nome.trim()}>Salvar</Button>
      </div>
    </Dialog>
  );
}
