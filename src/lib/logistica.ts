/** Constantes e tipos da logística — puros (sem dependência de servidor). */

export const LINHAS = [
  { key: "estantes-a", label: "Estantes A" },
  { key: "estantes-bc", label: "Estantes B e C" },
  { key: "closet", label: "Closet" },
  { key: "balcao-a", label: "Balcão A" },
  { key: "balcao-bc", label: "Balcão B e C" },
  { key: "desm", label: "Desmontado" },
] as const;

export const linhaLabel = (key: string) => LINHAS.find((l) => l.key === key)?.label ?? key;

export const CAMINHOES = [1, 2, 3, 4, 5, 6, 7];

export type Cor = "branco" | "preto";
export type LoadingItem = { caminhao: number; cor: Cor; movel: string; quantidade: number };

export const STATUS_LISTA = [
  { key: "rascunho", label: "Rascunho", cor: "#888780" },
  { key: "aguardando_impressao", label: "Aguardando impressão", cor: "#f59e0b" },
  { key: "em_producao", label: "Em produção", cor: "#2563eb" },
  { key: "producao_concluida", label: "Produção concluída", cor: "#3b82f6" },
  { key: "expedida", label: "Expedida", cor: "#22c55e" },
  { key: "finalizada", label: "Finalizada", cor: "#16a34a" },
] as const;

export const PRIORIDADES = [
  { key: "baixa", label: "Baixa", cor: "#888780" },
  { key: "normal", label: "Normal", cor: "#2563eb" },
  { key: "alta", label: "Alta", cor: "#f59e0b" },
  { key: "urgente", label: "Urgente", cor: "#ef4444" },
] as const;

export const statusLabel = (k: string) => STATUS_LISTA.find((s) => s.key === k)?.label ?? k;
export const statusCor = (k: string) => STATUS_LISTA.find((s) => s.key === k)?.cor ?? "#888780";
export const prioridadeLabel = (k: string) => PRIORIDADES.find((p) => p.key === k)?.label ?? k;
export const prioridadeCor = (k: string) => PRIORIDADES.find((p) => p.key === k)?.cor ?? "#888780";
