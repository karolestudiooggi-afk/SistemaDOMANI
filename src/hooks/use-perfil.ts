"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario, Acesso } from "@/lib/types";

export function usePerfil() {
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      const [{ data: p }, { data: ac }] = await Promise.all([
        supabase.from("usuarios").select("*").eq("user_id", user.id).single(),
        supabase.from("acessos").select("*"),
      ]);
      if (active) {
        setPerfil(p as Usuario | null);
        setAcessos((ac as Acesso[]) ?? []);
        setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = !!perfil?.is_super_admin;

  // papel efetivo do usuário num projeto (super-admin => admin em tudo)
  function papelNoProjeto(projetoId: string | null | undefined): "admin" | "editor" | "viewer" | null {
    if (!projetoId) return null;
    if (isSuperAdmin) return "admin";
    const a = acessos.find((x) => x.projeto_id === projetoId);
    return a?.papel ?? null;
  }
  function podeEditar(projetoId: string | null | undefined): boolean {
    const p = papelNoProjeto(projetoId);
    return p === "admin" || p === "editor";
  }

  return {
    perfil,
    acessos,
    loading,
    isSuperAdmin,
    papelNoProjeto,
    podeEditar,
    refresh: () => location.reload(),
  };
}
