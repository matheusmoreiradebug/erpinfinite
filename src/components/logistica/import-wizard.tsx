"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Truck, Package, Boxes, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, inputClass } from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import { linhaLabel } from "@/lib/logistica";
import { previewListaImport, confirmListaImport, type ImportPreview } from "@/app/(app)/logistica/importar/actions";

const hoje = () => new Date().toISOString().slice(0, 10);

export function ImportWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [dataProducao, setDataProducao] = useState(hoje());
  const [dataEntrega, setDataEntrega] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();

  const ler = (file: File) => {
    setError(null);
    setPreview(null);
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    startReading(async () => {
      const res = await previewListaImport(fd);
      if (!res.ok || !res.preview) setError(res.error ?? "Falha ao ler a planilha.");
      else setPreview(res.preview);
    });
  };

  const confirmar = () => {
    if (!preview) return;
    setError(null);
    startSaving(async () => {
      const res = await confirmListaImport({
        dataProducao,
        dataEntrega: dataEntrega || null,
        linhas: preview.linhas,
      });
      if (!res.ok || !res.id) setError(res.error ?? "Falha ao importar.");
      else router.push(`/logistica/${res.id}`);
    });
  };

  const s = preview?.stats;
  const avisosInvalidos = preview?.avisos.filter((a) => a.tipo === "invalido") ?? [];
  const avisosDup = preview?.avisos.filter((a) => a.tipo === "duplicado") ?? [];

  return (
    <div className="space-y-6">
      {/* upload */}
      <Card>
        <CardContent className="p-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) ler(f);
            }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-10 text-center"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-brand/15 text-brand-3">
              <FileSpreadsheet className="size-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">Arraste a planilha ou selecione o arquivo</p>
              <p className="text-xs text-fg-subtle">Excel (.xlsx) da Lista de Produção — o mesmo do Google Drive</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) ler(f);
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={reading}>
              {reading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {fileName ? "Trocar arquivo" : "Escolher arquivo"}
            </Button>
            {fileName && <p className="text-xs text-fg-muted">{fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/[0.07] px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      {reading && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" /> Lendo a planilha…
        </p>
      )}

      {/* pré-visualização */}
      {preview && s && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat icon={<Boxes className="size-4" />} label="Linhas" value={s.linhasLidas} />
            <Stat icon={<Truck className="size-4" />} label="Caminhões" value={s.caminhoes} />
            <Stat icon={<Package className="size-4" />} label="Itens" value={s.itens} />
            <Stat icon={<Package className="size-4" />} label="Peças" value={s.pecas} accent />
            <Stat icon={<Ban className="size-4" />} label="Inválidos" value={s.invalidos} warn={s.invalidos > 0} />
            <Stat icon={<AlertTriangle className="size-4" />} label="Duplicidades" value={s.duplicados} warn={s.duplicados > 0} />
          </div>

          {/* por linha */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                    <th className="px-4 py-3 font-medium">Linha (aba)</th>
                    <th className="px-4 py-3 text-right font-medium">Caminhões</th>
                    <th className="px-4 py-3 text-right font-medium">Itens</th>
                    <th className="px-4 py-3 text-right font-medium">Peças</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.linhas.map((L) => {
                    const ni = L.caminhoes.reduce((a, c) => a + c.itens.length, 0);
                    const pc = L.caminhoes.reduce((a, c) => a + c.itens.reduce((s2, i) => s2 + i.quantidade, 0), 0);
                    return (
                      <tr key={L.aba} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5 text-fg">
                          {L.linha ? linhaLabel(L.linha) : <span className="text-warning">{L.aba} (linha não reconhecida)</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-fg-muted">{L.caminhoes.length}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-fg-muted">{ni}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-fg">{formatNumber(pc)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* móveis não cadastrados */}
          {preview.moveisNaoCadastrados.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertTriangle className="size-4" /> {preview.moveisNaoCadastrados.length} móveis não cadastrados no catálogo
                </p>
                <p className="mb-3 text-xs text-fg-subtle">
                  Serão importados mesmo assim (o nome é gravado no item). Cadastre-os depois se quiser cruzar com qualidade/custos.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.moveisNaoCadastrados.slice(0, 40).map((m) => (
                    <span key={m} className="rounded-md border border-line bg-panel/60 px-2 py-1 text-xs text-fg-muted">{m}</span>
                  ))}
                  {preview.moveisNaoCadastrados.length > 40 && (
                    <span className="px-2 py-1 text-xs text-fg-subtle">+{preview.moveisNaoCadastrados.length - 40}…</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* avisos de linhas inválidas / duplicadas */}
          {(avisosInvalidos.length > 0 || avisosDup.length > 0) && (
            <Card>
              <CardContent className="space-y-1.5 p-4 text-xs">
                {avisosInvalidos.map((a, i) => (
                  <p key={"inv" + i} className="text-fg-muted"><span className="text-danger">Inválido</span> · {a.aba}: {a.detalhe}</p>
                ))}
                {avisosDup.map((a, i) => (
                  <p key={"dup" + i} className="text-fg-muted"><span className="text-warning">Duplicado</span> · {a.aba}: {a.detalhe}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* datas + confirmar */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                <Field label="Data de produção">
                  <input type="date" value={dataProducao} onChange={(e) => setDataProducao(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Data de entrega (opcional)">
                  <input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Button onClick={confirmar} disabled={saving || s.itens === 0}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Confirmar importação ({formatNumber(s.itens)} itens)
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent, warn }: { icon: React.ReactNode; label: string; value: number; accent?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3", warn ? "border-warning/30 bg-warning/[0.06]" : accent ? "border-brand/30 bg-brand/[0.06]" : "border-line bg-panel/60")}>
      <span className={cn("flex items-center gap-1.5 text-xs", warn ? "text-warning" : "text-fg-subtle")}>{icon}{label}</span>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", accent ? "text-brand-3" : "text-fg")}>{formatNumber(value)}</p>
    </div>
  );
}
