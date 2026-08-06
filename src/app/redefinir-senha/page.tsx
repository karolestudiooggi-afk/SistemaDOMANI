"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { LogoVertical } from "@/components/logo";
import { Lock, Check } from "lucide-react";
import { useWsRouter } from "@/components/ui/ws-link";

export default function RedefinirSenhaPage() {
  const router = useWsRouter();
  const toast = useToast();
  const supabase = createClient();

  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // O link de recuperação cria uma sessão temporária (evento PASSWORD_RECOVERY).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setPronto(true);
    });
    // fallback: se já houver sessão, libera
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function salvar() {
    if (senha.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres");
    if (senha !== confirma) return toast.error("As senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) return toast.error("Não foi possível redefinir", error.message);
    toast.success("Senha redefinida", "Use a nova senha para entrar.");
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface p-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-ember/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex justify-center">
          <LogoVertical height={88} />
        </div>
        <div className="rounded-2xl border border-line bg-surface-2 p-6 shadow-2xl">
          <h1 className="font-display text-xl text-content">Definir nova senha</h1>
          <p className="mt-1 text-[13px] text-content-soft">
            {pronto ? "Escolha uma nova senha para sua conta." : "Validando seu link de recuperação…"}
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Nova senha">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9"
                  disabled={!pronto}
                  placeholder="••••••••"
                />
              </div>
            </Field>
            <Field label="Confirmar senha">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                <Input
                  type="password"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && salvar()}
                  className="pl-9"
                  disabled={!pronto}
                  placeholder="••••••••"
                />
              </div>
            </Field>
            <Button className="w-full" onClick={salvar} loading={loading} disabled={!pronto}>
              <Check className="h-4 w-4" /> Salvar nova senha
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
