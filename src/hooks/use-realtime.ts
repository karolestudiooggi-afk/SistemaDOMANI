"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Assina mudanças em uma tabela e dispara callback a cada evento.
 * Usado para colaboração instantânea (linhas, abas, projetos).
 */
export function useRealtime(
  table: string,
  onChange: () => void,
  filter?: { column: string; value: string }
) {
  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime:${table}:${filter?.value ?? "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter?.column, filter?.value]);
}
