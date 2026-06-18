"use client";

import { useState } from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Logo da marca. Usa public/logo.png (logo real da Infinite).
 * Se o arquivo não existir, cai num símbolo de infinito padrão.
 */
export function BrandLogo({ size = 36, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)]",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <InfinityIcon style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.5} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Infinite"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-xl object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
