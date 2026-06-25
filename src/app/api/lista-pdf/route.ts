import { NextRequest } from "next/server";
import { getLista } from "@/lib/data/listas";
import { buildListaPdf, type ListaPdfData } from "@/lib/pdf-report";
import { LINHAS, linhaLabel, statusLabel, prioridadeLabel } from "@/lib/logistica";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return new Response("id ausente", { status: 400 });

  const lista = await getLista(id);
  if (!lista) return new Response("Lista não encontrada", { status: 404 });

  // ordem das linhas conforme o catálogo; agrupa por linha → caminhão
  const ordemLinha = new Map<string, number>(LINHAS.map((l, i) => [l.key, i]));
  const porLinha = new Map<string, Map<number, { cor: string; movel: string; quantidade: number }[]>>();
  for (const it of lista.itens) {
    const cam = it.caminhao ?? 0;
    const linhaMap = porLinha.get(it.linha) ?? new Map();
    const arr = linhaMap.get(cam) ?? [];
    arr.push({ cor: it.cor, movel: it.movel, quantidade: it.quantidade });
    linhaMap.set(cam, arr);
    porLinha.set(it.linha, linhaMap);
  }

  const linhas: ListaPdfData["linhas"] = [...porLinha.entries()]
    .sort((a, b) => (ordemLinha.get(a[0]) ?? 99) - (ordemLinha.get(b[0]) ?? 99))
    .map(([linha, camMap]) => {
      const caminhoes = [...camMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([caminhao, itens]) => ({ caminhao, itens }));
      const total = caminhoes.reduce((a, c) => a + c.itens.reduce((s, i) => s + i.quantidade, 0), 0);
      return { label: linhaLabel(linha), total, caminhoes };
    });

  const data: ListaPdfData = {
    codigo: lista.codigo,
    dataProducao: lista.dataProducao,
    dataEntrega: lista.dataEntrega,
    cliente: lista.cliente,
    pedido: lista.pedido,
    prioridade: prioridadeLabel(lista.prioridade),
    status: statusLabel(lista.status),
    observacao: lista.observacao,
    linhas,
  };

  const pdf = await buildListaPdf(data);
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${lista.codigo}.pdf"`,
    },
  });
}
