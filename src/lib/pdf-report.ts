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
