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
