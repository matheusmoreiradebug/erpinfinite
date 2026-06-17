"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Save, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatPercent, aproveitamentoStatus } from "@/lib/utils";
import { saveProduction } from "@/app/(app)/producao/actions";
import type { SectorDTO, EmployeeDTO } from "@/lib/data/queries";

type Row = { key: string; empId?: string; nome: string; qtd: string };

let counter = 0;
const newKey = () => `row-${counter++}`;

export function QuickLaunch({
  sectors,
  employees,
}: {
  sectors: SectorDTO[];
  employees: EmployeeDTO[];
}) {
  const [sectorId, setSectorId] = useState(sectors[0]?.id ?? "");
  const [data, setData] = useState("2026-06-17");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sector = sectors.find((s) => s.id === sectorId) ?? sectors[0];

  const initialRows = useMemo<Row[]>(
    () =>
      employees
        .filter((e) => e.setorId === sectorId)
        .map((e) => ({ key: newKey(), empId: e.id, nome: e.nome, qtd: "" })),
    [sectorId, employees],
  );
  const [rows, setRows] = useState<Row[]>(initialRows);

  // recarrega a lista ao trocar de setor
  const [lastSector, setLastSector] = useState(sectorId);
  if (lastSector !== sectorId) {
    setLastSector(sectorId);
    setRows(initialRows);
    setSaved(false);
  }

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));
  const addRow = () => setRows((rs) => [...rs, { key: newKey(), nome: "", qtd: "" }]);

  // cálculos em tempo real
  const presentes = rows.filter((r) => Number(r.qtd) > 0);
  const headcount = presentes.length;
  const total = presentes.reduce((acc, r) => acc + Number(r.qtd), 0);
  const metaEquipe = headcount * sector.metaIndividual;
  const aproveitamento = metaEquipe > 0 ? total / metaEquipe : 0;
  const media = headcount > 0 ? total / headcount : 0;
  const status = aproveitamentoStatus(aproveitamento);

  const statusBadge = {
    critico: { variant: "danger" as const, label: "Crítico" },
    alerta: { variant: "warning" as const, label: "Atenção" },
    ok: { variant: "brand" as const, label: "Bom" },
    otimo: { variant: "success" as const, label: "Ótimo" },
  }[status];

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveProduction({
        sectorId,
        data,
        rows: presentes.map((r) => ({ empId: r.empId, nome: r.nome, qtd: Number(r.qtd) })),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2400);
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* formulário */}
      <Card className="lg:col-span-2">
        <CardContent className="p-5">
          {/* seletor de setor */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {sectors.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectorId(s.id)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                  s.id === sectorId
                    ? "border-brand bg-brand/15 text-fg"
                    : "border-line text-fg-muted hover:bg-elevated hover:text-fg",
                )}
              >
                {s.nome}
              </button>
            ))}
          </div>

          {/* data + meta individual */}
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">Data</span>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-fg focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">Meta por funcionário</span>
              <div className="flex h-10 items-center rounded-xl border border-line bg-elevated px-3 text-sm font-medium text-fg">
                {sector.metaIndividual} peças
              </div>
            </div>
          </div>

          {/* linhas */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_40px] gap-2 px-1 text-xs font-medium text-fg-subtle">
              <span>Funcionário</span>
              <span>Quantidade</span>
              <span />
            </div>
            {rows.map((r) => {
              const meta = sector.metaIndividual;
              const pct = Number(r.qtd) > 0 ? Number(r.qtd) / meta : 0;
              return (
                <div key={r.key} className="grid grid-cols-[1fr_120px_40px] items-center gap-2">
                  <input
                    value={r.nome}
                    onChange={(e) => updateRow(r.key, { nome: e.target.value, empId: undefined })}
                    placeholder="Nome do funcionário"
                    className="h-11 rounded-xl border border-line bg-panel px-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <div className="relative">
                    <input
                      value={r.qtd}
                      onChange={(e) =>
                        updateRow(r.key, { qtd: e.target.value.replace(/\D/g, "") })
                      }
                      inputMode="numeric"
                      placeholder="0"
                      className={cn(
                        "h-11 w-full rounded-xl border bg-panel px-3 text-sm font-medium text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20",
                        Number(r.qtd) > 0
                          ? pct >= 1
                            ? "border-success/40"
                            : pct >= 0.7
                              ? "border-brand/40"
                              : "border-warning/40"
                          : "border-line focus:border-brand/50",
                      )}
                    />
                  </div>
                  <button
                    onClick={() => removeRow(r.key)}
                    className="grid size-9 place-items-center rounded-xl text-fg-subtle transition-colors hover:bg-danger/15 hover:text-danger"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addRow}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-brand/40 hover:text-fg"
          >
            <Plus className="size-4" />
            Adicionar funcionário
          </button>
        </CardContent>
      </Card>

      {/* resumo em tempo real */}
      <Card className="h-fit lg:sticky lg:top-20">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-fg">Resumo do lançamento</h3>
            {headcount > 0 && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
          </div>

          {/* aproveitamento destaque */}
          <div className="rounded-2xl border border-line bg-elevated/60 p-4 text-center">
            <p className="text-xs text-fg-subtle">Aproveitamento da meta</p>
            <p
              className={cn(
                "mt-1 text-4xl font-semibold tabular-nums",
                status === "critico"
                  ? "text-danger"
                  : status === "alerta"
                    ? "text-warning"
                    : status === "otimo"
                      ? "text-success"
                      : "text-brand-3",
              )}
            >
              {formatPercent(aproveitamento)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  status === "critico"
                    ? "bg-danger"
                    : status === "alerta"
                      ? "bg-warning"
                      : status === "otimo"
                        ? "bg-success"
                        : "bg-brand",
                )}
                style={{ width: `${Math.min(aproveitamento * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* métricas */}
          <dl className="mt-4 space-y-px overflow-hidden rounded-xl border border-line">
            <Metric label="Funcionários no dia" value={formatNumber(headcount)} />
            <Metric label="Produção total" value={`${formatNumber(total)} pç`} />
            <Metric label="Meta da equipe" value={`${formatNumber(metaEquipe)} pç`} />
            <Metric label="Média por funcionário" value={media.toFixed(1)} />
          </dl>

          <Button
            onClick={handleSave}
            disabled={headcount === 0 || pending}
            className="mt-4 w-full"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Salvando…
              </>
            ) : saved ? (
              <>
                <Check className="size-4" /> Lançamento salvo
              </>
            ) : (
              <>
                <Save className="size-4" /> Salvar produção
              </>
            )}
          </Button>
          {error ? (
            <p className="mt-2 text-center text-[11px] text-danger">{error}</p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-fg-subtle">
              A meta da equipe ajusta sozinha conforme o nº de presentes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-panel/60 px-3.5 py-2.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-fg">{value}</dd>
    </div>
  );
}
