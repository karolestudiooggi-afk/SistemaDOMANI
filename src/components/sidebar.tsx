"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Table2,
  FolderKanban,
  Users,
  ListOrdered,
  History,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { WsLink, useWsRouter } from "@/components/ui/ws-link";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planilha", label: "Planilha", icon: Table2 },
  { href: "/projetos", label: "Projetos", icon: FolderKanban, admin: true },
  { href: "/usuarios", label: "Usuários", icon: Users, admin: true },
  { href: "/abas", label: "Organizar abas", icon: ListOrdered },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useWsRouter();
  const { perfil, isSuperAdmin } = usePerfil();
  const [open, setOpen] = useState(false);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = nav.filter((n) => !n.admin || isSuperAdmin);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex justify-center px-5 py-6">
        <LogoMark size={48} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <WsLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-ember/12 text-ember"
                  : "text-content-soft hover:bg-surface-2 hover:text-content"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] transition-transform", active && "scale-110")} />
              {item.label}
            </WsLink>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={perfil?.nome} email={perfil?.email} url={perfil?.avatar_url} size={36} />
          <div className="min-w-0 flex-1">
            <p className="clamp-1 text-sm font-medium text-content">
              {perfil?.nome || perfil?.email || "Carregando…"}
            </p>
            <div className="mt-0.5">
              {perfil && (
                <Badge tone={isSuperAdmin ? "ember" : "neutral"}>
                  {isSuperAdmin ? "Admin geral" : "Membro"}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="shrink-0 rounded-lg p-2 text-content-mute transition-colors hover:bg-surface-2 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <LogoMark size={30} />
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-content-soft hover:bg-surface-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-dvh">{content}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in-right border-r border-line bg-surface">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-content-mute hover:bg-surface-2"
            >
              <X className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
