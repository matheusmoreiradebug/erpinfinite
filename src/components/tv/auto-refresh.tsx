"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Recarrega os dados do servidor em intervalo fixo (painel da TV). */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  const [hora, setHora] = useState("");

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const clock = setInterval(tick, 1000);
    const refresh = setInterval(() => router.refresh(), seconds * 1000);
    return () => {
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [router, seconds]);

  return <span className="tabular-nums">{hora}</span>;
}
