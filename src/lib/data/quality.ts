import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DateRange } from "@/lib/date-range";

export type NamedItem = { id: string; nome: string };
export type ReasonItem = { id: string; nome: string; categoryId: string };
export type CategoryItem = { id: string; nome: string; cor: string };

export type QualityCatalogs = {
  trucks: NamedItem[];
  clients: NamedItem[];
  products: { id: string; nome: string; custo: number }[];
  sectors: NamedItem[];
  employees: { id: string; nome: string; setorId: string | null }[];
  categories: CategoryItem[];
  reasons: ReasonItem[];
};

export const getQualityCatalogs = cache(async (): Promise<QualityCatalogs> => {
  const vazio: QualityCatalogs = {
    trucks: [], clients: [], products: [], sectors: [], employees: [], categories: [], reasons: [],
  };
  if (!isSupabaseConfigured) return vazio;
  const supabase = await createClient();

  const [tk, cl, pr, sc, em, cat, rs] = await Promise.all([
    supabase.from("trucks").select("id, identificador").eq("ativo", true).order("identificador"),
    supabase.from("clients").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("products").select("id, nome, custo_unitario").eq("ativo", true).order("nome"),
    supabase.from("sectors").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("employees").select("id, nome, setor_id").eq("ativo", true).order("nome"),
    supabase.from("return_categories").select("id, nome, cor").eq("ativo", true).order("ordem"),
    supabase.from("return_reasons").select("id, nome, category_id").eq("ativo", true).order("ordem"),
  ]);

  return {
    trucks: (tk.data ?? []).map((t) => ({ id: t.id, nome: t.identificador })),
    clients: (cl.data ?? []).map((c) => ({ id: c.id, nome: c.nome })),
    products: (pr.data ?? []).map((p) => ({ id: p.id, nome: p.nome, custo: p.custo_unitario ?? 0 })),
    sectors: (sc.data ?? []).map((s) => ({ id: s.id, nome: s.nome })),
    employees: (em.data ?? []).map((e) => ({ id: e.id, nome: e.nome, setorId: e.setor_id })),
    categories: (cat.data ?? []).map((c) => ({ id: c.id, nome: c.nome, cor: c.cor ?? "#2563eb" })),
    reasons: (rs.data ?? []).map((r) => ({ id: r.id, nome: r.nome, categoryId: r.category_id })),
  };
});

export type QualityDashboard = {
  retornos: number; // nº de ocorrências
  pecas: number; // soma quantidade
  producao: number; // produção no período (M1)
  percentRetorno: number; // pecas / producao
  valorPerdido: number;
  porCategoria: { categoria: string; cor: string; ocorrencias: number }[];
  porCaminhao: { nome: string; entregas: number; retornos: number; taxa: number }[];
  porFuncionario: { nome: string; producao: number; retornos: number; taxa: number }[];
  porSetor: { nome: string; producao: number; retornos: number; taxa: number }[];
  semVazio: boolean;
};

const ZERO: QualityDashboard = {
  retornos: 0, pecas: 0, producao: 0, percentRetorno: 0, valorPerdido: 0,
  porCategoria: [], porCaminhao: [], porFuncionario: [], porSetor: [], semVazio: true,
};

export const getQualityDashboard = cache(async (range: DateRange): Promise<QualityDashboard> => {
  if (!isSupabaseConfigured) return ZERO;
  const supabase = await createClient();

  const [retRes, prodRes, delRes, cats, reasons, prods, secs, emps, trucks] = await Promise.all([
    supabase
      .from("quality_returns")
      .select("quantidade_retornada, truck_id, setor_origem_id, funcionario_id, product_id, reason_id, valor_perdido")
      .gte("data_retorno", range.from)
      .lte("data_retorno", range.to),
    supabase
      .from("production_entries")
      .select("setor_id, funcionario_id, quantidade_produzida")
      .gte("data", range.from)
      .lte("data", range.to),
    supabase.from("deliveries").select("truck_id").gte("data", range.from).lte("data", range.to),
    supabase.from("return_categories").select("id, nome, cor"),
    supabase.from("return_reasons").select("id, category_id"),
    supabase.from("products").select("id, custo_unitario"),
    supabase.from("sectors").select("id, nome"),
    supabase.from("employees").select("id, nome"),
    supabase.from("trucks").select("id, identificador"),
  ]);

  const returns = retRes.data ?? [];
  const prod = prodRes.data ?? [];
  const dels = delRes.data ?? [];

  const catById = new Map((cats.data ?? []).map((c) => [c.id, c]));
  const reasonCat = new Map((reasons.data ?? []).map((r) => [r.id, r.category_id]));
  const custoById = new Map((prods.data ?? []).map((p) => [p.id, p.custo_unitario ?? 0]));
  const setorNome = new Map((secs.data ?? []).map((s) => [s.id, s.nome]));
  const funcNome = new Map((emps.data ?? []).map((e) => [e.id, e.nome]));
  const truckNome = new Map((trucks.data ?? []).map((t) => [t.id, t.identificador]));

  const pecas = returns.reduce((a, r) => a + r.quantidade_retornada, 0);
  const producao = prod.reduce((a, p) => a + p.quantidade_produzida, 0);
  const valorPerdido = returns.reduce(
    (a, r) => a + (r.valor_perdido ?? r.quantidade_retornada * (custoById.get(r.product_id ?? "") ?? 0)),
    0,
  );

  // por categoria
  const catAgg = new Map<string, number>();
  for (const r of returns) {
    const catId = r.reason_id ? reasonCat.get(r.reason_id) : null;
    const key = catId ?? "nao_classificado";
    catAgg.set(key, (catAgg.get(key) ?? 0) + 1);
  }
  const porCategoria = [...catAgg.entries()].map(([id, ocorrencias]) => {
    const c = catById.get(id);
    return { categoria: c?.nome ?? "Não classificado", cor: c?.cor ?? "#6b7280", ocorrencias };
  }).sort((a, b) => b.ocorrencias - a.ocorrencias);

  // por caminhão
  const retByTruck = new Map<string, number>();
  for (const r of returns) if (r.truck_id) retByTruck.set(r.truck_id, (retByTruck.get(r.truck_id) ?? 0) + 1);
  const delByTruck = new Map<string, number>();
  for (const d of dels) if (d.truck_id) delByTruck.set(d.truck_id, (delByTruck.get(d.truck_id) ?? 0) + 1);
  const truckIds = new Set([...retByTruck.keys(), ...delByTruck.keys()]);
  const porCaminhao = [...truckIds].map((id) => {
    const entregas = delByTruck.get(id) ?? 0;
    const retornos = retByTruck.get(id) ?? 0;
    return { nome: truckNome.get(id) ?? "—", entregas, retornos, taxa: entregas ? retornos / entregas : 0 };
  }).sort((a, b) => b.retornos - a.retornos);

  // por funcionário (retornos × produção)
  const retByFunc = new Map<string, number>();
  for (const r of returns) if (r.funcionario_id) retByFunc.set(r.funcionario_id, (retByFunc.get(r.funcionario_id) ?? 0) + r.quantidade_retornada);
  const prodByFunc = new Map<string, number>();
  for (const p of prod) if (p.funcionario_id) prodByFunc.set(p.funcionario_id, (prodByFunc.get(p.funcionario_id) ?? 0) + p.quantidade_produzida);
  const porFuncionario = [...retByFunc.entries()].map(([id, retornos]) => {
    const producaoF = prodByFunc.get(id) ?? 0;
    return { nome: funcNome.get(id) ?? "—", producao: producaoF, retornos, taxa: producaoF ? retornos / producaoF : 0 };
  }).sort((a, b) => b.taxa - a.taxa).slice(0, 10);

  // por setor
  const retBySetor = new Map<string, number>();
  for (const r of returns) if (r.setor_origem_id) retBySetor.set(r.setor_origem_id, (retBySetor.get(r.setor_origem_id) ?? 0) + r.quantidade_retornada);
  const prodBySetor = new Map<string, number>();
  for (const p of prod) if (p.setor_id) prodBySetor.set(p.setor_id, (prodBySetor.get(p.setor_id) ?? 0) + p.quantidade_produzida);
  const setorIds = new Set([...retBySetor.keys(), ...prodBySetor.keys()]);
  const porSetor = [...setorIds].map((id) => {
    const producaoS = prodBySetor.get(id) ?? 0;
    const retornos = retBySetor.get(id) ?? 0;
    return { nome: setorNome.get(id) ?? "—", producao: producaoS, retornos, taxa: producaoS ? retornos / producaoS : 0 };
  }).sort((a, b) => b.retornos - a.retornos);

  return {
    retornos: returns.length,
    pecas,
    producao,
    percentRetorno: producao ? pecas / producao : 0,
    valorPerdido,
    porCategoria,
    porCaminhao,
    porFuncionario,
    porSetor,
    semVazio: returns.length === 0,
  };
});
