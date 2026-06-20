"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageX, Plus, Upload, Loader2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { QualityCatalogs, NamedItem } from "@/lib/data/quality";
import { createReturn } from "@/app/(app)/qualidade/actions";

/** Select de catálogo com opção de cadastrar um novo item na hora. */
function CatalogPicker({
  name,
  label,
  items,
  placeholderNovo,
}: {
  name: "truck" | "client" | "product";
  label: string;
  items: NamedItem[];
  placeholderNovo: string;
}) {
  const [novo, setNovo] = useState(false);
  return (
    <Field label={label}>
      {novo ? (
        <div className="flex gap-2">
          <input name={`${name}_novo`} placeholder={placeholderNovo} className={inputClass} autoFocus />
          <button
            type="button"
            onClick={() => setNovo(false)}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-fg-subtle hover:bg-elevated"
            aria-label="Cancelar"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select name={`${name}_id`} className={inputClass} defaultValue="">
            <option value="">Selecione…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setNovo(true)}
            className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-line px-3 text-xs font-medium text-fg-muted hover:bg-elevated hover:text-fg"
          >
            <Plus className="size-3.5" /> Novo
          </button>
        </div>
      )}
    </Field>
  );
}

export function ReturnForm({ catalogs }: { catalogs: QualityCatalogs }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);

  const hoje = new Date().toISOString().slice(0, 10);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createReturn(fd);
      if (res.ok) {
        setDone(true);
        formRef.current?.reset();
        setFotos([]);
        setTimeout(() => setDone(false), 2600);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao registrar.");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Pedido">
                <input name="pedido" placeholder="Nº" className={inputClass} />
              </Field>
              <Field label="Data">
                <input type="date" name="data_retorno" defaultValue={hoje} className={inputClass} required />
              </Field>
              <Field label="Hora">
                <input type="time" name="hora_retorno" className={inputClass} />
              </Field>
              <Field label="Quantidade">
                <input type="number" name="quantidade" min={1} placeholder="0" className={inputClass} required />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CatalogPicker name="truck" label="Caminhão responsável" items={catalogs.trucks} placeholderNovo="Ex.: Caminhão 04" />
              <CatalogPicker name="client" label="Cliente" items={catalogs.clients} placeholderNovo="Nome do cliente" />
              <Field label="Setor de origem">
                <select name="setor_origem_id" className={inputClass} defaultValue="">
                  <option value="">Selecione…</option>
                  {catalogs.sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </Field>
              <Field label="Funcionário (produziu a peça)">
                <select name="funcionario_id" className={inputClass} defaultValue="">
                  <option value="">Selecione…</option>
                  {catalogs.employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </Field>
              <CatalogPicker name="product" label="Produto" items={catalogs.products} placeholderNovo="Nome do produto" />
              <Field label="Motivo (descrição inicial)" hint="A qualidade classifica depois">
                <input name="motivo_inicial" placeholder="O que houve com a peça" className={inputClass} />
              </Field>
            </div>

            <Field label="Observação">
              <textarea name="observacao" rows={2} placeholder="Detalhes adicionais…" className={cn(inputClass, "h-auto py-2")} />
            </Field>
          </CardContent>
        </Card>

        {/* fotos + envio */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="space-y-4 p-5">
            <Field label="Fotos da avaria" hint="Pode anexar várias">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line py-6 text-center transition-colors hover:border-brand/40">
                <Upload className="size-5 text-brand-3" />
                <span className="text-xs text-fg-muted">Clique para anexar imagens</span>
                <input
                  type="file"
                  name="fotos"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setFotos(Array.from(e.target.files ?? []).map((f) => f.name))
                  }
                />
              </label>
            </Field>
            {fotos.length > 0 && (
              <ul className="space-y-1">
                {fotos.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 truncate text-xs text-fg-muted">
                    <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                    {n}
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button type="submit" disabled={pending} size="lg" className="w-full">
              {pending ? (
                <><Loader2 className="size-4 animate-spin" /> Registrando…</>
              ) : done ? (
                <><Check className="size-4" /> Retorno registrado</>
              ) : (
                <><PackageX className="size-4" /> Registrar retorno</>
              )}
            </Button>
            <p className="text-center text-[11px] text-fg-subtle">
              O registro entra na fila da qualidade para classificação.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
