# Infinite Dashboard

Sistema interno de controle de produção da fábrica **Infinite Móveis** — substitui as planilhas manuais de RH e financeiro por um painel rápido, visual e inteligente.

> Arquitetado como ERP industrial multi-tenant, para evoluir até um produto comercial vendável a outras indústrias.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Recharts |
| Backend | Supabase (PostgreSQL + Auth) |
| Relatórios | Geração de PDF |
| IA | Assistente Inteligente de insights |

## Módulo 1 — Produção

- Cadastro de setores (meta por funcionário/dia, meta mensal)
- Cadastro de funcionários
- Lançamento diário rápido de produção
- Dashboard com KPIs, ranking e gráficos
- Relatórios em PDF
- Alertas automáticos (aproveitamento < 70%, queda nos últimos 7 dias)
- Assistente Inteligente (insights sobre os dados)

## Decisões de modelagem (lições da planilha real)

- A **meta diária é por funcionário** — a meta da equipe é dinâmica: `meta_individual × nº de presentes no dia`.
- Um funcionário **pode produzir em setores diferentes** — por isso `setor_id` fica na linha de produção.
- Todo **número é calculado em views**, nunca duplicado no banco.
- Estrutura **multi-tenant** (`org_id` + Row Level Security) desde o início.

## Estrutura

```
db/
  schema.sql        Schema PostgreSQL (tabelas, views, RLS)
app/                Next.js App Router (em construção)
src/                core / services / infra / components (em construção)
```

## Banco de dados

O schema completo está em [`db/schema.sql`](db/schema.sql). Rode no SQL Editor do Supabase para criar tabelas, views e políticas de segurança.

---

🤖 Desenvolvido com apoio do [Claude Code](https://claude.com/claude-code)
