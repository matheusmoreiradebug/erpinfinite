-- ============================================================================
-- INFINITE DASHBOARD — Schema PostgreSQL (Supabase)
-- Módulo 1: Produção
-- ----------------------------------------------------------------------------
-- Arquiteto: pensar como ERP industrial multi-tenant (vendável a outras
-- fábricas no futuro). Tudo que é "fato" é tabela; tudo que é "métrica"
-- é VIEW derivada — nunca duplicar números calculados no banco.
--
-- DESCOBERTA-CHAVE da planilha (Infinite Móveis, junho/2026):
--   A "meta diária" do setor é, na verdade, uma META POR FUNCIONÁRIO.
--   A meta da EQUIPE no dia = meta_individual × nº de funcionários que
--   produziram naquele dia. (Acabamento: 50/func → 6 func = 300; 4 func = 200.)
--   Por isso a meta diária da equipe é DINÂMICA e não pode ser uma coluna fixa.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- nomes/slug case-insensitive

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'gestor', 'operador', 'viewer');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. MULTI-TENANT (base para virar SaaS)
-- ============================================================================
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Perfis ligados ao Supabase Auth (auth.users). 1 usuário ⇄ 1 perfil.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'operador',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_profiles_org on profiles(org_id);

-- ============================================================================
-- 2. DOMÍNIO — SETORES
-- ============================================================================
create table if not exists sectors (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references organizations(id) on delete cascade,
  nome                    text not null,
  slug                    citext not null,
  -- meta de peças POR FUNCIONÁRIO por dia (semântica real da planilha)
  meta_diaria_funcionario integer not null default 0 check (meta_diaria_funcionario >= 0),
  -- meta fixa mensal do setor (opcional; usada em "Meta x Realizado" do mês)
  meta_mensal             integer check (meta_mensal is null or meta_mensal >= 0),
  cor                     text default '#2563EB',   -- cor de identificação na UI
  ativo                   boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists idx_sectors_org on sectors(org_id);

-- ============================================================================
-- 3. DOMÍNIO — FUNCIONÁRIOS
-- ============================================================================
create table if not exists employees (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  nome            text not null,
  -- setor "casa" / padrão. NULLABLE de propósito: a planilha mostra
  -- funcionários produzindo em setores diferentes (Gabriel, Gustavo, Abraão).
  setor_id        uuid references sectors(id) on delete set null,
  matricula       text,
  data_admissao   date,
  data_desligamento date,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, matricula)
);
create index if not exists idx_employees_org on employees(org_id);
create index if not exists idx_employees_setor on employees(setor_id);

-- ============================================================================
-- 4. FATO CENTRAL — PRODUÇÃO DIÁRIA
-- ----------------------------------------------------------------------------
-- Grão: 1 linha = (funcionário, setor, dia). O setor é registrado na linha
-- (não herdado do funcionário) porque a pessoa pode produzir em setores
-- diferentes em dias diferentes.
-- ============================================================================
create table if not exists production_entries (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organizations(id) on delete cascade,
  funcionario_id        uuid not null references employees(id) on delete restrict,
  setor_id              uuid not null references sectors(id) on delete restrict,
  data                  date not null,
  quantidade_produzida  integer not null check (quantidade_produzida >= 0),
  -- snapshot da meta individual vigente no dia (preserva histórico se a meta
  -- do setor mudar depois). Preenchido no momento do lançamento.
  meta_individual_snapshot integer check (meta_individual_snapshot >= 0),
  observacao            text,
  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- impede lançamento duplicado do mesmo funcionário/setor/dia
  unique (funcionario_id, setor_id, data)
);
create index if not exists idx_prod_org_data    on production_entries(org_id, data);
create index if not exists idx_prod_setor_data  on production_entries(setor_id, data);
create index if not exists idx_prod_func_data   on production_entries(funcionario_id, data);

-- ============================================================================
-- 5. IA — INSIGHTS GERADOS (cache das análises do Assistente Inteligente)
-- ============================================================================
create table if not exists ai_insights (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  escopo      text not null,            -- 'geral' | 'setor:<id>' | 'funcionario:<id>'
  severidade  text not null default 'info' check (severidade in ('info','sucesso','alerta','critico')),
  titulo      text not null,
  conteudo    text not null,
  periodo_ini date,
  periodo_fim date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_ai_org on ai_insights(org_id, created_at desc);

-- ============================================================================
-- 6. GATILHO — updated_at automático
-- ============================================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['organizations','profiles','sectors','employees','production_entries']
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 7. VIEWS DERIVADAS — toda métrica é calculada, nunca armazenada
-- ============================================================================

-- 7.1 Produção consolidada do SETOR por DIA (meta dinâmica = meta_ind × headcount)
create or replace view v_producao_setor_dia as
select
  p.org_id,
  p.setor_id,
  s.nome                                   as setor_nome,
  p.data,
  count(distinct p.funcionario_id)         as funcionarios_no_dia,
  sum(p.quantidade_produzida)              as producao_total,
  count(distinct p.funcionario_id) * s.meta_diaria_funcionario as meta_equipe_dia,
  round(
    sum(p.quantidade_produzida)::numeric
    / nullif(count(distinct p.funcionario_id) * s.meta_diaria_funcionario, 0)
  , 4)                                       as aproveitamento
from production_entries p
join sectors s on s.id = p.setor_id
group by p.org_id, p.setor_id, s.nome, p.data, s.meta_diaria_funcionario;

-- 7.2 Ranking / produção por FUNCIONÁRIO no mês corrente
create or replace view v_producao_funcionario_mes as
select
  p.org_id,
  p.funcionario_id,
  e.nome                       as funcionario_nome,
  date_trunc('month', p.data)::date as mes,
  count(distinct p.data)       as dias_produzidos,
  sum(p.quantidade_produzida)  as producao_mes,
  round(avg(p.quantidade_produzida), 1) as media_diaria
from production_entries p
join employees e on e.id = p.funcionario_id
group by p.org_id, p.funcionario_id, e.nome, date_trunc('month', p.data);

-- 7.3 KPIs do dashboard (totais por organização e dia)
create or replace view v_dashboard_kpis as
select
  org_id,
  data,
  sum(quantidade_produzida)        as producao_dia,
  count(distinct funcionario_id)   as funcionarios_ativos_dia,
  count(distinct setor_id)         as setores_ativos_dia
from production_entries
group by org_id, data;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (isolamento por organização — pronto p/ multi-tenant)
-- ============================================================================
alter table organizations     enable row level security;
alter table profiles          enable row level security;
alter table sectors           enable row level security;
alter table employees         enable row level security;
alter table production_entries enable row level security;
alter table ai_insights       enable row level security;

-- helper: org_id do usuário autenticado
create or replace function auth_org_id() returns uuid as $$
  select org_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- política genérica: usuário só enxerga/edita dados da própria organização
do $$
declare t text;
begin
  foreach t in array array['sectors','employees','production_entries','ai_insights']
  loop
    execute format('drop policy if exists org_isolation on %1$s;', t);
    execute format(
      'create policy org_isolation on %1$s
         using (org_id = auth_org_id())
         with check (org_id = auth_org_id());', t);
  end loop;
end $$;

-- profiles: cada um lê os perfis da própria org
drop policy if exists org_isolation on profiles;
create policy org_isolation on profiles
  using (org_id = auth_org_id());
