-- ============================================================================
-- INFINITE DASHBOARD — LISTA DE PRODUÇÃO / CARREGAMENTO (Logística)
-- Aditivo. Rode no SQL Editor do Supabase.
-- ----------------------------------------------------------------------------
-- Digitaliza a planilha "LISTA DE PRODUÇÃO": por linha de produto, por caminhão,
-- os móveis (branco/preto) e quantidades carregados no dia. A logística
-- preenche todo dia; o relatório consolida a semana para a qualidade conferir.
-- ============================================================================

create table if not exists loading_entries (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  data        date not null,
  linha       text not null,                      -- estantes-a | estantes-bc | closet | balcao-a | balcao-bc | desm
  caminhao    smallint not null check (caminhao between 1 and 30),
  cor         text not null check (cor in ('branco','preto')),
  movel       text not null,
  quantidade  integer not null check (quantidade > 0),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_loading_org_data  on loading_entries(org_id, data);
create index if not exists idx_loading_linha      on loading_entries(org_id, linha, data);

-- updated_at automático (reusa a função do Módulo 1)
drop trigger if exists trg_loading_updated on loading_entries;
create trigger trg_loading_updated before update on loading_entries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table loading_entries enable row level security;

-- leitura: cargos operacionais e de gestão da org
drop policy if exists loading_select on loading_entries;
create policy loading_select on loading_entries for select
  using (org_id = auth_org_id()
         and auth_role()::text in ('admin','qualidade','gestor','almoxarifado'));

-- escrita: logística/almoxarifado e admin
drop policy if exists loading_write on loading_entries;
create policy loading_write on loading_entries for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','almoxarifado'))
  with check (org_id = auth_org_id() and auth_role()::text in ('admin','almoxarifado'));
