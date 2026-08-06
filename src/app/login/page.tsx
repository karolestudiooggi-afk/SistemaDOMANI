"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { LogoVertical } from "@/components/logo";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useWsRouter } from "@/components/ui/ws-link";

type Modo = "login" | "esqueci";

export default function LoginPage() {
  const router = useWsRouter();
  const toast = useToast();
  const supabase = createClient();

  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar() {
    if (!email || !senha) return toast.error("Preencha email e senha");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setLoading(false);
    if (error) {
      const msg = /invalid login/i.test(error.message)
        ? "Email ou senha incorretos."
        : error.message;
      return toast.error("Não foi possível entrar", msg);
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function recuperar() {
    if (!email) return toast.error("Informe seu email para recuperar");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) return toast.error("Falha ao enviar", error.message);
    toast.success("Email enviado", "Se este email existir, você receberá um link para redefinir a senha.");
    setModo("login");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface p-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-ember/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoVertical height={104} className="mb-6" />
          <p className="text-sm text-content-soft">Planilhas colaborativas da sua equipe.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2 p-6 shadow-2xl">
          {modo === "login" ? (
            <div className="space-y-4">
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                  <Input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </Field>
              <Field label="Senha">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && entrar()}
                    className="pl-9"
                  />
                </div>
              </Field>

              <Button className="w-full" onClick={entrar} loading={loading}>
                Entrar <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                onClick={() => setModo("esqueci")}
                className="mx-auto block text-[13px] text-content-soft transition-colors hover:text-ember"
              >
                Esqueci minha senha
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg text-content">Recuperar acesso</h2>
                <p className="mt-1 text-[13px] text-content-soft">
                  Enviaremos um link de redefinição para o seu email.
                </p>
              </div>
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-mute" />
                  <Input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && recuperar()}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </Field>
              <Button className="w-full" onClick={recuperar} loading={loading}>
                Enviar link de recuperação
              </Button>
              <button
                onClick={() => setModo("login")}
                className="mx-auto flex items-center gap-1.5 text-[13px] text-content-soft transition-colors hover:text-content"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-content-mute">
          Sistema restrito. Os acessos são criados pelo administrador.
        </p>
      </div>
    </div>
  );
}
