"use client";

import { useState } from "react";
import { Sparkles, Send, TrendingDown, Trophy, Target, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { insights } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const suggestions = [
  { icon: TrendingDown, texto: "Quais setores estão abaixo da meta?" },
  { icon: Trophy, texto: "Quem é o funcionário mais produtivo?" },
  { icon: Target, texto: "Vamos bater a meta do mês?" },
  { icon: Lightbulb, texto: "O que posso melhorar na produção?" },
];

const severityStyles = {
  sucesso: "border-success/25 bg-success/[0.07] text-success",
  alerta: "border-warning/25 bg-warning/[0.07] text-warning",
  info: "border-brand/25 bg-brand/[0.07] text-brand-3",
} as const;

export function Assistant() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* área de conversa */}
      <Card className="lg:col-span-2">
        <CardContent className="flex h-full flex-col p-5">
          {/* boas-vindas */}
          <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/[0.05] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <Sparkles className="size-4.5" />
            </span>
            <div className="text-sm leading-relaxed text-fg-muted">
              <p className="font-medium text-fg">Olá, Matheus 👋</p>
              <p className="mt-1">
                Sou o assistente da Infinite. Analiso a produção em tempo real e respondo em
                linguagem natural. Pergunte algo ou escolha uma sugestão abaixo.
              </p>
            </div>
          </div>

          {/* sugestões */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.texto}
                  onClick={() => setPrompt(s.texto)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-3.5 py-3 text-left text-sm text-fg-muted transition-all hover:border-brand/40 hover:text-fg"
                >
                  <Icon className="size-4 shrink-0 text-brand-3" />
                  {s.texto}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* input */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/20">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pergunte sobre a produção…"
              className="h-9 flex-1 bg-transparent px-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            <Button size="icon" disabled={!prompt.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-fg-subtle">
            Conexão com IA será ativada na próxima etapa (análise sobre os dados reais).
          </p>
        </CardContent>
      </Card>

      {/* insights gerados */}
      <Card className="h-fit">
        <CardContent className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-fg">
            <Sparkles className="size-4 text-brand-3" />
            Insights de hoje
          </h3>
          <div className="space-y-3">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={cn("rounded-xl border p-3", severityStyles[ins.severidade])}
              >
                <p className="text-xs font-medium">{ins.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">{ins.texto}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
