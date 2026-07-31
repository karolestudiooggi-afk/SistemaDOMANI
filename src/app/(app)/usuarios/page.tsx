"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Label } from "@/components/ui/input";
import { Dialog, AlertDialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import type { Usuario, Projeto, Acesso, Role } from "@/lib/types";
import { PAPEIS, labelPapel } from "@/lib/utils";
import {
  UserPlus,
  KeyRound,
  ShieldCheck,
  Users as UsersIcon,
  Power,
  Copy,
  Check,
  FolderKanban,
  Plus,
  X,
} from "lucide-react";

export default function UsuariosPage() {
  const supabase = createClient();
  const toast = useToast();
  const { isSuperAdmin, loading: loadingPerfil } = usePerfil();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [novo, setNovo] = useState(false);
  const [gerenciar, setGerenciar] = useState<Usuario | null>(null);
  const [resetar, setResetar] = useState<Usuario | null>(null);
  const [desativar, setDesativar] = useState<Usuario | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [{ data: us }, { data: pr }, { data: ac }] = await Promise.all([
      supabase.from("usuarios").select("*").order("created_at"),
      supabase.from("projetos").select("*").order("nome"),
      supabase.from("acessos").select("*"),
    ]);
    setUsuarios((us as Usuario[]) ?? []);
    setProjetos((pr as Projeto[]) ?? []);
    setAcessos((ac as Acesso[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!loadingPerfil && !isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Usuários" />
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Acesso restrito"
          description="Apenas o administrador geral pode gerenciar usuários."
        />
      </div>
    );
  }

  async function criarUsuario(
    email: string,
    nome: string,
    senha: string,
    acessosNovos: { projeto_id: string; papel: Role }[]
  ) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("criarUsuario", {
      body: { email, nome, senha, acessos: acessosNovos },
    });
    setBusy(false);
    if (error || data?.error) return toast.error("Erro ao criar", data?.error ?? error?.message);
    const n = acessosNovos.length;
    toast.success(
      "Usuário criado",
      n ? `${email} já pode entrar e tem acesso a ${n} projeto(s).` : `${email} já pode entrar com a senha definida.`
    );
    setNovo(false);
    carregar();
  }

  async function resetarSenha(u: Usuario, modo: "email" | "senha", novaSenha?: string) {
    setBusy(true);
    const body =
      modo === "senha"
        ? { usuario_id: u.id, nova_senha: novaSenha }
        : { email: u.email, redirectTo: `${location.origin}/redefinir-senha` };
    const { data, error } = await supabase.functions.invoke("recuperarSenha", { body });
    setBusy(false);
    if (error || data?.error) return toast.error("Erro", data?.error ?? error?.message);
    toast.success(
      modo === "senha" ? "Senha redefinida" : "Email enviado",
      modo === "senha" ? "A nova senha já está ativa." : `Link enviado para ${u.email}.`
    );
    setResetar(null);
  }

  async function toggleAtivo(u: Usuario) {
    setBusy(true);
    const { error } = await supabase.from("usuarios").update({ ativo: !u.ativo }).eq("id", u.id);
    setBusy(false);
    if (error) return toast.error("Erro", error.message);
    toast.success(u.ativo ? "Usuário desativado" : "Usuário reativado");
    setDesativar(null);
    carregar();
  }

  async function salvarAcessos(u: Usuario, novos: { projeto_id: string; papel: Role }[], remover: string[]) {
    setBusy(true);
    const body = {
      conceder: novos.map((n) => ({ usuario_id: u.id, projeto_id: n.projeto_id, papel: n.papel })),
      revogar: remover,
    };
    const { data, error } = await supabase.functions.invoke("gerenciarAcessos", { body });
    setBusy(false);
    if (error || data?.error) return toast.error("Erro ao salvar acessos", data?.error ?? error?.message);
    toast.success("Acessos atualizados");
    setGerenciar(null);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Crie logins e defina quais projetos cada pessoa acessa."
        action={
          <Button onClick={() => setNovo(true)}>
            <UserPlus className="h-4 w-4" /> Novo usuário
          </Button>
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" />}
          title="Nenhum usuário ainda"
          description="Crie o primeiro login para dar acesso a alguém."
          action={<Button onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Criar usuário</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
          <div className="divide-y divide-line">
            {usuarios.map((u) => {
              const meus = acessos.filter((a) => a.usuario_id === u.id);
              return (
                <div key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.nome} email={u.email} url={u.avatar_url} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="clamp-1 text-sm font-medium text-content">{u.nome || u.email}</p>
                        {u.is_super_admin && <Badge tone="ember">Admin geral</Badge>}
                        {!u.ativo && <Badge tone="red">inativo</Badge>}
                      </div>
                      <p className="clamp-1 text-[12px] text-content-mute">{u.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.is_super_admin ? (
                          <span className="text-[11px] text-content-mute">Vê todos os projetos</span>
                        ) : meus.length ? (
                          meus.map((a) => {
                            const proj = projetos.find((p) => p.id === a.projeto_id);
                            return (
                              <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-content-soft">
                                {proj?.nome ?? "—"} · {labelPapel(a.papel)}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-content-mute">Sem acesso a projetos</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!u.is_super_admin && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setGerenciar(u)}>
                        <FolderKanban className="h-4 w-4" /> Acessos
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setResetar(u)}>
                        <KeyRound className="h-4 w-4" /> Senha
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDesativar(u)} title={u.ativo ? "Desativar" : "Reativar"}>
                        <Power className={`h-4 w-4 ${u.ativo ? "text-content-soft" : "text-emerald-400"}`} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {novo && <NovoUsuarioDialog projetos={projetos} onClose={() => setNovo(false)} onSave={criarUsuario} busy={busy} />}
      {gerenciar && (
        <AcessosSheet
          usuario={gerenciar}
          projetos={projetos}
          acessosAtuais={acessos.filter((a) => a.usuario_id === gerenciar.id)}
          onClose={() => setGerenciar(null)}
          onSave={salvarAcessos}
          busy={busy}
        />
      )}
      {resetar && (
        <ResetarSenhaDialog usuario={resetar} onClose={() => setResetar(null)} onReset={resetarSenha} busy={busy} />
      )}
      <AlertDialog
        open={!!desativar}
        onClose={() => setDesativar(null)}
        onConfirm={() => desativar && toggleAtivo(desativar)}
        title={desativar?.ativo ? "Desativar usuário?" : "Reativar usuário?"}
        description={
          desativar?.ativo
            ? `${desativar?.nome || desativar?.email} perderá o acesso imediatamente.`
            : `${desativar?.nome || desativar?.email} poderá entrar novamente.`
        }
        confirmLabel={desativar?.ativo ? "Desativar" : "Reativar"}
        danger={desativar?.ativo}
        loading={busy}
      />
    </div>
  );
}

function gerarSenha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "@1";
}

function NovoUsuarioDialog({
  projetos,
  onClose,
  onSave,
  busy,
}: {
  projetos: Projeto[];
  onClose: () => void;
  onSave: (email: string, nome: string, senha: string, acessos: { projeto_id: string; papel: Role }[]) => void;
  busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState(gerarSenha());
  const [copiado, setCopiado] = useState(false);
  // mapa projeto_id -> papel (ausente = sem acesso). "editor" (Colaborador) é o padrão.
  const [sel, setSel] = useState<Record<string, Role>>({});

  function copiar() {
    navigator.clipboard.writeText(senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  function toggleProjeto(id: string) {
    setSel((s) => {
      const novo = { ...s };
      if (novo[id]) delete novo[id];
      else novo[id] = "editor"; // Colaborador por padrão
      return novo;
    });
  }

  function acessosArray() {
    return Object.entries(sel).map(([projeto_id, papel]) => ({ projeto_id, papel }));
  }

  return (
    <Dialog open onClose={onClose} title="Novo usuário" className="max-w-lg">
      <div className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@empresa.com" autoFocus />
        </Field>
        <Field label="Nome (opcional)">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </Field>

        <div>
          <Label>Senha inicial</Label>
          <div className="flex gap-2">
            <Input value={senha} onChange={(e) => setSenha(e.target.value)} className="font-mono" />
            <Button variant="outline" size="icon" onClick={copiar} title="Copiar">
              {copiado ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSenha(gerarSenha())}>
              Gerar
            </Button>
          </div>
          <p className="mt-1.5 text-[12px] text-content-mute">
            Compartilhe essa senha com a pessoa. Ela pode trocá-la depois em Configurações.
          </p>
        </div>

        {/* Acesso a projetos */}
        <div className="border-t border-line pt-4">
          <Label>Acesso a projetos</Label>
          {projetos.length === 0 ? (
            <p className="mt-1 text-[13px] text-content-mute">
              Nenhum projeto criado ainda. Você pode conceder acesso depois, em cada usuário.
            </p>
          ) : (
            <div className="mt-1 max-h-56 space-y-2 overflow-y-auto pr-1">
              {projetos.map((p) => {
                const papel = sel[p.id];
                const ativo = !!papel;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 transition-colors ${ativo ? "border-ember/40 bg-ember/[0.06]" : "border-line bg-surface"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={() => toggleProjeto(p.id)}
                          className="h-4 w-4 shrink-0 accent-[#E56D23]"
                        />
                        <span className="clamp-1 text-sm text-content">{p.nome}</span>
                      </label>
                      {ativo && (
                        <div className="flex shrink-0 gap-1">
                          {PAPEIS.map((r) => (
                            <button
                              key={r.valor}
                              type="button"
                              onClick={() => setSel((s) => ({ ...s, [p.id]: r.valor }))}
                              title={r.descricao}
                              className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-all ${
                                papel === r.valor
                                  ? "border-ember/40 bg-ember/12 text-ember"
                                  : "border-line text-content-soft hover:bg-surface-2"
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[12px] text-content-mute">
            <span className="text-content-soft">Colaborador</span> usa, edita e exclui os dados.{" "}
            <span className="text-content-soft">Admin</span> também gerencia o projeto.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => email.trim() && senha.length >= 6 && onSave(email.trim(), nome.trim(), senha, acessosArray())}
          loading={busy}
          disabled={!email.trim() || senha.length < 6}
        >
          Criar acesso
        </Button>
      </div>
    </Dialog>
  );
}

function AcessosSheet({
  usuario,
  projetos,
  acessosAtuais,
  onClose,
  onSave,
  busy,
}: {
  usuario: Usuario;
  projetos: Projeto[];
  acessosAtuais: Acesso[];
  onClose: () => void;
  onSave: (u: Usuario, novos: { projeto_id: string; papel: Role }[], remover: string[]) => void;
  busy: boolean;
}) {
  // estado: mapa projeto_id -> papel | undefined (sem acesso)
  const inicial = useMemo(() => {
    const m: Record<string, Role | undefined> = {};
    acessosAtuais.forEach((a) => (m[a.projeto_id] = a.papel));
    return m;
  }, [acessosAtuais]);
  const [estado, setEstado] = useState<Record<string, Role | undefined>>(inicial);

  function set(projetoId: string, papel: Role | undefined) {
    setEstado((s) => ({ ...s, [projetoId]: papel }));
  }

  function salvar() {
    const novos: { projeto_id: string; papel: Role }[] = [];
    const remover: string[] = [];
    projetos.forEach((p) => {
      const antes = inicial[p.id];
      const agora = estado[p.id];
      if (agora && agora !== antes) novos.push({ projeto_id: p.id, papel: agora });
      if (!agora && antes) {
        const ac = acessosAtuais.find((a) => a.projeto_id === p.id);
        if (ac) remover.push(ac.id);
      }
    });
    onSave(usuario, novos, remover);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Acessos aos projetos"
      description={usuario.nome || usuario.email || ""}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} loading={busy}>Salvar acessos</Button>
        </div>
      }
    >
      {projetos.length === 0 ? (
        <p className="text-sm text-content-soft">Nenhum projeto criado ainda.</p>
      ) : (
        <div className="space-y-2">
          {projetos.map((p) => {
            const papel = estado[p.id];
            return (
              <div key={p.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ember/12 text-ember">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <span className="clamp-1 text-sm font-medium text-content">{p.nome}</span>
                  </div>
                  {papel ? (
                    <button
                      onClick={() => set(p.id, undefined)}
                      className="shrink-0 rounded-lg p-1.5 text-content-mute hover:text-red-400"
                      title="Remover acesso"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => set(p.id, "editor")}>
                      <Plus className="h-3.5 w-3.5" /> Dar acesso
                    </Button>
                  )}
                </div>
                {papel && (
                  <div className="mt-2.5 flex gap-1.5">
                    {PAPEIS.map((r) => (
                      <button
                        key={r.valor}
                        onClick={() => set(p.id, r.valor)}
                        title={r.descricao}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-medium transition-all ${
                          papel === r.valor
                            ? "border-ember/40 bg-ember/10 text-ember"
                            : "border-line text-content-soft hover:bg-surface-2"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function ResetarSenhaDialog({
  usuario,
  onClose,
  onReset,
  busy,
}: {
  usuario: Usuario;
  onClose: () => void;
  onReset: (u: Usuario, modo: "email" | "senha", novaSenha?: string) => void;
  busy: boolean;
}) {
  const [modo, setModo] = useState<"email" | "senha">("email");
  const [senha, setSenha] = useState(gerarSenha());

  return (
    <Dialog open onClose={onClose} title="Redefinir senha">
      <p className="mb-4 text-sm text-content-soft">
        Para <span className="text-content">{usuario.email}</span>
      </p>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        <button
          onClick={() => setModo("email")}
          className={`rounded-lg py-2 text-[13px] font-medium transition-all ${modo === "email" ? "bg-surface-3 text-content" : "text-content-soft"}`}
        >
          Enviar email
        </button>
        <button
          onClick={() => setModo("senha")}
          className={`rounded-lg py-2 text-[13px] font-medium transition-all ${modo === "senha" ? "bg-surface-3 text-content" : "text-content-soft"}`}
        >
          Definir agora
        </button>
      </div>

      {modo === "email" ? (
        <p className="text-sm text-content-soft">
          Enviaremos um link de redefinição para o email do usuário. Ele escolhe a nova senha.
        </p>
      ) : (
        <Field label="Nova senha">
          <div className="flex gap-2">
            <Input value={senha} onChange={(e) => setSenha(e.target.value)} className="font-mono" />
            <Button variant="outline" size="sm" onClick={() => setSenha(gerarSenha())}>Gerar</Button>
          </div>
        </Field>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => onReset(usuario, modo, senha)}
          loading={busy}
          disabled={modo === "senha" && senha.length < 6}
        >
          {modo === "email" ? "Enviar link" : "Definir senha"}
        </Button>
      </div>
    </Dialog>
  );
}
