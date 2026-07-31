"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Projeto } from "@/lib/types";

const STORAGE_KEY = "domani-projeto-ativo";

export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from("projetos")
        .select("*")
        .order("created_at", { ascending: true });
      const list = (data as Projeto[]) ?? [];
      setProjetos(list);
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const initial = list.find((p) => p.id === saved)?.id ?? list[0]?.id ?? null;
      setProjetoId(initial);
      setLoading(false);
    }
    load();
  }, []);

  function selecionar(id: string) {
    setProjetoId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const projeto = projetos.find((p) => p.id === projetoId) ?? null;
  return { projetos, projeto, projetoId, selecionar, loading, setProjetos };
}
