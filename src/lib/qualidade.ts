// Constantes puras da Qualidade — seguras para client components
// (NÃO importar src/lib/data/* aqui, puxa next/headers).

export type FreteCenario = "perda_total" | "remarcacao";

export const FRETE_CENARIOS: { key: FreteCenario; label: string; desc: string; cor: string }[] = [
  { key: "perda_total", label: "Perda total", desc: "Cliente não recebeu / b.o. — pedido não remarca", cor: "#dc2626" },
  { key: "remarcacao", label: "Remarcação", desc: "Vai voltar; o cliente paga a próxima viagem", cor: "#d97706" },
];
const freteMap = new Map(FRETE_CENARIOS.map((f) => [f.key, f]));
export const freteCenarioLabel = (k?: string | null) => (k ? freteMap.get(k as FreteCenario)?.label ?? k : null);
export const freteCenarioCor = (k?: string | null) => (k ? freteMap.get(k as FreteCenario)?.cor ?? "#6b7280" : "#6b7280");

export type Gravidade = "baixa" | "media" | "alta" | "critica";
export type Destino = "retrabalho" | "sucata" | "reposicao" | "reparada" | "sem_acao";
export type Responsavel = "producao" | "transporte" | "cliente" | "fornecedor" | "projeto";

export const GRAVIDADES: { key: Gravidade; label: string; cor: string; desc: string }[] = [
  { key: "baixa", label: "Baixa", cor: "#16a34a", desc: "Defeito leve, sem impacto no cliente" },
  { key: "media", label: "Média", cor: "#d97706", desc: "Precisa de ajuste, cliente notou" },
  { key: "alta", label: "Alta", cor: "#ea580c", desc: "Comprometeu a entrega ou o uso" },
  { key: "critica", label: "Crítica", cor: "#dc2626", desc: "Risco sério / recorrente / segurança" },
];

export const DESTINOS: { key: Destino; label: string; desc: string }[] = [
  { key: "retrabalho", label: "Retrabalho", desc: "Volta para a fábrica consertar" },
  { key: "reparada", label: "Reparada e devolvida", desc: "Ajustada e entregue ao cliente" },
  { key: "reposicao", label: "Reposição", desc: "Peça nova produzida no lugar" },
  { key: "sucata", label: "Sucata / descarte", desc: "Perda total, não aproveitável" },
  { key: "sem_acao", label: "Sem ação", desc: "Nada a fazer / improcedente" },
];

export const RESPONSAVEIS: { key: Responsavel; label: string; desc: string }[] = [
  { key: "producao", label: "Produção", desc: "Falha de fabricação" },
  { key: "transporte", label: "Transporte / entrega", desc: "Dano na carga ou no caminho" },
  { key: "cliente", label: "Cliente", desc: "Manuseio / montagem no cliente" },
  { key: "fornecedor", label: "Fornecedor", desc: "Material com defeito" },
  { key: "projeto", label: "Projeto", desc: "Erro de medida / desenho" },
];

const map = <T extends string>(arr: { key: T; label: string }[]) =>
  new Map(arr.map((a) => [a.key, a.label]));

const gravLabel = map(GRAVIDADES);
const destLabel = map(DESTINOS);
const respLabel = map(RESPONSAVEIS);
const gravCor = new Map(GRAVIDADES.map((g) => [g.key, g.cor]));

export const gravidadeLabel = (k?: string | null) => (k ? gravLabel.get(k as Gravidade) ?? k : null);
export const gravidadeCor = (k?: string | null) => (k ? gravCor.get(k as Gravidade) ?? "#6b7280" : "#6b7280");
export const destinoLabel = (k?: string | null) => (k ? destLabel.get(k as Destino) ?? k : null);
export const responsavelLabel = (k?: string | null) => (k ? respLabel.get(k as Responsavel) ?? k : null);
