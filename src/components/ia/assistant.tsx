"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Sparkles, Send, Loader2, TrendingDown, Trophy, Target, Lightbulb, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gerarAnalise, perguntarIA, type Insight } from "@/app/(app)/ia/actions";

type DbInsight = { id: string; severidade: string; titulo: string; texto: string };
type ChatMsg = { role: "user" | "assistant"; text: string };

const suggestions = [
  { icon: TrendingDown, texto: "Quais setores estão abaixo da meta?" },
  { icon: Trophy, texto: "Quem é o funcionário mais produtivo?" },
  { icon: Target, texto: "Vamos bater a meta do mês?" },
  { icon: Lightbulb, texto: "O que posso melhorar na produção e qualidade?" },
];

const sev = {
  sucesso: "border-success/25 bg-success/[0.07] text-success",
  alerta: "border-warning/25 bg-warning/[0.07] text-warning",
  critico: "border-danger/25 bg-danger/[0.07] text-danger",
  info: "border-brand/25 bg-brand/[0.07] text-brand-3",
} as const;
const sevClass = (s: string) => sev[s as keyof typeof sev] ?? sev.info;

export function Assistant({ insights, aiOn }: { insights: DbInsight[]; aiOn: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [prompt, setPrompt] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [lista, setLista] = useState<{ severidade: string; titulo: string; texto: string }[]>(insights);
  const [askPending, startAsk] = useTransition();
  const [genPending, startGen] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const enviar = (texto: string) => {
    const q = texto.trim();
    if (!q || askPending) return;
    setErro(null);
    setPrompt("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    startAsk(async () => {
      const res = await perguntarIA(q);
      if (res.ok && res.data) setMsgs((m) => [...m, { role: "assistant", text: res.data! }]);
      else {
        setErro(res.error ?? "Erro");
        setMsgs((m) => m.slice(0, -1));
      }
    });
  };

  const analisar = () => {
    setErro(null);
    startGen(async () => {
      const res = await gerarAnalise();
      if (res.ok && res.data) setLista(res.data as Insight[]);
      else setErro(res.error ?? "Erro ao gerar análise.");
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* conversa */}
      <Card className="lg:col-span-2">
        <CardContent className="flex h-[560px] flex-col p-5">
          {!aiOn && (
            <div className="mb-3 rounded-xl border border-warning/25 bg-warning/[0.07] px-3 py-2 text-xs text-warning">
              IA não configurada — defina <code>ANTHROPIC_API_KEY</code> no .env.local e reinicie.
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {msgs.length === 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/[0.05] p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
                  <Sparkles className="size-4.5" />
                </span>
                <div className="text-sm leading-relaxed text-fg-muted">
                  <p className="font-medium text-fg">Assistente da Infinite</p>
                  <p className="mt-1">Pergunte sobre a produção e a qualidade do mês — eu respondo com base nos dados reais. Ou escolha uma sugestão abaixo.</p>
                </div>
              </div>
            ) : (
              msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-brand text-white" : "border border-line bg-panel/60 text-fg",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {askPending && (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <Loader2 className="size-4 animate-spin" /> Analisando…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* sugestões */}
          {msgs.length === 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.texto}
                    onClick={() => enviar(s.texto)}
                    disabled={!aiOn || askPending}
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-left text-sm text-fg-muted transition-all hover:border-brand/40 hover:text-fg disabled:opacity-50"
                  >
                    <Icon className="size-4 shrink-0 text-brand-3" />
                    {s.texto}
                  </button>
                );
              })}
            </div>
          )}

          {erro && <p className="mt-2 text-center text-xs text-danger">{erro}</p>}

          {/* input */}
          <form
            onSubmit={(e) => { e.preventDefault(); enviar(prompt); }}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/20"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pergunte sobre a produção…"
              disabled={!aiOn || askPending}
              className="h-9 flex-1 bg-transparent px-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            <Button type="submit" size="icon" disabled={!aiOn || askPending || !prompt.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* insights */}
      <Card className="h-fit">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-fg">
              <Sparkles className="size-4 text-brand-3" /> Insights
            </h3>
            <Button size="sm" variant="secondary" onClick={analisar} disabled={!aiOn || genPending}>
              {genPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Gerar
            </Button>
          </div>
          <div className="space-y-3">
            {lista.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-muted">
                Clique em “Gerar” para a IA analisar o mês.
              </p>
            ) : (
              lista.map((ins, i) => (
                <div key={i} className={cn("rounded-xl border p-3", sevClass(ins.severidade))}>
                  <p className="text-xs font-medium">{ins.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{ins.texto}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
