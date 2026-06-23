import { NextRequest } from "next/server";
import { getDashboardData } from "@/lib/data/queries";
import { getQualityDashboard } from "@/lib/data/quality";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { buildReportPdf, buildQualityReportPdf } from "@/lib/pdf-report";

export const runtime = "nodejs";

const sep = ";";
const line = (cols: (string | number)[]) =>
  cols.map((c) => (typeof c === "string" && c.includes(sep) ? `"${c}"` : c)).join(sep);
const pdfResponse = (pdf: Uint8Array, nome: string) =>
  new Response(pdf as BodyInit, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nome}"` },
  });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "completo";
  const format = params.get("format") ?? "csv";
  const range = parseRange({
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });

  // ===== RELATÓRIO DE QUALIDADE =====
  if (type === "qualidade") {
    const q = await getQualityDashboard(range);
    if (format === "pdf") {
      const pdf = await buildQualityReportPdf(q, range);
      return pdfResponse(pdf, `infinite_qualidade_${range.from}_a_${range.to}.pdf`);
    }
    const pctq = (n: number) => `${Math.round(n * 100)}%`;
    const r: string[] = [];
    r.push(line(["Infinite Dashboard — Relatório de Qualidade"]));
    r.push(line(["Período", formatRangeLabel(range), `${range.from} a ${range.to}`]));
    r.push("");
    r.push(line(["RESUMO"]));
    r.push(line(["Retornos", q.retornos]));
    r.push(line(["Peças retornadas", q.pecas]));
    r.push(line(["% sobre produção", pctq(q.percentRetorno)]));
    r.push(line(["Valor perdido", q.valorPerdido.toFixed(2)]));
    r.push("");
    r.push(line(["POR CATEGORIA"]));
    r.push(line(["Categoria", "Ocorrências"]));
    q.porCategoria.forEach((c) => r.push(line([c.categoria, c.ocorrencias])));
    r.push("");
    r.push(line(["POR CAMINHÃO"]));
    r.push(line(["Caminhão", "Entregas", "Retornos", "Taxa"]));
    q.porCaminhao.forEach((c) => r.push(line([c.nome, c.entregas, c.retornos, c.entregas ? pctq(c.taxa) : "-"])));
    r.push("");
    r.push(line(["POR FUNCIONÁRIO"]));
    r.push(line(["Funcionário", "Produção", "Retornos", "Taxa"]));
    q.porFuncionario.forEach((f) => r.push(line([f.nome, f.producao, f.retornos, f.producao ? pctq(f.taxa) : "-"])));
    r.push("");
    r.push(line(["POR SETOR"]));
    r.push(line(["Setor", "Produção", "Retornos", "Taxa"]));
    q.porSetor.forEach((s) => r.push(line([s.nome, s.producao, s.retornos, s.producao ? pctq(s.taxa) : "-"])));
    const csvQ = "﻿" + r.join("\r\n");
    return new Response(csvQ, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="infinite_qualidade_${range.from}_a_${range.to}.csv"`,
      },
    });
  }

  const d = await getDashboardData(range);

  // ---- PDF ----
  if (format === "pdf") {
    const pdf = await buildReportPdf(d, range, type);
    const nomePdf = `infinite_${type}_${range.from}_a_${range.to}.pdf`;
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomePdf}"`,
      },
    });
  }
  const rows: string[] = [];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  rows.push(line(["Infinite Dashboard — Relatório de Produção"]));
  rows.push(line(["Período", formatRangeLabel(range), `${range.from} a ${range.to}`]));
  rows.push("");

  const secaoSetor = () => {
    rows.push(line(["PRODUÇÃO POR SETOR"]));
    rows.push(line(["Setor", "Realizado", "Meta", "Aproveitamento"]));
    d.sectorProduction.forEach((s) =>
      rows.push(line([s.setor, s.producao, s.meta, pct(s.meta ? s.producao / s.meta : 0)])),
    );
    rows.push("");
  };

  const secaoFuncionario = () => {
    rows.push(line(["PRODUÇÃO / RANKING POR FUNCIONÁRIO"]));
    rows.push(line(["#", "Funcionário", "Setor", "Total", "Média/dia"]));
    d.ranking.forEach((r, i) =>
      rows.push(line([i + 1, r.nome, r.setor, r.total, r.media])),
    );
    rows.push("");
  };

  const secaoDiaria = () => {
    rows.push(line(["PRODUÇÃO DIÁRIA"]));
    rows.push(line(["Data", "Realizado", "Meta", "Aproveitamento"]));
    d.dailyProduction.forEach((p) =>
      rows.push(line([p.data, p.producao, p.meta, pct(p.meta ? p.producao / p.meta : 0)])),
    );
    rows.push("");
  };

  const secaoResumo = () => {
    rows.push(line(["RESUMO GERAL"]));
    rows.push(line(["Produção no período", d.kpis.producao]));
    rows.push(line(["Meta do período", d.kpis.meta]));
    rows.push(line(["Aproveitamento", pct(d.kpis.aproveitamento)]));
    rows.push(line(["Dias produzidos", d.kpis.diasProduzidos]));
    rows.push(line(["Média por dia", d.kpis.mediaDia]));
    rows.push(line(["Funcionários ativos", d.kpis.funcionariosAtivos]));
    rows.push(line(["Setores ativos", d.kpis.setoresAtivos]));
    rows.push("");
  };

  switch (type) {
    case "setor":
      secaoSetor();
      break;
    case "funcionario":
    case "ranking":
      secaoFuncionario();
      break;
    case "diaria":
    case "meta":
      secaoDiaria();
      break;
    case "aproveitamento":
      secaoResumo();
      secaoSetor();
      break;
    default: // completo
      secaoResumo();
      secaoSetor();
      secaoFuncionario();
      secaoDiaria();
  }

  // BOM para o Excel reconhecer acentos
  const csv = "﻿" + rows.join("\r\n");
  const nome = `infinite_${type}_${range.from}_a_${range.to}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
    },
  });
}
