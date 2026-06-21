"use client";

import { useState } from "react";
import { Truck, Building2, Package, Tags } from "lucide-react";
import { CatalogManager, type CatalogField } from "./catalog-manager";
import { cn } from "@/lib/utils";
import type { ManageCatalogs } from "@/lib/data/quality";

const tabs = [
  { key: "trucks", label: "Caminhões", icon: Truck },
  { key: "clients", label: "Clientes", icon: Building2 },
  { key: "products", label: "Produtos", icon: Package },
  { key: "motivos", label: "Motivos", icon: Tags },
] as const;

export function CatalogsTabs({ data }: { data: ManageCatalogs }) {
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("trucks");

  const truckFields: CatalogField[] = [
    { key: "identificador", label: "Identificador", required: true, placeholder: "Caminhão 01" },
    { key: "placa", label: "Placa" },
    { key: "motorista", label: "Motorista" },
  ];
  const clientFields: CatalogField[] = [
    { key: "nome", label: "Nome", required: true },
    { key: "cidade", label: "Cidade" },
  ];
  const productFields: CatalogField[] = [
    { key: "nome", label: "Nome", required: true },
    { key: "sku", label: "SKU" },
    { key: "custo_unitario", label: "Custo (R$)", type: "number", hint: "Usado no valor perdido" },
  ];
  const categoryFields: CatalogField[] = [
    { key: "nome", label: "Nome", required: true },
    { key: "cor", label: "Cor", type: "color" },
  ];
  const reasonFields: CatalogField[] = [
    { key: "nome", label: "Motivo", required: true },
    {
      key: "category_id",
      label: "Categoria",
      type: "select",
      options: data.categories.map((c) => ({ value: c.id, label: c.nome })),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                active === t.key
                  ? "border-brand bg-brand/15 text-fg"
                  : "border-line text-fg-muted hover:bg-elevated hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {active === "trucks" && (
        <CatalogManager type="trucks" novoLabel="Novo caminhão" fields={truckFields} items={data.trucks} />
      )}
      {active === "clients" && (
        <CatalogManager type="clients" novoLabel="Novo cliente" fields={clientFields} items={data.clients} />
      )}
      {active === "products" && (
        <CatalogManager type="products" novoLabel="Novo produto" fields={productFields} items={data.products} />
      )}
      {active === "motivos" && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-muted">Categorias</h3>
            <CatalogManager type="categories" novoLabel="Nova categoria" fields={categoryFields} items={data.categories} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-muted">Motivos</h3>
            <CatalogManager type="reasons" novoLabel="Novo motivo" fields={reasonFields} items={data.reasons} />
          </div>
        </div>
      )}
    </div>
  );
}
