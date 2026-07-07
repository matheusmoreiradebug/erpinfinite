// Parser da Lista de Produção em Excel (formato real da logística).
// Estrutura: 1 aba por LINHA; dentro, blocos "CAMINHÃO N"; duas colunas
// (BRANCO à esquerda, PRETO à direita) com MÓVEL + QTE. Detecção por
// cabeçalho, não por posição fixa. Server-only (usa exceljs / Node).
import ExcelJS from "exceljs";
import { LINHAS } from "@/lib/logistica";

export type ImportItem = { cor: "branco" | "preto"; movel: string; quantidade: number };
export type ImportCaminhao = { caminhao: number | null; itens: ImportItem[] };
export type ImportLinha = { linha: string | null; aba: string; caminhoes: ImportCaminhao[]; semCabecalho?: boolean };
export type ImportAviso = { tipo: "invalido" | "duplicado" | "linha_desconhecida" | "sem_cabecalho"; aba: string; detalhe: string };
export type ParsedImport = {
  linhas: ImportLinha[];
  stats: { linhasLidas: number; caminhoes: number; itens: number; pecas: number; moveisUnicos: number; invalidos: number; duplicados: number };
  moveis: string[]; // nomes distintos (upper) encontrados
  avisos: ImportAviso[];
};

// mapeia nome da aba → chave de linha do catálogo (LINHAS)
const LINHA_MATCHERS: { key: string; re: RegExp }[] = [
  { key: "estantes-a", re: /estantes?\s*-?\s*a\b/i },
  { key: "estantes-bc", re: /estantes?\s*b\s*e?\s*c/i },
  { key: "closet", re: /closet/i },
  { key: "balcao-a", re: /balc[aã]o\s*-?\s*a\b/i },
  { key: "balcao-bc", re: /balc[aã]o\s*b\s*e?\s*c/i },
  { key: "desm", re: /desm/i },
];
function linhaFor(aba: string): string | null {
  const hit = LINHA_MATCHERS.find((l) => l.re.test(aba));
  // só aceita se a chave existir no catálogo de linhas
  return hit && LINHAS.some((l) => l.key === hit.key) ? hit.key : null;
}

// extrai texto de qualquer forma de célula do exceljs (string, número, richText, fórmula, hyperlink)
function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string") return v.replace(/\s+/g, " ").trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((t) => t.text).join("").replace(/\s+/g, " ").trim();
    if ("result" in o) return cellText(o.result as ExcelJS.CellValue);
    if ("text" in o) return cellText(o.text as ExcelJS.CellValue);
  }
  return "";
}
function cellNum(v: ExcelJS.CellValue): number | null {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "result" in v && typeof (v as { result: unknown }).result === "number") return (v as { result: number }).result;
  const n = parseFloat(cellText(v));
  return isNaN(n) ? null : n;
}

const isNoise = (s: string) => /^(m[oó]vel|qte|total|branco|preto|lista de produ|setor:|data:)/i.test(s);
const camNum = (s: string): number | null => {
  const m = /caminh[aã]o\s*(\d+)/i.exec(s);
  return m ? parseInt(m[1], 10) : null;
};

export async function parseListaWorkbook(data: ArrayBuffer | Buffer): Promise<ParsedImport> {
  const wb = new ExcelJS.Workbook();
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
  await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);

  const linhas: ImportLinha[] = [];
  const avisos: ImportAviso[] = [];
  const moveis = new Set<string>();
  // caminhão N é o MESMO caminhão físico entre as abas (carrega de várias linhas),
  // então o total de caminhões são os números distintos, não a soma por aba.
  const caminhoesSet = new Set<number>();
  let totItens = 0, totPecas = 0, totInvalid = 0, totDup = 0;

  for (const ws of wb.worksheets) {
    const linha = linhaFor(ws.name);
    if (!linha) avisos.push({ tipo: "linha_desconhecida", aba: ws.name, detalhe: `Aba "${ws.name}" não corresponde a uma linha conhecida — será importada sem linha.` });

    // localiza a linha de cabeçalho (contém MÓVEL e QTE) e as colunas dos blocos
    let headerRow: number | null = null;
    let movelCols: number[] = [], qteCols: number[] = [];
    for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
      const mc: number[] = [], qc: number[] = [];
      for (let c = 1; c <= 8; c++) {
        const t = cellText(ws.getCell(r, c).value);
        if (/^m[oó]vel$/i.test(t)) mc.push(c);
        if (/^qte$/i.test(t)) qc.push(c);
      }
      if (mc.length && qc.length) { headerRow = r; movelCols = mc; qteCols = qc; break; }
    }
    if (headerRow == null) {
      avisos.push({ tipo: "sem_cabecalho", aba: ws.name, detalhe: `Aba "${ws.name}" sem cabeçalho MÓVEL/QTE — ignorada.` });
      linhas.push({ linha, aba: ws.name, caminhoes: [], semCabecalho: true });
      continue;
    }

    // pareia (móvel, qte) → bloco; 1º bloco = branco, 2º = preto
    const blocks = movelCols.map((m, i) => ({ movel: m, qte: qteCols[i] ?? m + 1, cor: (i === 0 ? "branco" : "preto") as "branco" | "preto" }));
    const cams = new Map<number, ImportItem[]>();
    const seen = new Set<string>();
    let cur = 0;

    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const a = cellText(ws.getCell(r, 1).value);
      const cn = camNum(a);
      if (cn) { cur = cn; continue; }
      for (const b of blocks) {
        const mv = cellText(ws.getCell(r, b.movel).value);
        if (!mv || isNoise(mv)) continue;
        const q = cellNum(ws.getCell(r, b.qte).value);
        if (!q || q <= 0) {
          totInvalid++;
          avisos.push({ tipo: "invalido", aba: ws.name, detalhe: `${mv} (${b.cor}) sem quantidade válida.` });
          continue;
        }
        const key = `${cur}|${b.cor}|${mv.toUpperCase()}`;
        if (seen.has(key)) { totDup++; avisos.push({ tipo: "duplicado", aba: ws.name, detalhe: `${mv} (${b.cor}) repetido no caminhão ${cur || "—"}.` }); }
        seen.add(key);
        const arr = cams.get(cur) ?? [];
        arr.push({ cor: b.cor, movel: mv, quantidade: q });
        cams.set(cur, arr);
        totItens++; totPecas += q; moveis.add(mv.toUpperCase());
      }
    }

    const caminhoes: ImportCaminhao[] = [...cams.entries()]
      .sort((x, y) => x[0] - y[0])
      .map(([n, itens]) => ({ caminhao: n === 0 ? null : n, itens }));
    for (const n of cams.keys()) if (n > 0) caminhoesSet.add(n);
    linhas.push({ linha, aba: ws.name, caminhoes });
  }

  return {
    linhas,
    stats: { linhasLidas: linhas.filter((l) => !l.semCabecalho).length, caminhoes: caminhoesSet.size, itens: totItens, pecas: totPecas, moveisUnicos: moveis.size, invalidos: totInvalid, duplicados: totDup },
    moveis: [...moveis].sort(),
    avisos,
  };
}
