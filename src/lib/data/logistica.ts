import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DateRange } from "@/lib/date-range";
import { linhaLabel, type Cor, type LoadingItem } from "@/lib/logistica";

export { LINHAS, CAMINHOES, linhaLabel } from "@/lib/logistica";
export type { Cor, LoadingItem } from "@/lib/logistica";

/** Itens carregados num dia + linha (para preencher/editar). */
export const getLoadingDay = cache(
  async (data: string, linha: string): Promise<LoadingItem[]> => {
    if (!isSupabaseConfigured) return [];
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("loading_entries")
      .select("caminhao, cor, movel, quantidade")
      .eq("data", data)
      .eq("linha", linha)
      .order("caminhao")
      .order("movel");
    return (rows ?? []).map((r) => ({
      caminhao: r.caminhao,
      cor: r.cor,
      movel: r.movel,
      quantidade: r.quantidade,
    }));
  },
);

/** Nomes de móveis já usados — para autocompletar. */
export const getMovelSuggestions = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("loading_entries")
    .select("movel")
    .order("movel")
    .limit(2000);
  return [...new Set((data ?? []).map((r) => r.movel))].sort((a, b) => a.localeCompare(b));
});

export type LoadingWeek = {
  total: number;
  totalBranco: number;
  totalPreto: number;
  dias: number;
  porLinha: { linha: string; label: string; total: number; branco: number; preto: number }[];
  porCaminhao: { caminhao: number; total: number }[];
  itens: { linha: string; caminhao: number; cor: Cor; movel: string; quantidade: number }[];
};

/** Consolida a semana (relatório de sexta para a qualidade conferir). */
export const getLoadingWeek = cache(async (range: DateRange): Promise<LoadingWeek> => {
  const vazio: LoadingWeek = {
    total: 0, totalBranco: 0, totalPreto: 0, dias: 0,
    porLinha: [], porCaminhao: [], itens: [],
  };
  if (!isSupabaseConfigured) return vazio;
  const supabase = await createClient();
  const { data } = await supabase
    .from("loading_entries")
    .select("data, linha, caminhao, cor, movel, quantidade")
    .gte("data", range.from)
    .lte("data", range.to);

  const rows = data ?? [];
  if (rows.length === 0) return vazio;

  const dias = new Set(rows.map((r) => r.data)).size;
  let totalBranco = 0;
  let totalPreto = 0;
  const linhaAgg = new Map<string, { total: number; branco: number; preto: number }>();
  const camAgg = new Map<number, number>();
  const itemAgg = new Map<string, { linha: string; caminhao: number; cor: Cor; movel: string; quantidade: number }>();

  for (const r of rows) {
    if (r.cor === "branco") totalBranco += r.quantidade;
    else totalPreto += r.quantidade;

    const la = linhaAgg.get(r.linha) ?? { total: 0, branco: 0, preto: 0 };
    la.total += r.quantidade;
    if (r.cor === "branco") la.branco += r.quantidade;
    else la.preto += r.quantidade;
    linhaAgg.set(r.linha, la);

    camAgg.set(r.caminhao, (camAgg.get(r.caminhao) ?? 0) + r.quantidade);

    const k = `${r.linha}|${r.caminhao}|${r.cor}|${r.movel}`;
    const it = itemAgg.get(k) ?? { linha: r.linha, caminhao: r.caminhao, cor: r.cor as Cor, movel: r.movel, quantidade: 0 };
    it.quantidade += r.quantidade;
    itemAgg.set(k, it);
  }

  return {
    total: totalBranco + totalPreto,
    totalBranco,
    totalPreto,
    dias,
    porLinha: [...linhaAgg.entries()]
      .map(([linha, v]) => ({ linha, label: linhaLabel(linha), ...v }))
      .sort((a, b) => b.total - a.total),
    porCaminhao: [...camAgg.entries()]
      .map(([caminhao, total]) => ({ caminhao, total }))
      .sort((a, b) => a.caminhao - b.caminhao),
    itens: [...itemAgg.values()].sort(
      (a, b) => a.linha.localeCompare(b.linha) || a.caminhao - b.caminhao || a.movel.localeCompare(b.movel),
    ),
  };
});
