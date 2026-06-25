-- ============================================================================
-- INFINITE DASHBOARD — MÓDULO LOGÍSTICA: LISTA DE PRODUÇÃO (proposta de design)
-- Aditivo. NÃO rode ainda — é o desenho para revisão antes da implementação.
-- ----------------------------------------------------------------------------
-- Substitui a 1ª versão (loading_entries, plana) por um modelo cabeçalho+itens
-- de ERP: cada Lista de Produção tem código único (LP-2026-000124), cliente,
-- pedido, datas, prioridade, status e seus itens. Trata PEÇA × CHAPA na raiz.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAPÉIS — cargo próprio da logística
-- ----------------------------------------------------------------------------
alter type user_role add value if not exists 'logistica';

-- ----------------------------------------------------------------------------
-- 2. ENUMS da lista
-- ----------------------------------------------------------------------------
do $$ begin
  create type list_status as enum
    ('rascunho','aguardando_impressao','em_producao','producao_concluida','expedida','finalizada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type list_priority as enum ('baixa','normal','alta','urgente');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 3. UNIDADE DE PRODUÇÃO no SETOR (peça × chapa) — exceção do setor Fita
--    Todos os cálculos do dashboard passam a separar por esta coluna.
-- ----------------------------------------------------------------------------
alter table sectors
  add column if not exists tipo_producao text not null default 'peca'
  check (tipo_producao in ('peca','chapa'));

-- setor Fita trabalha por CHAPA (cria se não existir)
insert into sectors (org_id, nome, slug, meta_diaria_funcionario, cor, tipo_producao)
select o.id, 'Fita', 'fita', 0, '#a855f7', 'chapa'
from organizations o
where o.slug = 'infinite'
on conflict (org_id, slug) do update set tipo_producao = 'chapa';

-- ----------------------------------------------------------------------------
-- 4. SEQUÊNCIA do código LP-AAAA-NNNNNN (por organização e ano)
-- ----------------------------------------------------------------------------
create table if not exists list_sequences (
  org_id  uuid not null references organizations(id) on delete cascade,
  ano     int  not null,
  ultimo  int  not null default 0,
  primary key (org_id, ano)
);

create or replace function next_list_codigo(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_ano int := extract(year from now())::int; v_num int;
begin
  insert into list_sequences (org_id, ano, ultimo)
  values (p_org, v_ano, 1)
  on conflict (org_id, ano) do update set ultimo = list_sequences.ultimo + 1
  returning ultimo into v_num;
  return 'LP-' || v_ano || '-' || lpad(v_num::text, 6, '0');  -- LP-2026-000124
end; $$;

-- ----------------------------------------------------------------------------
-- 5. LISTA DE PRODUÇÃO — cabeçalho
-- ----------------------------------------------------------------------------
create table if not exists production_lists (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  codigo          text not null,                       -- LP-2026-000124
  data_producao   date not null,
  data_entrega    date,                                -- prevista
  client_id       uuid references clients(id) on delete set null,
  cliente_nome    text,                                -- alternativa livre ao catálogo
  pedido          text,
  prioridade      list_priority not null default 'normal',
  status          list_status   not null default 'rascunho',
  observacao      text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, codigo)
);
create index if not exists idx_plists_org_data on production_lists(org_id, data_producao desc);
create index if not exists idx_plists_status   on production_lists(org_id, status);

-- ----------------------------------------------------------------------------
-- 6. ITENS da lista (cabeçalho + itens)
--    linha = aba da planilha (Estantes A, Closet, Balcão...); agrupa por caminhão.
-- ----------------------------------------------------------------------------
create table if not exists production_list_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  list_id     uuid not null references production_lists(id) on delete cascade,
  linha       text not null,                           -- estantes-a | closet | balcao-a ...
  caminhao    smallint check (caminhao between 1 and 30),
  cor         text not null default 'branco' check (cor in ('branco','preto')),
  movel       text not null,
  quantidade  integer not null check (quantidade > 0),
  ordem       int default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_plitems_list on production_list_items(list_id);
create index if not exists idx_plitems_org  on production_list_items(org_id);

-- ----------------------------------------------------------------------------
-- 7. updated_at automático
-- ----------------------------------------------------------------------------
drop trigger if exists trg_plists_updated on production_lists;
create trigger trg_plists_updated before update on production_lists
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. RLS — logística (e admin) operam; gestão lê
-- ----------------------------------------------------------------------------
alter table production_lists       enable row level security;
alter table production_list_items  enable row level security;
alter table list_sequences         enable row level security;

-- leitura: cargos operacionais/gestão
do $$ declare t text; begin
  foreach t in array array['production_lists','production_list_items'] loop
    execute format('drop policy if exists pl_select on %1$s;', t);
    execute format(
      'create policy pl_select on %1$s for select
         using (org_id = auth_org_id()
                and auth_role()::text in (''admin'',''logistica'',''qualidade'',''gestor''));', t);
    execute format('drop policy if exists pl_write on %1$s;', t);
    execute format(
      'create policy pl_write on %1$s for all
         using (org_id = auth_org_id() and auth_role()::text in (''admin'',''logistica''))
         with check (org_id = auth_org_id() and auth_role()::text in (''admin'',''logistica''));', t);
  end loop;
end $$;

-- list_sequences: manipulada só pela função (security definer); sem política = negado a usuários
