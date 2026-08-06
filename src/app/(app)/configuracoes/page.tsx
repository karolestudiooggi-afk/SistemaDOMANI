"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Field, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Avatar, Badge } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import type { Preferencias } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  User,
  SlidersHorizontal,
  Plug,
  ShieldAlert,
  Upload,
  Check,
  Sun,
  Moon,
  Monitor,
  Database,
  RefreshCw,
} from "lucide-react";
import { useWsRouter } from "@/components/ui/ws-link";

type Tab = "perfil" | "preferencias" | "integracoes";

export default function ConfiguracoesPage() {
  const { perfil, loading, isSuperAdmin } = usePerfil();
  const [tab, setTab] = useState<Tab>("perfil");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "perfil", label: "Perfil", icon: <User className="h-4 w-4" /> },
    { id: "preferencias", label: "Preferências", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { id: "integracoes", label: "Integrações", icon: <Plug className="h-4 w-4" /> },
  ];

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Sua conta, preferências e conexões." />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "text-content" : "text-content-soft hover:text-content"
            )}
          >
            {t.icon}
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember" />}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="animate-fade-up">
          {tab === "perfil" && <PerfilTab />}
          {tab === "preferencias" && <PreferenciasTab />}
          {tab === "integracoes" && <IntegracoesTab admin={isSuperAdmin} />}
        </div>
      )}
    </div>
  );
}

function PerfilTab() {
  const supabase = createClient();
  const toast = useToast();
  const { perfil } = usePerfil();
  const router = useWsRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [desativar, setDesativar] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome ?? "");
      setAvatar(perfil.avatar_url);
    }
  }, [perfil]);

  async function upload(file: File) {
    if (!perfil) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${perfil.user_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      return toast.error("Erro no upload", error.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatar(data.publicUrl);
    setUploading(false);
    toast.success("Foto carregada", "Salve para confirmar.");
  }

  async function salvar() {
    if (!perfil) return;
    setSaving(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ nome, avatar_url: avatar })
      .eq("id", perfil.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar", error.message);
    toast.success("Perfil atualizado");
  }

  async function confirmarDesativar() {
    if (!perfil) return;
    setBusy(true);
    const { error } = await supabase.from("usuarios").update({ ativo: false }).eq("id", perfil.id);
    if (error) {
      setBusy(false);
      return toast.error("Erro", error.message);
    }
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-line bg-surface-2 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={nome} email={perfil?.email} url={avatar} size={72} />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ember text-white shadow-lg transition-transform hover:scale-105"
            >
              {uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </div>
          <div>
            <p className="font-display text-lg text-content">{nome || "Sem nome"}</p>
            <p className="text-sm text-content-soft">{perfil?.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={perfil?.email ?? ""} disabled className="opacity-60" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={salvar} loading={saving}>
              <Check className="h-4 w-4" /> Salvar alterações
            </Button>
          </div>
        </div>
      </div>

      {/* zona de perigo */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1">
            <h3 className="font-medium text-content">Desativar conta</h3>
            <p className="mt-1 text-sm text-content-soft">
              Sua conta será desativada e você perderá o acesso ao app. Um admin pode reativá-la depois.
            </p>
            <Button variant="danger" className="mt-4" onClick={() => setDesativar(true)}>
              Desativar minha conta
            </Button>
          </div>
        </div>
      </div>

      <Sheet
        open={desativar}
        onClose={() => setDesativar(false)}
        title="Desativar conta"
        description="Esta ação encerra sua sessão imediatamente."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDesativar(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmarDesativar} loading={busy}>
              Confirmar desativação
            </Button>
          </div>
        }
      >
        <p className="text-sm text-content-soft">
          Tem certeza de que deseja desativar sua conta? Você será desconectado e não poderá acessar
          projetos até que um administrador reative seu acesso.
        </p>
      </Sheet>
    </div>
  );
}

const TEMAS = [
  { id: "claro", label: "Claro", icon: <Sun className="h-4 w-4" /> },
  { id: "escuro", label: "Escuro", icon: <Moon className="h-4 w-4" /> },
  { id: "sistema", label: "Sistema", icon: <Monitor className="h-4 w-4" /> },
] as const;

const FONTES = [
  { id: "pequeno", label: "Pequeno", scale: "0.92" },
  { id: "medio", label: "Médio", scale: "1" },
  { id: "grande", label: "Grande", scale: "1.08" },
] as const;

function aplicarTema(tema: string) {
  const dark = tema === "escuro" || (tema === "sistema" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("light", !dark);
  localStorage.setItem("domani-tema", tema);
}
function aplicarFonte(f: string) {
  const scale = f === "pequeno" ? "0.92" : f === "grande" ? "1.08" : "1";
  document.documentElement.style.setProperty("--font-scale", scale);
  localStorage.setItem("domani-fonte", f);
}

function PreferenciasTab() {
  const supabase = createClient();
  const toast = useToast();
  const { perfil } = usePerfil();

  const [prefs, setPrefs] = useState<Preferencias>({
    tema: "sistema",
    tamanho_fonte: "medio",
    ordem_menus: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (perfil?.preferencias) setPrefs(perfil.preferencias);
  }, [perfil]);

  function setTema(tema: Preferencias["tema"]) {
    setPrefs((p) => ({ ...p, tema }));
    aplicarTema(tema);
  }
  function setFonte(tamanho_fonte: Preferencias["tamanho_fonte"]) {
    setPrefs((p) => ({ ...p, tamanho_fonte }));
    aplicarFonte(tamanho_fonte);
  }

  async function salvar() {
    if (!perfil) return;
    setSaving(true);
    const { error } = await supabase.from("usuarios").update({ preferencias: prefs }).eq("id", perfil.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar", error.message);
    toast.success("Preferências salvas");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-line bg-surface-2 p-6">
        <Label>Tema</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TEMAS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTema(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                prefs.tema === t.id
                  ? "border-ember/40 bg-ember/8 text-ember"
                  : "border-line text-content-soft hover:bg-surface-3"
              )}
            >
              {t.icon}
              <span className="text-[13px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        <Label className="mt-6">Tamanho da fonte</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FONTES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFonte(f.id)}
              className={cn(
                "rounded-xl border p-4 transition-all",
                prefs.tamanho_fonte === f.id
                  ? "border-ember/40 bg-ember/8 text-ember"
                  : "border-line text-content-soft hover:bg-surface-3"
              )}
            >
              <span style={{ fontSize: `calc(1rem * ${f.scale})` }} className="font-medium">
                Aa
              </span>
              <span className="mt-1 block text-[13px]">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={salvar} loading={saving}>
            <Check className="h-4 w-4" /> Salvar preferências
          </Button>
        </div>
      </div>
    </div>
  );
}

function IntegracoesTab({ admin }: { admin: boolean }) {
  const supabase = createClient();
  const toast = useToast();
  const [status, setStatus] = useState<"ok" | "checking" | "erro">("checking");

  async function checar() {
    setStatus("checking");
    const { error } = await supabase.from("projetos").select("id").limit(1);
    setStatus(error ? "erro" : "ok");
  }

  useEffect(() => {
    checar();
  }, []);

  const dot = { ok: "bg-emerald-400", checking: "bg-ember animate-ember-pulse", erro: "bg-red-400" };
  const txt = { ok: "Conectado", checking: "Verificando…", erro: "Falha na conexão" };

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-line bg-surface-2 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-content">Supabase</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", dot[status])} />
                <span className="text-[13px] text-content-soft">{txt[status]}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={checar}>
            <RefreshCw className="h-4 w-4" /> Reconectar
          </Button>
        </div>

        <div className="mt-5 space-y-2 border-t border-line pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-soft">Banco de dados</span>
            <Badge tone="green">Ativo</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-soft">Autenticação</span>
            <Badge tone="green">Ativo</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-soft">Storage (avatars)</span>
            <Badge tone="green">Ativo</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-soft">Realtime</span>
            <Badge tone="green">Ativo</Badge>
          </div>
        </div>
      </div>

      {admin && (
        <div className="rounded-2xl border border-line bg-surface-2 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember/12 text-ember">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-content">Gerenciamento de acessos</p>
              <p className="text-[13px] text-content-soft">
                Como admin geral, você cria logins e define acessos na tela Usuários.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
