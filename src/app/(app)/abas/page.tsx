"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useProjetos } from "@/hooks/use-projetos";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { ProjetoPicker } from "@/components/projeto-picker";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Dialog, AlertDialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/misc";
import type { Aba } from "@/lib/types";
import { Plus, Pencil, Trash2, GripVertical, ListOrdered } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function AbasPage() {
  const supabase = createClient();
  const toast = useToast();
  const { podeEditar } = usePerfil();
  const { projetos, projetoId, selecionar, loading: loadingProj } = useProjetos();
  const canEdit = podeEditar(projetoId);

  const [abas, setAbas] = useState<Aba[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [nova, setNova] = useState(false);
  const [editar, setEditar] = useState<Aba | null>(null);
  const [excluir, setExcluir] = useState<Aba | null>(null);

  const carregar = useCallback(async () => {
    if (!projetoId) return;
    setLoading(true);
    const { data } = await supabase.from("abas").select("*").eq("projeto_id", projetoId).order("ordem");
    setAbas((data as Aba[]) ?? []);
    setLoading(false);
  }, [projetoId, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = abas.findIndex((a) => a.id === active.id);
    const newIndex = abas.findIndex((a) => a.id === over.id);
    const reordenado = arrayMove(abas, oldIndex, newIndex);
    setAbas(reordenado);

    // persiste nova ordem
    const updates = reordenado.map((a, i) =>
      supabase.from("abas").update({ ordem: i }).eq("id", a.id)
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("Erro ao reordenar");
      carregar();
    } else {
      toast.success("Ordem salva");
    }
  }

  async function criar(nome: string) {
    if (!projetoId) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("addAba", { body: { projeto_id: projetoId, nome } });
    setBusy(false);
    if (error) return toast.error("Erro ao criar aba", error.message);
    toast.success("Aba criada", `"${nome}" foi adicionada.`);
    setNova(false);
    carregar();
  }

  async function renomear(aba: Aba, nome: string) {
    setBusy(true);
    const { error } = await supabase.from("abas").update({ nome }).eq("id", aba.id);
    setBusy(false);
    if (error) return toast.error("Erro ao renomear", error.message);
    toast.success("Aba atualizada");
    setEditar(null);
    carregar();
  }

  async function remover(aba: Aba) {
    setBusy(true);
    const { error } = await supabase.from("abas").delete().eq("id", aba.id);
    setBusy(false);
    if (error) return toast.error("Erro ao excluir", error.message);
    toast.success("Aba removida");
    setExcluir(null);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Organizar abas"
        subtitle="Arraste para reordenar. Renomeie ou remova quando precisar."
        action={
          !loadingProj && projetos.length > 0 ? (
            <div className="flex items-center gap-2">
              <ProjetoPicker projetos={projetos} projetoId={projetoId} onSelect={selecionar} />
              {canEdit && (
                <Button onClick={() => setNova(true)}>
                  <Plus className="h-4 w-4" /> Nova aba
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : abas.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-6 w-6" />}
          title="Nenhuma aba"
          description="Crie a primeira aba deste projeto para começar a montar suas planilhas."
          action={canEdit && <Button onClick={() => setNova(true)}><Plus className="h-4 w-4" /> Criar aba</Button>}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={abas.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {abas.map((aba, i) => (
                <AbaItem
                  key={aba.id}
                  aba={aba}
                  index={i}
                  canEdit={canEdit}
                  onEdit={() => setEditar(aba)}
                  onDelete={() => setExcluir(aba)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <NomeDialog
        open={nova}
        title="Nova aba"
        onClose={() => setNova(false)}
        onSave={criar}
        busy={busy}
      />
      <NomeDialog
        open={!!editar}
        title="Renomear aba"
        inicial={editar?.nome}
        onClose={() => setEditar(null)}
        onSave={(nome) => editar && renomear(editar, nome)}
        busy={busy}
      />
      <AlertDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={() => excluir && remover(excluir)}
        title="Excluir aba?"
        description={`"${excluir?.nome}", com todas as suas colunas e linhas, será removida permanentemente.`}
        confirmLabel="Excluir aba"
        loading={busy}
      />
    </div>
  );
}

function AbaItem({
  aba,
  index,
  canEdit,
  onEdit,
  onDelete,
}: {
  aba: Aba;
  index: number;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aba.id,
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-shadow ${
        isDragging ? "z-10 shadow-2xl ring-1 ring-ember/30" : ""
      }`}
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-content-mute hover:text-content active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-3 text-[12px] font-medium text-content-soft tabular">
        {index + 1}
      </span>
      <span className="flex-1 text-sm font-medium text-content">{aba.nome}</span>
      {canEdit && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Renomear">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Excluir">
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      )}
    </div>
  );
}

function NomeDialog({
  open,
  title,
  inicial,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  title: string;
  inicial?: string;
  onClose: () => void;
  onSave: (nome: string) => void;
  busy: boolean;
}) {
  const [nome, setNome] = useState("");
  useEffect(() => {
    if (open) setNome(inicial ?? "");
  }, [open, inicial]);

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <Field label="Nome da aba">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Abril"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && nome.trim() && onSave(nome.trim())}
        />
      </Field>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => nome.trim() && onSave(nome.trim())} loading={busy} disabled={!nome.trim()}>
          Salvar
        </Button>
      </div>
    </Dialog>
  );
}
