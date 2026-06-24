import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * IA do sistema (Claude / Anthropic). Uso exclusivo no servidor — a chave
 * ANTHROPIC_API_KEY nunca vai para o browser.
 *
 * Modelo: padrão claude-opus-4-8 (o mais capaz). Para reduzir custo, defina
 * ANTHROPIC_MODEL no .env.local (ex.: "claude-haiku-4-5" ou "claude-sonnet-4-6").
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export const isAiConfigured = (process.env.ANTHROPIC_API_KEY ?? "").length > 0;

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
}

/** Uma chamada simples ao modelo. Retorna o texto da resposta. */
export async function aiComplete(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const resp = await client().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1500,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
