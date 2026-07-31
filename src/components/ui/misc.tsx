"use client";

import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "green" | "red" | "blue";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-3 text-content-soft",
    ember: "bg-ember/12 text-ember",
    green: "bg-emerald-500/12 text-emerald-400",
    red: "bg-red-500/12 text-red-400",
    blue: "bg-blue-500/12 text-blue-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const roleTone: Record<Role, "ember" | "blue" | "neutral"> = {
  admin: "ember",
  editor: "blue",
  viewer: "neutral",
};
const roleLabel: Record<Role, string> = {
  admin: "Admin",
  editor: "Colaborador",
  viewer: "Visitante",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTone[role]}>{roleLabel[role]}</Badge>;
}

export function Avatar({
  name,
  email,
  url,
  size = 40,
}: {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name || "avatar"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-ember/15 font-semibold text-ember"
    >
      {initials(name, email)}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 px-6 text-center animate-fade-up">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-content-mute">
        {icon}
      </div>
      <h3 className="font-display text-lg text-content">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-content-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
