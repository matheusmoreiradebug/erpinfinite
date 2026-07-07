-- ============================================================================
-- FLUXO DE PRODUÇÃO — contagem correta (sem duplicar).
-- A peça vem da Lista de Produção e percorre etapas (setores). A Jaque marca
-- o avanço. Produção real = peças na ETAPA FINAL (conta 1×). Cada setor conta
-- como produtividade, nunca somado no total.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================================

-- 1. Setores viram etapas do fluxo (ordem + flag da etapa final)
alter table sectors
  add column if not exists ordem_fluxo smallint,            -- posição no fluxo (null = fora do fluxo)
  add column if not exists etapa_final boolean not null default false;

-- ordem sugerida (montagem → fundo → acabamento → fita → expedição)
update sectors set ordem_fluxo = 10 where slug in ('estante','balcao','desmontado');
update sectors set ordem_fluxo = 20 where slug = 'fundo';
update sectors set ordem_fluxo = 30 where slug = 'acabamento';
update sectors set ordem_fluxo = 40 where slug in ('fita-de-borda','fita');

-- etapa final "Expedição" (cria se não existir); é a saída = produção real
insert into sectors (org_id, nome, slug, meta_diaria_funcionario, cor, tipo_producao, ordem_fluxo, etapa_final, ativo)
select o.id, 'Expedição', 'expedicao', 0, '#16a34a', 'peca', 50, true, true
from organizations o
where o.slug = 'infinite'
on conflict (org_id, slug) do update set ordem_fluxo = 50, etapa_final = true, ativo = true;

-- garante uma única etapa final
update sectors set etapa_final = false where slug <> 'expedicao';
update sectors set etapa_final = true  where slug = 'expedicao';

-- 2. Progresso de cada item da lista por etapa (setor)
create table if not exists list_item_stages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  list_item_id  uuid not null references production_list_items(id) on delete cascade,
  setor_id      uuid not null references sectors(id) on delete cascade,
  quantidade    int  not null default 0 check (quantidade >= 0),
  marcado_por   uuid references profiles(id) on delete set null,
  marcado_em    timestamptz not null default now(),
  unique (list_item_id, setor_id)
);

create index if not exists idx_lis_item on list_item_stages (list_item_id);
create index if not exists idx_lis_setor on list_item_stages (org_id, setor_id);

alter table list_item_stages enable row level security;

drop policy if exists lis_select on list_item_stages;
create policy lis_select on list_item_stages for select
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade','gestor','logistica'));

drop policy if exists lis_write on list_item_stages;
create policy lis_write on list_item_stages for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'))
  with check (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'));
