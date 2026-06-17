/**
 * Dados de demonstração extraídos da planilha real da Infinite (junho/2026).
 * Servem para deixar o layout vivo antes de plugar o Supabase.
 */

export type Sector = {
  id: string;
  nome: string;
  metaIndividual: number;
  cor: string;
  ativo: boolean;
};

export const sectors: Sector[] = [
  { id: "acabamento", nome: "Acabamento", metaIndividual: 50, cor: "#2563eb", ativo: true },
  { id: "fundo", nome: "Fundo", metaIndividual: 70, cor: "#3b82f6", ativo: true },
  { id: "estante", nome: "Estante", metaIndividual: 30, cor: "#60a5fa", ativo: true },
  { id: "balcao", nome: "Balcão", metaIndividual: 25, cor: "#0ea5e9", ativo: true },
  { id: "desmontado", nome: "Desmontado", metaIndividual: 20, cor: "#38bdf8", ativo: true },
];

export type Employee = {
  id: string;
  nome: string;
  setorId: string;
  ativo: boolean;
};

export const employees: Employee[] = [
  { id: "e1", nome: "Ramy", setorId: "acabamento", ativo: true },
  { id: "e2", nome: "Gabriel", setorId: "acabamento", ativo: true },
  { id: "e3", nome: "Gui", setorId: "acabamento", ativo: true },
  { id: "e4", nome: "Wenderson", setorId: "acabamento", ativo: true },
  { id: "e5", nome: "Elias", setorId: "acabamento", ativo: true },
  { id: "e6", nome: "Marivaldo", setorId: "acabamento", ativo: true },
  { id: "e7", nome: "Felipe", setorId: "fundo", ativo: true },
  { id: "e8", nome: "Gustavo", setorId: "fundo", ativo: true },
  { id: "e9", nome: "Marcelo", setorId: "estante", ativo: true },
  { id: "e10", nome: "Leoncio", setorId: "estante", ativo: true },
  { id: "e11", nome: "Samuel", setorId: "estante", ativo: true },
  { id: "e12", nome: "Nicolas", setorId: "estante", ativo: true },
  { id: "e13", nome: "João Paulo", setorId: "estante", ativo: true },
  { id: "e14", nome: "Wendell", setorId: "estante", ativo: true },
  { id: "e15", nome: "Leandro", setorId: "balcao", ativo: true },
  { id: "e16", nome: "Guilherme Maximiniano", setorId: "balcao", ativo: true },
  { id: "e17", nome: "Abraão", setorId: "desmontado", ativo: true },
];

/** Produção total por dia (soma de todos os setores) — para o gráfico de linha. */
export const dailyProduction = [
  { data: "03/06", producao: 344, meta: 470 },
  { data: "05/06", producao: 303, meta: 400 },
  { data: "09/06", producao: 434, meta: 511 },
  { data: "10/06", producao: 290, meta: 330 },
  { data: "12/06", producao: 348, meta: 420 },
  { data: "16/06", producao: 311, meta: 480 },
];

/** Produção acumulada do mês por setor — para o gráfico de barras. */
export const sectorProduction = [
  { setor: "Acabamento", producao: 888, meta: 1250 },
  { setor: "Estante", producao: 662, meta: 720 },
  { setor: "Fundo", producao: 253, meta: 420 },
  { setor: "Balcão", producao: 209, meta: 250 },
  { setor: "Desmontado", producao: 18, meta: 40 },
];

/** Ranking de funcionários no mês. */
export const ranking = [
  { nome: "Elias", setor: "Acabamento", total: 225, media: 45 },
  { nome: "Gui", setor: "Acabamento", total: 191, media: 38.2 },
  { nome: "Samuel", setor: "Estante", total: 189, media: 31.5 },
  { nome: "Ramy", setor: "Acabamento", total: 176, media: 35.2 },
  { nome: "Wenderson", setor: "Acabamento", total: 163, media: 40.8 },
  { nome: "Leoncio", setor: "Estante", total: 157, media: 31.4 },
  { nome: "Guilherme Maximiniano", setor: "Balcão", total: 127, media: 25.4 },
];

export type Alert = {
  id: string;
  nivel: "critico" | "alerta";
  setor: string;
  mensagem: string;
};

export const alerts: Alert[] = [
  {
    id: "a1",
    nivel: "critico",
    setor: "Desmontado",
    mensagem: "Aproveitamento de 45% — muito abaixo da meta (limite 70%).",
  },
  {
    id: "a2",
    nivel: "critico",
    setor: "Fundo",
    mensagem: "Aproveitamento caiu para 43% no dia 16/06.",
  },
  {
    id: "a3",
    nivel: "alerta",
    setor: "Acabamento",
    mensagem: "Queda de 6% em relação à média dos últimos 7 dias.",
  },
];

export type Insight = {
  id: string;
  severidade: "info" | "sucesso" | "alerta";
  titulo: string;
  texto: string;
};

export const insights: Insight[] = [
  {
    id: "i1",
    severidade: "sucesso",
    titulo: "Destaque do mês",
    texto: "Elias é o funcionário mais produtivo, com 225 peças e média de 45/dia — 100% da meta individual.",
  },
  {
    id: "i2",
    severidade: "alerta",
    titulo: "Setor em queda",
    texto: "O setor Fundo está 18% abaixo da média dos últimos 30 dias. Vale checar disponibilidade de material.",
  },
  {
    id: "i3",
    severidade: "info",
    titulo: "Projeção de meta",
    texto: "Mantendo o ritmo atual, o mês deve fechar em 92% da meta mensal consolidada.",
  },
];

/** KPIs do topo do dashboard. */
export const kpis = {
  producaoDia: 311,
  producaoSemana: 659,
  producaoMes: 2030,
  metaMes: 3200,
  funcionariosAtivos: 17,
  setoresAtivos: 5,
};
