/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Marca Domani — usa o arquivo oficial (wordmark vertical "Do/ma/ni.AI").
 * O ícone quadrado mostra a logo branca sobre o chumbo da marca.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden rounded-xl bg-ink", className)}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-vertical-white.png"
        alt="Domani"
        style={{ height: size * 0.62, width: "auto" }}
        className="object-contain"
      />
    </div>
  );
}

/** Logo vertical completa (para telas de destaque, ex.: login). */
export function LogoVertical({ height = 96, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/logo-vertical-white.png"
      alt="Domani.AI"
      style={{ height }}
      className={cn("object-contain", className)}
    />
  );
}

/** Wordmark horizontal para a sidebar: ícone + "domani." */
export function LogoWord({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={30} />
      <span className="font-display text-xl tracking-tight text-content">
        domani<span className="text-ember">.</span>
      </span>
    </div>
  );
}
