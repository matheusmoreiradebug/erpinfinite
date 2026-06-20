import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type DateRange, monthRange } from "@/lib/date-range";
import * as mock from "@/lib/mock-data";

export type SectorDTO = {
  id: string;
  nome: string;
  metaIndividual: number;
  metaMensal: number | null;
  cor: string;
  ativo: boolean;
};

export type EmployeeDTO = {
  id: string;
  nome: string;
  setorId: string | null;
  dataAdmissao: string | null;
  ativo: boolean;
};

export type DashboardKpis = {
  producao: number;
  meta: number;
  aproveitamento: number;
  funcionariosAtivos: number;
  setoresAtivos: number;
  diasProduzidos: number;
  mediaDia: number;
  melhorDia: { data: string; valor: number } | null;
};

export type DashboardData = {
  kpis: DashboardKpis;
  dailyProduction: { data: string; producao: number; meta: number }[];
  sectorProduction: { setor: string; producao: number; meta: number }[];
  ranking: { nome: string; setor: string; total: number; media: number }[];
  alerts: mock.Alert[];
  insights: mock.Insight[];
  fromMock: boolean;
};

/** KPIs do mock recalculados no formato por período (modo demonstração). */
function mockKpis(): DashboardKpis {
  const producao = mock.dailyProduction.reduce((a, d) => a + d.producao, 0);
  const meta = mock.dailyProduction.reduce((a, d) => a + d.meta, 0);
  const melhor = [...mock.dailyProduction].sort((a, b) => b.producao - a.producao)[0];
  return {
    producao,
    meta,
    aproveitamento: meta ? producao / meta : 0,
    funcionariosAtivos: mock.kpis.funcionariosAtivos,
    setoresAtivos: mock.kpis.setoresAtivos,
    diasProduzidos: mock.dailyProduction.length,
    mediaDia: Math.round(producao / mock.dailyProduction.length),
    melhorDia: melhor ? { data: melhor.data, valor: melhor.producao } : null,
  };
}

const ddmm = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

const toSectorDTO = (s: {
  id: string;
  nome: string;
  meta_diaria_funcionario: number;
  meta_mensal: number | null;
  cor: string | null;
  ativo: boolean;
}): SectorDTO => ({
  id: s.id,
  nome: s.nome,
  metaIndividual: s.meta_diaria_funcionario,
  metaMensal: s.meta_mensal,
  cor: s.cor ?? "#2563eb",
  ativo: s.ativo,
});

const mockSectors = (): SectorDTO[] => mock.sectors.map((s) => ({ ...s, metaMensal: null }));
const mockEmployees = (): EmployeeDTO[] =>
  mock.employees.map((e) => ({ ...e, dataAdmissao: null }));

/** Setores ativos. Deduplicado por requisição com cache(). */
export const getSectors = cache(async (): Promise<SectorDTO[]> => {
  if (!isSupabaseConfigured) return mockSectors();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectors")
    .select("id, nome, meta_diaria_funcionario, meta_mensal, cor, ativo")
    .eq("ativo", true)
    .order("nome");
  if (error || !data) return mockSectors();
  return data.map(toSectorDTO);
});

/** Data (ISO) do lançamento de produção mais recente — usado na TV. */
export const getLatestProductionDate = cache(async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return mock.dailyProduction.length ? "2026-06-16" : null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("production_entries")
    .select("data")
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.data ?? null;
});

/** Todos os setores (inclui inativos) — para a tela de gerenciamento. */
export const getAllSectors = cache(async (): Promise<SectorDTO[]> => {
  if (!isSupabaseConfigured) return mockSectors();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectors")
    .select("id, nome, meta_diaria_funcionario, meta_mensal, cor, ativo")
    .order("ativo", { ascending: false })
    .order("nome");
  if (error || !data) return mockSectors();
  return data.map(toSectorDTO);
});

/** Funcionários (todos, inclui inativos). Deduplicado por requisição. */
export const getEmployees = cache(async (): Promise<EmployeeDTO[]> => {
  if (!isSupabaseConfigured) return mockEmployees();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, nome, setor_id, data_admissao, ativo")
    .order("ativo", { ascending: false })
    .order("nome");
  if (error || !data) return mockEmployees();
  return data.map((e) => ({
    id: e.id,
    nome: e.nome,
    setorId: e.setor_id,
    dataAdmissao: e.data_admissao,
    ativo: e.ativo,
  }));
});

/**
 * Dados consolidados do dashboard. Busca a produção crua e calcula as métricas
 * em um único lugar (dataset pequeno; evita várias idas ao banco).
 */
export const getDashboardData = cache(async (range: DateRange): Promise<DashboardData> => {
  if (!isSupabaseConfigured) {
    return {
      kpis: mockKpis(),
      dailyProduction: mock.dailyProduction,
      sectorProduction: mock.sectorProduction,
      ranking: mock.ranking,
      alerts: mock.alerts,
      insights: mock.insights,
      fromMock: true,
    };
  }

  const supabase = await createClient();
  const [sectors, employees, entriesRes, insightsRes] = await Promise.all([
    getSectors(),
    getEmployees(),
    supabase
      .from("production_entries")
      .select("funcionario_id, setor_id, data, quantidade_produzida")
      .gte("data", range.from)
      .lte("data", range.to),
    supabase
      .from("ai_insights")
      .select("id, severidade, titulo, conteudo")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const entries = entriesRes.data ?? [];
  const sectorById = new Map(sectors.map((s) => [s.id, s]));
  const empById = new Map(employees.map((e) => [e.id, e]));

  // já filtrado no banco pelo período
  const monthEntries = entries;

  // --- produção diária (soma por dia) ---
  const byDay = new Map<string, { prod: number; metaFuncs: Set<string>; heads: Set<string> }>();
  const headsBySectorDay = new Map<string, Set<string>>();
  for (const e of monthEntries) {
    const day = byDay.get(e.data) ?? { prod: 0, metaFuncs: new Set(), heads: new Set() };
    day.prod += e.quantidade_produzida;
    day.heads.add(e.funcionario_id);
    byDay.set(e.data, day);
    const k = `${e.data}|${e.setor_id}`;
    const set = headsBySectorDay.get(k) ?? new Set();
    set.add(e.funcionario_id);
    headsBySectorDay.set(k, set);
  }
  const dailyProduction = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, v]) => {
      // meta do dia = soma, por setor, de (headcount no setor × meta individual)
      let meta = 0;
      for (const [k, heads] of headsBySectorDay) {
        if (k.startsWith(`${data}|`)) {
          const setorId = k.split("|")[1];
          meta += heads.size * (sectorById.get(setorId)?.metaIndividual ?? 0);
        }
      }
      return { data: ddmm(data), producao: v.prod, meta };
    });

  // --- produção por setor (mês) ---
  const sectorAgg = new Map<string, { prod: number; meta: number }>();
  for (const [k, heads] of headsBySectorDay) {
    const setorId = k.split("|")[1];
    const s = sectorById.get(setorId);
    if (!s) continue;
    const cur = sectorAgg.get(setorId) ?? { prod: 0, meta: 0 };
    cur.meta += heads.size * s.metaIndividual;
    sectorAgg.set(setorId, cur);
  }
  for (const e of monthEntries) {
    const cur = sectorAgg.get(e.setor_id);
    if (cur) cur.prod += e.quantidade_produzida;
  }
  const sectorProduction = [...sectorAgg.entries()]
    .map(([id, v]) => ({ setor: sectorById.get(id)?.nome ?? "—", producao: v.prod, meta: v.meta }))
    .sort((a, b) => b.producao - a.producao);

  // --- ranking de funcionários (mês) ---
  const empAgg = new Map<string, { total: number; dias: Set<string> }>();
  for (const e of monthEntries) {
    const cur = empAgg.get(e.funcionario_id) ?? { total: 0, dias: new Set() };
    cur.total += e.quantidade_produzida;
    cur.dias.add(e.data);
    empAgg.set(e.funcionario_id, cur);
  }
  const ranking = [...empAgg.entries()]
    .map(([id, v]) => {
      const emp = empById.get(id);
      const setor = emp?.setorId ? (sectorById.get(emp.setorId)?.nome ?? "—") : "—";
      return {
        nome: emp?.nome ?? "—",
        setor,
        total: v.total,
        media: v.dias.size ? Math.round((v.total / v.dias.size) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  // --- alertas (aproveitamento do setor no mês < 70% = crítico; < 85% = atenção) ---
  const alerts: mock.Alert[] = sectorProduction
    .map((s) => {
      const pct = s.meta > 0 ? s.producao / s.meta : 1;
      if (pct < 0.7)
        return {
          id: `al-${s.setor}`,
          nivel: "critico" as const,
          setor: s.setor,
          mensagem: `Aproveitamento de ${Math.round(pct * 100)}% no mês — abaixo do limite de 70%.`,
        };
      if (pct < 0.85)
        return {
          id: `al-${s.setor}`,
          nivel: "alerta" as const,
          setor: s.setor,
          mensagem: `Aproveitamento de ${Math.round(pct * 100)}% — atenção, abaixo de 85%.`,
        };
      return null;
    })
    .filter((a): a is mock.Alert => a !== null);

  // --- KPIs do período ---
  const dias = [...byDay.keys()].sort();
  const producao = monthEntries.reduce((acc, e) => acc + e.quantidade_produzida, 0);
  const meta = sectorProduction.reduce((acc, s) => acc + s.meta, 0);
  const melhor =
    dias
      .map((d) => ({ data: ddmm(d), valor: byDay.get(d)?.prod ?? 0 }))
      .sort((a, b) => b.valor - a.valor)[0] ?? null;

  const kpis: DashboardKpis = {
    producao,
    meta,
    aproveitamento: meta ? producao / meta : 0,
    funcionariosAtivos: empAgg.size,
    setoresAtivos: sectorAgg.size,
    diasProduzidos: dias.length,
    mediaDia: dias.length ? Math.round(producao / dias.length) : 0,
    melhorDia: melhor && melhor.valor > 0 ? melhor : null,
  };

  const insights: mock.Insight[] =
    insightsRes.data && insightsRes.data.length
      ? insightsRes.data.map((i) => ({
          id: i.id,
          severidade: (["info", "sucesso", "alerta"].includes(i.severidade)
            ? i.severidade
            : "info") as mock.Insight["severidade"],
          titulo: i.titulo,
          texto: i.conteudo,
        }))
      : mock.insights;

  return {
    kpis,
    dailyProduction,
    sectorProduction,
    ranking,
    alerts,
    insights,
    fromMock: false,
  };
});

export type NotificationItem = {
  id: string;
  nivel: "critico" | "alerta" | "info";
  titulo: string;
  mensagem: string;
};

/**
 * Notificações do sino — derivadas dos dados do mês corrente:
 * alertas de meta + um resumo da última produção registrada.
 */
export const getNotifications = cache(async (): Promise<NotificationItem[]> => {
  const d = await getDashboardData(monthRange());

  const notifs: NotificationItem[] = d.alerts.map((a) => ({
    id: `alert-${a.setor}-${a.nivel}`,
    nivel: a.nivel,
    titulo: a.nivel === "critico" ? `Setor ${a.setor} crítico` : `Atenção: ${a.setor}`,
    mensagem: a.mensagem,
  }));

  const ultimo = d.dailyProduction.at(-1);
  if (ultimo) {
    notifs.push({
      id: `info-ultimo-${ultimo.data}`,
      nivel: "info",
      titulo: "Produção registrada",
      mensagem: `Último dia (${ultimo.data}): ${formatNumberPlain(ultimo.producao)} peças lançadas.`,
    });
  }

  return notifs;
});

function formatNumberPlain(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
