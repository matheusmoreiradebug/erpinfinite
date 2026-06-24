"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured, aiComplete } from "@/lib/ai";
import { getDashboardData } from "@/lib/data/queries";
import { getQualityDashboard } from "@/lib/data/quality";
import { monthRange, formatRangeLabel } from "@/lib/date-range";

export type Insight = { severidade: "info" | "sucesso" | "alerta" | "critico"; titulo: string; texto: string };
export type AiResult<T> = { ok: boolean; error?: string; data?: T };

const SYSTEM =
  "Você é um analista especialista em produção industrial e controle de qualidade da fábrica de móveis Infinite Móveis. " +
  "Analise apenas os dados fornecidos, em português do Brasil, de forma objetiva e prática para um gestor. " +
  "Não invente números que não estejam nos dados. Não inclua raciocínio extra além do que for pedido.";

/** Monta um resumo compacto dos dados do período para o modelo raciocinar. */
async function buildContext(): Promise<string> {
  const range = monthRange();
  const [prod, qual] = await Promise.all([getDashboardData(range), getQualityDashboard(range)]);

  const setores = prod.sectorProduction
    .map((s) => `  - ${s.setor}: ${s.producao}/${s.meta} (${Math.round((s.meta ? s.producao / s.meta : 0) * 100)}%)`)
    .join("\n");
  const ranking = prod.ranking
    .slice(0, 7)
    .map((r, i) => `  ${i + 1}. ${r.nome} (${r.setor}): ${r.total} peças, média ${r.media}/dia`)
    .join("\n");
  const cat = qual.porCategoria.map((c) => `  - ${c.categoria}: ${c.ocorrencias}`).join("\n");
  const caminhoes = qual.porCaminhao
    .map((c) => `  - ${c.nome}: ${c.retornos} retornos em ${c.entregas} entregas (${Math.round((c.entregas ? c.taxa : 0) * 100)}%)`)
    .join("\n");

  return [
    `PERÍODO: ${formatRangeLabel(range)}`,
    "",
    "PRODUÇÃO:",
    `Total: ${prod.kpis.producao} peças | Meta: ${prod.kpis.meta} | Aproveitamento: ${Math.round(prod.kpis.aproveitamento * 100)}%`,
    `Dias produzidos: ${prod.kpis.diasProduzidos} | Média/dia: ${prod.kpis.mediaDia} | Funcionários ativos: ${prod.kpis.funcionariosAtivos}`,
    "Produção por setor (realizado/meta):",
    setores || "  (sem dados)",
    "Ranking de funcionários:",
    ranking || "  (sem dados)",
    "",
    "QUALIDADE / RETORNOS:",
    `Retornos: ${qual.retornos} | Peças retornadas: ${qual.pecas} | % sobre produção: ${(qual.percentRetorno * 100).toFixed(1)}% | Valor perdido estimado: R$ ${qual.valorPerdido.toFixed(2)}`,
    "Por categoria de problema:",
    cat || "  (sem retornos)",
    "Por caminhão:",
    caminhoes || "  (sem dados)",
  ].join("\n");
}

/** Gera insights automáticos e salva em ai_insights (aparecem no dashboard e na IA). */
export async function gerarAnalise(): Promise<AiResult<Insight[]>> {
  if (!isAiConfigured) return { ok: false, error: "IA não configurada (defina ANTHROPIC_API_KEY)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { ok: false, error: "Usuário sem organização." };

  let insights: Insight[];
  try {
    const contexto = await buildContext();
    const texto = await aiComplete({
      system: SYSTEM,
      maxTokens: 1500,
      prompt:
        `Com base nos dados abaixo, gere de 3 a 5 insights curtos e acionáveis sobre produção e qualidade ` +
        `(tendências, destaques, riscos, projeções de meta).\n\n${contexto}\n\n` +
        `Responda APENAS com um array JSON válido, sem texto fora dele, no formato:\n` +
        `[{"severidade":"info|sucesso|alerta|critico","titulo":"curto","texto":"1-2 frases"}]`,
    });
    const jsonStr = texto.slice(texto.indexOf("["), texto.lastIndexOf("]") + 1);
    insights = JSON.parse(jsonStr);
    if (!Array.isArray(insights) || insights.length === 0) throw new Error("vazio");
  } catch (e) {
    return { ok: false, error: "A IA não retornou uma análise válida. Tente de novo." };
  }

  // persiste (substitui as análises automáticas anteriores)
  await supabase.from("ai_insights").delete().eq("org_id", profile.org_id).eq("escopo", "geral");
  await supabase.from("ai_insights").insert(
    insights.slice(0, 5).map((i) => ({
      org_id: profile.org_id,
      escopo: "geral",
      severidade: ["info", "sucesso", "alerta", "critico"].includes(i.severidade) ? i.severidade : "info",
      titulo: i.titulo.slice(0, 200),
      conteudo: i.texto,
    })),
  );

  revalidatePath("/ia");
  revalidatePath("/");
  return { ok: true, data: insights.slice(0, 5) };
}

/** Responde uma pergunta do gestor usando os dados como contexto. */
export async function perguntarIA(pergunta: string): Promise<AiResult<string>> {
  if (!isAiConfigured) return { ok: false, error: "IA não configurada." };
  if (!pergunta.trim()) return { ok: false, error: "Faça uma pergunta." };
  try {
    const contexto = await buildContext();
    const resposta = await aiComplete({
      system: SYSTEM,
      maxTokens: 1200,
      prompt: `DADOS ATUAIS:\n${contexto}\n\nPERGUNTA DO GESTOR: ${pergunta.trim()}\n\nResponda de forma direta e objetiva, em no máximo 5 frases.`,
    });
    return { ok: true, data: resposta };
  } catch {
    return { ok: false, error: "Não consegui responder agora. Tente novamente." };
  }
}
