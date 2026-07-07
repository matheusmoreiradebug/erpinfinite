import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DateRange } from "@/lib/date-range";

export type ReturnStatus = "registrado" | "em_analise" | "classificado" | "resolvido";

export type ReturnRow = {
  id: string;
  data: string;
  hora: string | null;
  pedido: string | null;
  quantidade: number;
  status: ReturnStatus;
  truck: string;
  client: string;
  clientId: string | null;
  setorId: string | null;
  setor: string;
  funcionarioId: string | null;
  funcionario: string;
  product: string;
  productId: string | null;
  motivoInicial: string | null;
  observacao: string | null;
  categoria: string | null;
  motivo: string | null;
  reasonId: string | null;
  valorPerdido: number | null;
  fotosPaths: string[];
  // ficha de análise
  gravidade: string | null;
  destino: string | null;
  responsabilidade: string | null;
  analise: string | null;
  acaoPreventiva: string | null;
};

export type ReturnFilters = {
  range?: DateRange;
  status?: ReturnStatus[];
  setorId?: string;
  funcionarioId?: string;
  truckId?: string;
  clientId?: string;
  categoryId?: string;
  registradoPor?: string;
};

export const getReturnsList = cache(async (filters: ReturnFilters = {}): Promise<ReturnRow[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();

  let q = supabase
    .from("quality_returns")
    .select(
      "id, data_retorno, hora_retorno, pedido, quantidade_retornada, status, truck_id, client_id, setor_origem_id, funcionario_id, product_id, motivo_inicial, observacao, reason_id, valor_perdido, gravidade, destino, responsabilidade, analise, acao_preventiva",
    )
    .order("data_retorno", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.range) q = q.gte("data_retorno", filters.range.from).lte("data_retorno", filters.range.to);
  if (filters.status?.length) q = q.in("status", filters.status);
  if (filters.registradoPor) q = q.eq("registrado_por", filters.registradoPor);
  if (filters.setorId) q = q.eq("setor_origem_id", filters.setorId);
  if (filters.funcionarioId) q = q.eq("funcionario_id", filters.funcionarioId);
  if (filters.truckId) q = q.eq("truck_id", filters.truckId);
  if (filters.clientId) q = q.eq("client_id", filters.clientId);

  const [retRes, trucks, clients, prods, secs, emps, reasons, cats] = await Promise.all([
    q.limit(500),
    supabase.from("trucks").select("id, identificador"),
    supabase.from("clients").select("id, nome"),
    supabase.from("products").select("id, nome"),
    supabase.from("sectors").select("id, nome"),
    supabase.from("employees").select("id, nome"),
    supabase.from("return_reasons").select("id, nome, category_id"),
    supabase.from("return_categories").select("id, nome"),
  ]);

  let rows = retRes.data ?? [];
  const truckNome = new Map((trucks.data ?? []).map((t) => [t.id, t.identificador]));
  const clientNome = new Map((clients.data ?? []).map((c) => [c.id, c.nome]));
  const prodNome = new Map((prods.data ?? []).map((p) => [p.id, p.nome]));
  const setorNome = new Map((secs.data ?? []).map((s) => [s.id, s.nome]));
  const funcNome = new Map((emps.data ?? []).map((e) => [e.id, e.nome]));
  const reasonInfo = new Map((reasons.data ?? []).map((r) => [r.id, r]));
  const catNome = new Map((cats.data ?? []).map((c) => [c.id, c.nome]));

  if (filters.categoryId) {
    rows = rows.filter((r) => {
      const cat = r.reason_id ? reasonInfo.get(r.reason_id)?.category_id : null;
      return cat === filters.categoryId;
    });
  }

  // fotos das devoluções listadas
  const ids = rows.map((r) => r.id);
  const fotosByReturn = new Map<string, string[]>();
  if (ids.length) {
    const { data: ph } = await supabase
      .from("return_photos")
      .select("return_id, storage_path")
      .in("return_id", ids);
    for (const p of ph ?? []) {
      const arr = fotosByReturn.get(p.return_id) ?? [];
      arr.push(p.storage_path);
      fotosByReturn.set(p.return_id, arr);
    }
  }

  return rows.map((r) => {
    const reason = r.reason_id ? reasonInfo.get(r.reason_id) : null;
    return {
      id: r.id,
      data: r.data_retorno,
      hora: r.hora_retorno,
      pedido: r.pedido,
      quantidade: r.quantidade_retornada,
      status: r.status as ReturnStatus,
      truck: r.truck_id ? (truckNome.get(r.truck_id) ?? "—") : "—",
      client: r.client_id ? (clientNome.get(r.client_id) ?? "—") : "—",
      clientId: r.client_id,
      setorId: r.setor_origem_id,
      setor: r.setor_origem_id ? (setorNome.get(r.setor_origem_id) ?? "—") : "—",
      funcionarioId: r.funcionario_id,
      funcionario: r.funcionario_id ? (funcNome.get(r.funcionario_id) ?? "—") : "—",
      product: r.product_id ? (prodNome.get(r.product_id) ?? "—") : "—",
      productId: r.product_id,
      motivoInicial: r.motivo_inicial,
      observacao: r.observacao,
      categoria: reason ? (catNome.get(reason.category_id) ?? null) : null,
      motivo: reason?.nome ?? null,
      reasonId: r.reason_id,
      valorPerdido: r.valor_perdido,
      fotosPaths: fotosByReturn.get(r.id) ?? [],
      gravidade: r.gravidade,
      destino: r.destino,
      responsabilidade: r.responsabilidade,
      analise: r.analise,
      acaoPreventiva: r.acao_preventiva,
    };
  });
});

/** Reincidência: nº de retornos por produto e por cliente nos últimos ~120 dias. */
export type Recurrence = { byProduct: Record<string, number>; byClient: Record<string, number> };

export const getReturnRecurrence = cache(async (): Promise<Recurrence> => {
  const empty: Recurrence = { byProduct: {}, byClient: {} };
  if (!isSupabaseConfigured) return empty;
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const { data } = await supabase
    .from("quality_returns")
    .select("product_id, client_id")
    .gte("data_retorno", since.toISOString().slice(0, 10));
  const byProduct: Record<string, number> = {};
  const byClient: Record<string, number> = {};
  for (const r of data ?? []) {
    if (r.product_id) byProduct[r.product_id] = (byProduct[r.product_id] ?? 0) + 1;
    if (r.client_id) byClient[r.client_id] = (byClient[r.client_id] ?? 0) + 1;
  }
  return { byProduct, byClient };
});

export type EmployeePerformance = {
  id: string;
  nome: string;
  setor: string;
  producao: number;
  dias: number;
  media: number;
  retornos: number; // peças retornadas
  ocorrencias: number; // nº de devoluções
  taxaRetorno: number; // retornos / produção
  valorPerdido: number;
};

/** Desempenho por funcionário no período: produção × retornos. */
export const getEmployeePerformance = cache(
  async (range: DateRange, setorId?: string): Promise<EmployeePerformance[]> => {
    if (!isSupabaseConfigured) return [];
    const supabase = await createClient();

    const [prodRes, retRes, emps, secs] = await Promise.all([
      supabase
        .from("production_entries")
        .select("funcionario_id, quantidade_produzida, data")
        .gte("data", range.from)
        .lte("data", range.to),
      supabase
        .from("quality_returns")
        .select("funcionario_id, quantidade_retornada, valor_perdido")
        .gte("data_retorno", range.from)
        .lte("data_retorno", range.to),
      supabase.from("employees").select("id, nome, setor_id, ativo"),
      supabase.from("sectors").select("id, nome"),
    ]);

    const setorNome = new Map((secs.data ?? []).map((s) => [s.id, s.nome]));
    const empById = new Map((emps.data ?? []).map((e) => [e.id, e]));

    type Agg = { producao: number; dias: Set<string>; retornos: number; ocorrencias: number; valor: number };
    const agg = new Map<string, Agg>();
    const get = (id: string) =>
      agg.get(id) ?? agg.set(id, { producao: 0, dias: new Set(), retornos: 0, ocorrencias: 0, valor: 0 }).get(id)!;

    for (const p of prodRes.data ?? []) {
      if (!p.funcionario_id) continue;
      const a = get(p.funcionario_id);
      a.producao += p.quantidade_produzida;
      a.dias.add(p.data);
    }
    for (const r of retRes.data ?? []) {
      if (!r.funcionario_id) continue;
      const a = get(r.funcionario_id);
      a.retornos += r.quantidade_retornada;
      a.ocorrencias += 1;
      a.valor += r.valor_perdido ?? 0;
    }

    return [...agg.entries()]
      .filter(([id]) => !setorId || empById.get(id)?.setor_id === setorId)
      .map(([id, a]) => {
        const emp = empById.get(id);
        return {
          id,
          nome: emp?.nome ?? "—",
          setor: emp?.setor_id ? (setorNome.get(emp.setor_id) ?? "—") : "—",
          producao: a.producao,
          dias: a.dias.size,
          media: a.dias.size ? Math.round((a.producao / a.dias.size) * 10) / 10 : 0,
          retornos: a.retornos,
          ocorrencias: a.ocorrencias,
          taxaRetorno: a.producao ? a.retornos / a.producao : 0,
          valorPerdido: a.valor,
        };
      })
      .sort((x, y) => y.producao - x.producao);
  },
);

/** Gera URLs assinadas (bucket privado) para os caminhos de foto. */
export async function signPhotos(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length || !isSupabaseConfigured) return {};
  const admin = createAdminClient();
  const { data } = await admin.storage.from("avarias").createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  }
  return map;
}

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

export type ManageCatalogs = {
  trucks: { id: string; identificador: string; placa: string | null; motorista: string | null; ativo: boolean }[];
  clients: { id: string; nome: string; cidade: string | null; ativo: boolean }[];
  products: { id: string; nome: string; sku: string | null; custo_unitario: number | null; ativo: boolean }[];
  categories: { id: string; nome: string; cor: string | null; ativo: boolean }[];
  reasons: { id: string; nome: string; category_id: string; ativo: boolean }[];
};

/** Todos os cadastros (inclui inativos) — para as telas de gerenciamento. */
export const getCatalogsForManage = cache(async (): Promise<ManageCatalogs> => {
  const vazio: ManageCatalogs = { trucks: [], clients: [], products: [], categories: [], reasons: [] };
  if (!isSupabaseConfigured) return vazio;
  const supabase = await createClient();
  const [tk, cl, pr, cat, rs] = await Promise.all([
    supabase.from("trucks").select("id, identificador, placa, motorista, ativo").order("ativo", { ascending: false }).order("identificador"),
    supabase.from("clients").select("id, nome, cidade, ativo").order("ativo", { ascending: false }).order("nome"),
    supabase.from("products").select("id, nome, sku, custo_unitario, ativo").order("ativo", { ascending: false }).order("nome"),
    supabase.from("return_categories").select("id, nome, cor, ativo").order("ordem"),
    supabase.from("return_reasons").select("id, nome, category_id, ativo").order("ordem"),
  ]);
  return {
    trucks: tk.data ?? [],
    clients: cl.data ?? [],
    products: pr.data ?? [],
    categories: cat.data ?? [],
    reasons: rs.data ?? [],
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
    supabase.from("sectors").select("id, nome, tipo_producao"),
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
  // setores que medem por chapa não entram no % de retorno (taxa é sobre peças)
  const chapaSet = new Set((secs.data ?? []).filter((s) => s.tipo_producao === "chapa").map((s) => s.id));
  const funcNome = new Map((emps.data ?? []).map((e) => [e.id, e.nome]));
  const truckNome = new Map((trucks.data ?? []).map((t) => [t.id, t.identificador]));

  const pecas = returns.reduce((a, r) => a + r.quantidade_retornada, 0);
  // produção em PEÇAS apenas (exclui chapas) — base correta do % de retorno
  const producao = prod
    .filter((p) => !chapaSet.has(p.setor_id))
    .reduce((a, p) => a + p.quantidade_produzida, 0);
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
  const porSetor = [...setorIds].filter((id) => !chapaSet.has(id)).map((id) => {
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

// ---------------------------------------------------------------------------
// Perdas com frete de retorno (o motorista cobra a volta = prejuízo)
// ---------------------------------------------------------------------------
export type FreteDashboard = {
  total: number;
  ocorrencias: number;
  ticketMedio: number;
  perdaTotal: number; // cenário perda_total
  remarcacao: number; // cenário remarcacao
  porCliente: { nome: string; total: number; count: number }[];
  porMotorista: { nome: string; total: number; count: number }[];
  porMes: { mes: string; total: number }[];
  recentes: { id: string; data: string; cliente: string; valor: number; cenario: string | null; motorista: string | null; pedido: string | null }[];
  semVazio: boolean;
};

const FRETE_ZERO: FreteDashboard = {
  total: 0, ocorrencias: 0, ticketMedio: 0, perdaTotal: 0, remarcacao: 0,
  porCliente: [], porMotorista: [], porMes: [], recentes: [], semVazio: true,
};

export const getFreteDashboard = cache(async (range: DateRange): Promise<FreteDashboard> => {
  if (!isSupabaseConfigured) return FRETE_ZERO;
  const supabase = await createClient();

  const [retRes, cliRes] = await Promise.all([
    supabase
      .from("quality_returns")
      .select("id, data_retorno, frete_valor, frete_cenario, frete_motorista, client_id, pedido")
      .not("frete_valor", "is", null)
      .gte("data_retorno", range.from)
      .lte("data_retorno", range.to)
      .order("data_retorno", { ascending: false }),
    supabase.from("clients").select("id, nome"),
  ]);

  const rows = (retRes.data ?? []).filter((r) => (r.frete_valor ?? 0) > 0);
  if (!rows.length) return { ...FRETE_ZERO, semVazio: true };
  const cliNome = new Map((cliRes.data ?? []).map((c) => [c.id, c.nome]));

  let total = 0, perdaTotal = 0, remarcacao = 0;
  const porCli = new Map<string, { total: number; count: number }>();
  const porMot = new Map<string, { total: number; count: number }>();
  const porMes = new Map<string, number>();

  for (const r of rows) {
    const v = Number(r.frete_valor) || 0;
    total += v;
    if (r.frete_cenario === "perda_total") perdaTotal += v;
    else if (r.frete_cenario === "remarcacao") remarcacao += v;

    const cli = r.client_id ? (cliNome.get(r.client_id) ?? "—") : "—";
    const c = porCli.get(cli) ?? { total: 0, count: 0 };
    c.total += v; c.count++; porCli.set(cli, c);

    const mot = (r.frete_motorista ?? "").trim() || "—";
    const m = porMot.get(mot) ?? { total: 0, count: 0 };
    m.total += v; m.count++; porMot.set(mot, m);

    const mes = r.data_retorno.slice(0, 7); // YYYY-MM
    porMes.set(mes, (porMes.get(mes) ?? 0) + v);
  }

  return {
    total,
    ocorrencias: rows.length,
    ticketMedio: total / rows.length,
    perdaTotal,
    remarcacao,
    porCliente: [...porCli.entries()].map(([nome, x]) => ({ nome, ...x })).sort((a, b) => b.total - a.total).slice(0, 12),
    porMotorista: [...porMot.entries()].map(([nome, x]) => ({ nome, ...x })).sort((a, b) => b.total - a.total).slice(0, 12),
    porMes: [...porMes.entries()].map(([mes, total2]) => ({ mes, total: total2 })).sort((a, b) => a.mes.localeCompare(b.mes)),
    recentes: rows.slice(0, 15).map((r) => ({
      id: r.id,
      data: r.data_retorno,
      cliente: r.client_id ? (cliNome.get(r.client_id) ?? "—") : "—",
      valor: Number(r.frete_valor) || 0,
      cenario: r.frete_cenario,
      motorista: r.frete_motorista,
      pedido: r.pedido,
    })),
    semVazio: false,
  };
});
