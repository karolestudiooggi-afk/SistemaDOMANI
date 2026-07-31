"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Field, Select, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/misc";
import { lerArquivoPlanilha, type AbaImportada } from "@/lib/importar";
import type { Projeto } from "@/lib/types";
import { UploadCloud, FileSpreadsheet, Table2, ArrowRight, Loader2 } from "lucide-react";

type Destino = "novo" | string;

export function ImportarDialog({
  projetos,
  projetoAtualId,
  podeNovoProjeto,
  onClose,
  onDone,
}: {
  projetos: Projeto[];
  projetoAtualId?: string | null;
  podeNovoProjeto: boolean;
  onClose: () => void;
  onDone: (projetoId: string) => void;
}) {
  const supabase = createClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [lendo, setLendo] = useState(false);
  const [abas, setAbas] = useState<AbaImportada[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [destino, setDestino] = useState<Destino>(
    podeNovoProjeto ? "novo" : projetoAtualId ?? projetos[0]?.id ?? ""
  );
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function escolherArquivo(file: File) {
    setLendo(true);
    setNomeArquivo(file.name);
    try {
      const parsed = await lerArquivoPlanilha(file);
      if (!parsed.length) {
        toast.error("Arquivo vazio", "Não encontramos abas com dados.");
        setAbas(null);
      } else {
        setAbas(parsed);
        if (!nomeProjeto) setNomeProjeto(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));
      }
    } catch (e) {
      toast.error("Não foi possível ler", String((e as Error)?.message ?? e));
      setAbas(null);
    }
    setLendo(false);
  }

  async function importar() {
    if (!abas) return;
    setEnviando(true);
    const body =
      destino === "novo"
        ? { novo_projeto_nome: nomeProjeto.trim() || "Planilha importada", abas }
        : { projeto_id: destino, abas };
    const { data, error } = await supabase.functions.invoke("importarPlanilha", { body });
    setEnviando(false);
    if (error || data?.error) return toast.error("Falha na importação", data?.error ?? error?.message);
    const totalLinhas = abas.reduce((s, a) => s + a.linhas.length, 0);
    toast.success("Planilha importada", `${abas.length} aba(s) e ${totalLinhas} linha(s).`);
    onDone(data.projeto_id);
  }

  return (
    <Dialog open onClose={onClose} title="Importar planilha" className="max-w-lg">
      {!abas ? (
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface py-10 transition-colors hover:border-ember/40 hover:bg-surface-2"
          >
            {lendo ? (
              <Loader2 className="h-8 w-8 animate-spin text-ember" />
            ) : (
              <UploadCloud className="h-8 w-8 text-content-mute" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-content">
                {lendo ? "Lendo arquivo…" : "Clique para escolher um arquivo"}
              </p>
              <p className="mt-1 text-[12px] text-content-mute">Excel (.xlsx, .xls) ou CSV — com suporte a várias abas</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && escolherArquivo(e.target.files[0])}
          />
          <p className="mt-4 text-[12px] text-content-mute">
            A primeira linha de cada aba é usada como cabeçalho. Os tipos de coluna (texto, número, data) são detectados automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
            <FileSpreadsheet className="h-4 w-4 text-ember" />
            <span className="clamp-1 flex-1 text-sm text-content">{nomeArquivo}</span>
            <button onClick={() => setAbas(null)} className="text-[12px] text-content-soft hover:text-content">
              Trocar
            </button>
          </div>

          {/* prévia das abas */}
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {abas.map((a, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-content-mute" />
                    <span className="text-sm font-medium text-content">{a.nome}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge>{a.colunas.length} colunas</Badge>
                    <Badge tone="ember">{a.linhas.length} linhas</Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.colunas.slice(0, 8).map((c, ci) => (
                    <span key={ci} className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-content-soft">
                      {c.nome} · {c.tipo}
                    </span>
                  ))}
                  {a.colunas.length > 8 && (
                    <span className="px-1 text-[11px] text-content-mute">+{a.colunas.length - 8}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* destino */}
          <div className="space-y-3 border-t border-line pt-4">
            <Label>Importar para</Label>
            <Select value={destino} onChange={(e) => setDestino(e.target.value as Destino)}>
              {podeNovoProjeto && <option value="novo">➕ Novo projeto</option>}
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
            {destino === "novo" && (
              <Field label="Nome do novo projeto">
                <Input value={nomeProjeto} onChange={(e) => setNomeProjeto(e.target.value)} placeholder="Ex.: Operação 2026" />
              </Field>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={importar} loading={enviando} disabled={!destino}>
              Importar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
