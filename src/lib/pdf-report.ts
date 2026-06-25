import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DashboardData } from "@/lib/data/queries";
import { type DateRange, formatRangeLabel } from "@/lib/date-range";

const BRAND = rgb(0.145, 0.388, 0.922); // #2563EB
const INK = rgb(0.12, 0.13, 0.15);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.86, 0.87, 0.89);
const ZEBRA = rgb(0.96, 0.97, 0.98);
const WHITE = rgb(1, 1, 1);

const A4 = { w: 595.28, h: 841.89 };
const M = 42; // margem

/** Remove caracteres fora do WinAnsi (evita erro de codificação das fontes padrão). */
const clean = (s: unknown) =>
  String(s).replace(/[–—]/g, "-").replace(/×/g, "x").replace(/[^\x00-\xFF]/g, "");

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
};

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([A4.w, A4.h]);
  ctx.y = A4.h - M;
}

function ensure(ctx: Ctx, h: number) {
  if (ctx.y - h < M + 24) newPage(ctx);
}

function text(
  ctx: Ctx,
  s: string,
  x: number,
  size: number,
  opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {},
) {
  ctx.page.drawText(clean(s), {
    x,
    y: ctx.y,
    size,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? INK,
  });
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

type Col = { header: string; key: string; w: number; align?: "left" | "right" };

function drawTable(ctx: Ctx, title: string, cols: Col[], rows: Record<string, string | number>[]) {
  ensure(ctx, 60);
  ctx.y -= 6;
  text(ctx, title, M, 11, { bold: true, color: BRAND });
  ctx.y -= 16;

  const rowH = 18;
  const tableW = A4.w - M * 2;

  // cabeçalho
  ctx.page.drawRectangle({ x: M, y: ctx.y - 4, width: tableW, height: rowH, color: INK });
  let cx = M + 8;
  for (const c of cols) {
    const tx = c.align === "right" ? cx + c.w - 8 - ctx.bold.widthOfTextAtSize(clean(c.header), 8.5) : cx;
    ctx.page.drawText(clean(c.header), { x: tx, y: ctx.y, size: 8.5, font: ctx.bold, color: WHITE });
    cx += c.w;
  }
  ctx.y -= rowH;

  // linhas
  rows.forEach((row, i) => {
    ensure(ctx, rowH);
    if (i % 2 === 1) {
      ctx.page.drawRectangle({ x: M, y: ctx.y - 4, width: tableW, height: rowH, color: ZEBRA });
    }
    let x = M + 8;
    for (const c of cols) {
      const val = clean(row[c.key] ?? "");
      const tx = c.align === "right" ? x + c.w - 8 - ctx.font.widthOfTextAtSize(val, 9) : x;
      ctx.page.drawText(val, { x: tx, y: ctx.y, size: 9, font: ctx.font, color: INK });
      x += c.w;
    }
    ctx.y -= rowH;
  });

  // borda inferior
  ctx.page.drawLine({
    start: { x: M, y: ctx.y + rowH - 4 },
    end: { x: A4.w - M, y: ctx.y + rowH - 4 },
    thickness: 0.5,
    color: LINE,
  });
  ctx.y -= 10;
}

export async function buildReportPdf(
  data: DashboardData,
  range: DateRange,
  type = "completo",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { doc, page: doc.addPage([A4.w, A4.h]), y: A4.h - M, font, bold };

  // ---- cabeçalho da marca ----
  ctx.page.drawRectangle({ x: 0, y: A4.h - 70, width: A4.w, height: 70, color: BRAND });
  ctx.page.drawText("Infinite Moveis", { x: M, y: A4.h - 38, size: 18, font: bold, color: WHITE });
  ctx.page.drawText("Relatorio de Producao", { x: M, y: A4.h - 56, size: 10, font, color: WHITE });
  const periodo = clean(formatRangeLabel(range));
  ctx.page.drawText(periodo, {
    x: A4.w - M - bold.widthOfTextAtSize(periodo, 11),
    y: A4.h - 42,
    size: 11,
    font: bold,
    color: WHITE,
  });
  ctx.y = A4.h - 96;

  // ---- resumo ----
  const k = data.kpis;
  const resumo: [string, string][] = [
    ["Producao no periodo", `${k.producao} pc`],
    ["Meta do periodo", `${k.meta} pc`],
    ["Aproveitamento", pct(k.aproveitamento)],
    ["Dias produzidos", String(k.diasProduzidos)],
    ["Media por dia", String(k.mediaDia)],
    ["Funcionarios ativos", String(k.funcionariosAtivos)],
  ];
  text(ctx, "Resumo geral", M, 11, { bold: true, color: BRAND });
  ctx.y -= 18;
  const colW = (A4.w - M * 2) / 3;
  resumo.forEach(([label, val], i) => {
    const col = i % 3;
    const rowIx = Math.floor(i / 3);
    const bx = M + col * colW;
    const by = ctx.y - rowIx * 40;
    ctx.page.drawRectangle({
      x: bx,
      y: by - 26,
      width: colW - 10,
      height: 34,
      color: ZEBRA,
      borderColor: LINE,
      borderWidth: 0.5,
    });
    ctx.page.drawText(clean(label), { x: bx + 8, y: by - 6, size: 7.5, font, color: MUTED });
    ctx.page.drawText(clean(val), { x: bx + 8, y: by - 20, size: 13, font: bold, color: INK });
  });
  ctx.y -= 40 * Math.ceil(resumo.length / 3) + 8;

  // ---- tabelas ----
  const wantSetor = ["completo", "setor", "aproveitamento"].includes(type);
  const wantFunc = ["completo", "funcionario", "ranking"].includes(type);
  const wantDiaria = ["completo", "diaria", "meta"].includes(type);

  if (wantSetor) {
    drawTable(
      ctx,
      "Producao por setor",
      [
        { header: "Setor", key: "setor", w: 200 },
        { header: "Realizado", key: "real", w: 100, align: "right" },
        { header: "Meta", key: "meta", w: 100, align: "right" },
        { header: "Aproveitamento", key: "ap", w: 111, align: "right" },
      ],
      data.sectorProduction.map((s) => ({
        setor: s.setor,
        real: s.producao,
        meta: s.meta,
        ap: pct(s.meta ? s.producao / s.meta : 0),
      })),
    );
  }

  if (wantFunc) {
    drawTable(
      ctx,
      "Ranking por funcionario",
      [
        { header: "#", key: "pos", w: 36 },
        { header: "Funcionario", key: "nome", w: 230 },
        { header: "Setor", key: "setor", w: 135 },
        { header: "Total", key: "total", w: 55, align: "right" },
        { header: "Media", key: "media", w: 55, align: "right" },
      ],
      data.ranking.map((r, i) => ({
        pos: i + 1,
        nome: r.nome,
        setor: r.setor,
        total: r.total,
        media: r.media,
      })),
    );
  }

  if (wantDiaria) {
    drawTable(
      ctx,
      "Producao diaria",
      [
        { header: "Data", key: "data", w: 200 },
        { header: "Realizado", key: "real", w: 100, align: "right" },
        { header: "Meta", key: "meta", w: 100, align: "right" },
        { header: "Aproveitamento", key: "ap", w: 111, align: "right" },
      ],
      data.dailyProduction.map((p) => ({
        data: p.data,
        real: p.producao,
        meta: p.meta,
        ap: pct(p.meta ? p.producao / p.meta : 0),
      })),
    );
  }

  // ---- rodapé em todas as páginas ----
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(clean(`Infinite Dashboard  -  gerado em ${new Date().toLocaleDateString("pt-BR")}`), {
      x: M,
      y: 24,
      size: 7.5,
      font,
      color: MUTED,
    });
    const pg = `${i + 1}/${pages.length}`;
    p.drawText(pg, { x: A4.w - M - font.widthOfTextAtSize(pg, 7.5), y: 24, size: 7.5, font, color: MUTED });
  });

  return doc.save();
}

// ============================================================================
// LISTA DE PRODUÇÃO — layout A4 para impressão industrial
// ============================================================================
export type ListaPdfData = {
  codigo: string;
  dataProducao: string;
  dataEntrega: string | null;
  cliente: string;
  pedido: string | null;
  prioridade: string;
  status: string;
  observacao: string | null;
  linhas: { label: string; total: number; caminhoes: { caminhao: number; itens: { cor: string; movel: string; quantidade: number }[] }[] }[];
};

function fit(s: string, font: PDFFont, size: number, maxW: number): string {
  s = clean(s);
  if (font.widthOfTextAtSize(s, size) <= maxW) return s;
  while (s.length > 1 && font.widthOfTextAtSize(s + "…", size) > maxW) s = s.slice(0, -1);
  return s + "…";
}
const brData = (iso: string) => iso.split("-").reverse().join("/");

export async function buildListaPdf(d: ListaPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { doc, page: doc.addPage([A4.w, A4.h]), y: A4.h - M, font, bold };
  const W = A4.w - M * 2;

  const header = () => {
    ctx.page.drawRectangle({ x: 0, y: A4.h - 64, width: A4.w, height: 64, color: BRAND });
    ctx.page.drawText("Infinite Moveis", { x: M, y: A4.h - 30, size: 15, font: bold, color: WHITE });
    ctx.page.drawText("LISTA DE PRODUCAO", { x: M, y: A4.h - 48, size: 10, font, color: WHITE });
    const cod = clean(d.codigo);
    ctx.page.drawText(cod, { x: A4.w - M - bold.widthOfTextAtSize(cod, 16), y: A4.h - 40, size: 16, font: bold, color: WHITE });
    ctx.y = A4.h - 84;
  };
  header();

  // bloco de informações
  const info: [string, string][] = [
    ["Cliente", d.cliente],
    ["Pedido", d.pedido || "-"],
    ["Data de producao", brData(d.dataProducao)],
    ["Entrega prevista", d.dataEntrega ? brData(d.dataEntrega) : "-"],
    ["Prioridade", d.prioridade],
    ["Status", d.status],
  ];
  ctx.page.drawRectangle({ x: M, y: ctx.y - 56, width: W, height: 64, color: ZEBRA, borderColor: LINE, borderWidth: 0.5 });
  info.forEach(([lab, val], i) => {
    const col = i % 3;
    const rowIx = Math.floor(i / 3);
    const x = M + 10 + col * (W / 3);
    const y = ctx.y - 4 - rowIx * 28;
    ctx.page.drawText(clean(lab.toUpperCase()), { x, y, size: 6.5, font, color: MUTED });
    ctx.page.drawText(fit(val, bold, 10, W / 3 - 16), { x, y: y - 12, size: 10, font: bold, color: INK });
  });
  ctx.y -= 76;

  // linhas de produto
  const colMovel = W - 150;
  for (const linha of d.linhas) {
    ensure(ctx, 50);
    // faixa do título da linha
    ctx.page.drawRectangle({ x: M, y: ctx.y - 4, width: W, height: 20, color: INK });
    ctx.page.drawText(clean(linha.label.toUpperCase()), { x: M + 8, y: ctx.y + 1, size: 10, font: bold, color: WHITE });
    const tot = `TOTAL: ${linha.total}`;
    ctx.page.drawText(tot, { x: A4.w - M - 8 - bold.widthOfTextAtSize(tot, 9), y: ctx.y + 1, size: 9, font: bold, color: WHITE });
    ctx.y -= 24;

    for (const cam of linha.caminhoes) {
      ensure(ctx, 28);
      ctx.page.drawText(clean(`Caminhao ${cam.caminhao}`), { x: M + 4, y: ctx.y, size: 9.5, font: bold, color: BRAND });
      ctx.y -= 15;
      for (const it of cam.itens) {
        ensure(ctx, 16);
        // checkbox de conferência
        ctx.page.drawRectangle({ x: M + 6, y: ctx.y - 1, width: 9, height: 9, borderColor: rgb(0.6, 0.62, 0.66), borderWidth: 0.8 });
        ctx.page.drawText(fit(it.movel, font, 9.5, colMovel - 30), { x: M + 22, y: ctx.y, size: 9.5, font, color: INK });
        ctx.page.drawText(it.cor === "preto" ? "PRETO" : "BRANCO", { x: M + colMovel, y: ctx.y, size: 7.5, font, color: it.cor === "preto" ? INK : MUTED });
        const q = String(it.quantidade);
        ctx.page.drawText(q, { x: A4.w - M - 12 - bold.widthOfTextAtSize(q, 10), y: ctx.y, size: 10, font: bold, color: INK });
        ctx.y -= 15;
      }
      ctx.y -= 3;
    }
    ctx.y -= 6;
  }

  // observações + assinaturas
  ensure(ctx, 110);
  ctx.y -= 6;
  ctx.page.drawText("OBSERVACOES", { x: M, y: ctx.y, size: 8, font: bold, color: MUTED });
  ctx.y -= 6;
  ctx.page.drawRectangle({ x: M, y: ctx.y - 44, width: W, height: 44, borderColor: LINE, borderWidth: 0.5 });
  if (d.observacao) ctx.page.drawText(fit(d.observacao, font, 9, W - 16), { x: M + 8, y: ctx.y - 14, size: 9, font, color: INK });
  ctx.y -= 76;
  // assinaturas
  const sigW = (W - 30) / 2;
  [["Conferente", M], ["Responsavel", M + sigW + 30]].forEach(([lab, x]) => {
    const xn = x as number;
    ctx.page.drawLine({ start: { x: xn, y: ctx.y }, end: { x: xn + sigW, y: ctx.y }, thickness: 0.6, color: rgb(0.5, 0.52, 0.56) });
    ctx.page.drawText(clean(lab as string), { x: xn, y: ctx.y - 12, size: 8, font, color: MUTED });
  });

  // rodapé com paginação
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(clean(`${d.codigo}  -  gerado em ${new Date().toLocaleDateString("pt-BR")}`), { x: M, y: 22, size: 7, font, color: MUTED });
    const pg = `${i + 1}/${pages.length}`;
    p.drawText(pg, { x: A4.w - M - font.widthOfTextAtSize(pg, 7), y: 22, size: 7, font, color: MUTED });
  });

  return doc.save();
}

// ============================================================================
// Relatório de QUALIDADE
// ============================================================================
export type QualityReportData = {
  retornos: number;
  pecas: number;
  producao: number;
  percentRetorno: number;
  valorPerdido: number;
  porCategoria: { categoria: string; ocorrencias: number }[];
  porCaminhao: { nome: string; entregas: number; retornos: number; taxa: number }[];
  porFuncionario: { nome: string; producao: number; retornos: number; taxa: number }[];
  porSetor: { nome: string; producao: number; retornos: number; taxa: number }[];
};

export async function buildQualityReportPdf(
  data: QualityReportData,
  range: DateRange,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { doc, page: doc.addPage([A4.w, A4.h]), y: A4.h - M, font, bold };

  // cabeçalho
  ctx.page.drawRectangle({ x: 0, y: A4.h - 70, width: A4.w, height: 70, color: BRAND });
  ctx.page.drawText("Infinite Moveis", { x: M, y: A4.h - 38, size: 18, font: bold, color: WHITE });
  ctx.page.drawText("Relatorio de Qualidade", { x: M, y: A4.h - 56, size: 10, font, color: WHITE });
  const periodo = clean(formatRangeLabel(range));
  ctx.page.drawText(periodo, { x: A4.w - M - bold.widthOfTextAtSize(periodo, 11), y: A4.h - 42, size: 11, font: bold, color: WHITE });
  ctx.y = A4.h - 96;

  // resumo
  const resumo: [string, string][] = [
    ["Retornos no periodo", String(data.retornos)],
    ["Pecas retornadas", String(data.pecas)],
    ["% sobre producao", pct(data.percentRetorno)],
    ["Valor perdido (R$)", data.valorPerdido.toFixed(2)],
    ["Producao", String(data.producao)],
    ["Categorias afetadas", String(data.porCategoria.length)],
  ];
  text(ctx, "Resumo geral", M, 11, { bold: true, color: BRAND });
  ctx.y -= 18;
  const colW = (A4.w - M * 2) / 3;
  resumo.forEach(([label, val], i) => {
    const col = i % 3;
    const rowIx = Math.floor(i / 3);
    const bx = M + col * colW;
    const by = ctx.y - rowIx * 40;
    ctx.page.drawRectangle({ x: bx, y: by - 26, width: colW - 10, height: 34, color: ZEBRA, borderColor: LINE, borderWidth: 0.5 });
    ctx.page.drawText(clean(label), { x: bx + 8, y: by - 6, size: 7.5, font, color: MUTED });
    ctx.page.drawText(clean(val), { x: bx + 8, y: by - 20, size: 13, font: bold, color: INK });
  });
  ctx.y -= 40 * Math.ceil(resumo.length / 3) + 8;

  drawTable(ctx, "Problemas por categoria",
    [{ header: "Categoria", key: "cat", w: 360 }, { header: "Ocorrencias", key: "qtd", w: 151, align: "right" }],
    data.porCategoria.map((c) => ({ cat: c.categoria, qtd: c.ocorrencias })));

  drawTable(ctx, "Por caminhao",
    [{ header: "Caminhao", key: "nome", w: 230 }, { header: "Entregas", key: "e", w: 90, align: "right" }, { header: "Retornos", key: "r", w: 90, align: "right" }, { header: "Taxa", key: "t", w: 101, align: "right" }],
    data.porCaminhao.map((c) => ({ nome: c.nome, e: c.entregas, r: c.retornos, t: c.entregas ? pct(c.taxa) : "-" })));

  drawTable(ctx, "Por funcionario (taxa de erro)",
    [{ header: "Funcionario", key: "nome", w: 260 }, { header: "Producao", key: "p", w: 80, align: "right" }, { header: "Retornos", key: "r", w: 80, align: "right" }, { header: "Taxa", key: "t", w: 91, align: "right" }],
    data.porFuncionario.map((f) => ({ nome: f.nome, p: f.producao, r: f.retornos, t: f.producao ? pct(f.taxa) : "-" })));

  drawTable(ctx, "Por setor",
    [{ header: "Setor", key: "nome", w: 260 }, { header: "Producao", key: "p", w: 80, align: "right" }, { header: "Retornos", key: "r", w: 80, align: "right" }, { header: "Taxa", key: "t", w: 91, align: "right" }],
    data.porSetor.map((s) => ({ nome: s.nome, p: s.producao, r: s.retornos, t: s.producao ? pct(s.taxa) : "-" })));

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(clean(`Infinite Dashboard  -  Qualidade  -  gerado em ${new Date().toLocaleDateString("pt-BR")}`), { x: M, y: 24, size: 7.5, font, color: MUTED });
    const pg = `${i + 1}/${pages.length}`;
    p.drawText(pg, { x: A4.w - M - font.widthOfTextAtSize(pg, 7.5), y: 24, size: 7.5, font, color: MUTED });
  });

  return doc.save();
}
