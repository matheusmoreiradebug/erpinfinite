-- ============================================================================
-- INFINITE DASHBOARD — Módulo 2: QUALIDADE + RETRABALHO
-- Schema PostgreSQL (Supabase). Aditivo ao db/schema.sql (Módulo 1).
-- ----------------------------------------------------------------------------
-- Princípios (ERP industrial, estilo TOTVS/Sankhya):
--   • Multi-tenant: org_id + RLS em tudo.
--   • Fato é tabela; métrica (taxas, rankings) é VIEW derivada.
--   • Taxonomia de motivos em 2 níveis e EXTENSÍVEL (categorias + motivos).
--   • Fluxo: almoxarifado REGISTRA o retorno → qualidade (Jaque) CLASSIFICA.
--   • Retrabalho quantifica custo/tempo/material por devolução.
--   • Auditoria de tudo que é sensível.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAPÉIS / PERMISSÕES — estende o enum de cargos do Módulo 1
-- ----------------------------------------------------------------------------
-- (rode estas 2 linhas; se o editor reclamar de transação, rode-as sozinhas primeiro)
alter type user_role add value if not exists 'qualidade';
alter type user_role add value if not exists 'almoxarifado';

-- cargo do usuário autenticado (para políticas baseadas em papel)
create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- novos enums de status
do $$ begin
  create type return_status as enum ('registrado','em_analise','classificado','resolvido');
exception when duplicate_object then null; end $$;
do $$ begin
  create type rework_status as enum ('pendente','em_andamento','concluido');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. CATÁLOGOS (cadastros de apoio)
-- ============================================================================

-- 2.1 Clientes
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  nome        text not null,
  cidade      text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_clients_org on clients(org_id);

-- 2.2 Caminhões (frota)
create table if not exists trucks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  identificador text not null,          -- "Caminhão 01"
  placa        text,
  motorista    text,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, identificador)
);
create index if not exists idx_trucks_org on trucks(org_id);

-- 2.3 Produtos (com custo estimado para "valor perdido")
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  nome            text not null,
  sku             text,
  custo_unitario  numeric(12,2) default 0,   -- usado no "valor estimado perdido"
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_products_org on products(org_id);

-- 2.4 Categorias de motivo (Qualidade, Logística, Entrega, Montagem...) — EXTENSÍVEL
create table if not exists return_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  nome        text not null,
  slug        citext not null,
  cor         text default '#2563eb',
  ordem       int default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists idx_retcat_org on return_categories(org_id);

-- 2.5 Motivos de retorno (Peça riscada, Furo errado...) — EXTENSÍVEL
create table if not exists return_reasons (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  category_id  uuid not null references return_categories(id) on delete cascade,
  nome         text not null,
  ordem        int default 0,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_retreason_org on return_reasons(org_id);
create index if not exists idx_retreason_cat on return_reasons(category_id);

-- ============================================================================
-- 3. ENTREGAS (opcional) — base para "taxa de problemas por caminhão"
--    Taxa = retornos ÷ entregas. Popule para ter as taxas; sem isto, as
--    análises mostram retornos absolutos.
-- ============================================================================
create table if not exists deliveries (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  pedido      text,
  data        date not null,
  truck_id    uuid references trucks(id) on delete set null,
  client_id   uuid references clients(id) on delete set null,
  quantidade  int default 1,
  created_at  timestamptz not null default now()
);
create index if not exists idx_deliveries_org_data on deliveries(org_id, data);
create index if not exists idx_deliveries_truck on deliveries(truck_id);

-- ============================================================================
-- 4. RETORNOS / DEVOLUÇÕES — fato central do módulo
-- ----------------------------------------------------------------------------
-- Almoxarifado registra (status 'registrado', reason_id nulo).
-- Jaque analisa e classifica (define reason_id, status 'classificado').
-- ============================================================================
create table if not exists quality_returns (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations(id) on delete cascade,

  -- identificação / logística
  pedido             text,
  data_retorno       date not null,
  hora_retorno       time,
  truck_id           uuid references trucks(id) on delete set null,
  client_id          uuid references clients(id) on delete set null,

  -- origem da peça
  setor_origem_id    uuid references sectors(id) on delete set null,
  funcionario_id     uuid references employees(id) on delete set null,  -- produziu a peça
  product_id         uuid references products(id) on delete set null,
  quantidade_retornada int not null check (quantidade_retornada > 0),

  -- motivo: texto livre no registro + classificação formal pela qualidade
  motivo_inicial     text,                                              -- o que o almoxarifado descreveu
  reason_id          uuid references return_reasons(id) on delete set null,  -- classificação da Jaque
  observacao         text,

  -- financeiro (snapshot; também calculável via produto)
  valor_perdido      numeric(12,2),

  -- workflow
  status             return_status not null default 'registrado',
  registrado_por     uuid references profiles(id) on delete set null,   -- almoxarifado
  analisado_por      uuid references profiles(id) on delete set null,   -- qualidade
  analisado_em       timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_qr_org_data    on quality_returns(org_id, data_retorno);
create index if not exists idx_qr_truck        on quality_returns(truck_id);
create index if not exists idx_qr_setor        on quality_returns(setor_origem_id);
create index if not exists idx_qr_func         on quality_returns(funcionario_id);
create index if not exists idx_qr_reason       on quality_returns(reason_id);
create index if not exists idx_qr_status       on quality_returns(org_id, status);

-- 4.1 Fotos da avaria (Supabase Storage — guardamos o caminho/URL)
create table if not exists return_photos (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  return_id   uuid not null references quality_returns(id) on delete cascade,
  storage_path text not null,           -- ex.: avarias/<org>/<return>/<arquivo>.jpg
  created_at  timestamptz not null default now()
);
create index if not exists idx_retphoto_return on return_photos(return_id);

-- ============================================================================
-- 5. RETRABALHO — quanto cada devolução custou (dinheiro, tempo, material)
-- ============================================================================
create table if not exists rework (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organizations(id) on delete cascade,
  return_id            uuid not null references quality_returns(id) on delete cascade,
  setor_responsavel_id uuid references sectors(id) on delete set null,
  funcionario_id       uuid references employees(id) on delete set null,  -- quem refez
  custo_material       numeric(12,2) default 0,
  custo_mao_obra       numeric(12,2) default 0,
  tempo_minutos        int default 0,
  status               rework_status not null default 'pendente',
  observacao           text,
  concluido_em         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_rework_org on rework(org_id);
create index if not exists idx_rework_return on rework(return_id);

-- ============================================================================
-- 6. FECHAMENTO SEMANAL — snapshot gerado toda sexta (por cron/Edge Function)
-- ============================================================================
create table if not exists weekly_closings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  semana_inicio date not null,
  semana_fim    date not null,
  resumo        jsonb not null,          -- produção, qualidade, rankings, top problemas
  analise_ia    text,                    -- texto da IA especialista
  gerado_em     timestamptz not null default now(),
  unique (org_id, semana_inicio)
);
create index if not exists idx_weekly_org on weekly_closings(org_id, semana_inicio desc);

-- ============================================================================
-- 7. AUDITORIA — quem fez o quê
-- ============================================================================
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  acao        text not null,             -- 'criar' | 'editar' | 'classificar' | 'excluir'
  entidade    text not null,             -- 'quality_returns' | 'rework' | ...
  entidade_id uuid,
  dados       jsonb,                     -- antes/depois
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_org on audit_logs(org_id, created_at desc);

-- ============================================================================
-- 8. updated_at automático nas novas tabelas
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'clients','trucks','products','quality_returns','rework'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 9. VIEWS DE ANÁLISE
-- ============================================================================

-- 9.1 Retornos por SETOR (com produção do M1 para a taxa de retorno)
create or replace view v_qualidade_por_setor as
select
  s.org_id,
  s.id                                   as setor_id,
  s.nome                                 as setor_nome,
  coalesce(p.producao, 0)                as producao_total,
  coalesce(r.retornos, 0)                as pecas_retornadas,
  round(coalesce(r.retornos,0)::numeric / nullif(p.producao,0), 4) as taxa_retorno
from sectors s
left join (
  select setor_id, sum(quantidade_produzida) producao
  from production_entries group by setor_id
) p on p.setor_id = s.id
left join (
  select setor_origem_id, sum(quantidade_retornada) retornos
  from quality_returns group by setor_origem_id
) r on r.setor_origem_id = s.id;

-- 9.2 Retornos por FUNCIONÁRIO (taxa de erro + ranking de qualidade)
create or replace view v_qualidade_por_funcionario as
select
  e.org_id,
  e.id                                   as funcionario_id,
  e.nome                                 as funcionario_nome,
  coalesce(p.producao, 0)                as producao_total,
  coalesce(r.retornos, 0)                as pecas_retornadas,
  round(coalesce(r.retornos,0)::numeric / nullif(p.producao,0), 4) as taxa_erro
from employees e
left join (
  select funcionario_id, sum(quantidade_produzida) producao
  from production_entries group by funcionario_id
) p on p.funcionario_id = e.id
left join (
  select funcionario_id, sum(quantidade_retornada) retornos
  from quality_returns group by funcionario_id
) r on r.funcionario_id = e.id;

-- 9.3 Análise por CAMINHÃO (entregas × retornos = taxa de problemas)
create or replace view v_qualidade_por_caminhao as
select
  t.org_id,
  t.id                                   as truck_id,
  t.identificador,
  coalesce(d.entregas, 0)                as entregas,
  coalesce(r.retornos, 0)                as retornos,
  round(coalesce(r.retornos,0)::numeric / nullif(d.entregas,0), 4) as taxa_problemas
from trucks t
left join (
  select truck_id, count(*) entregas from deliveries group by truck_id
) d on d.truck_id = t.id
left join (
  select truck_id, count(*) retornos from quality_returns group by truck_id
) r on r.truck_id = t.id;

-- 9.4 Retornos por CATEGORIA (qualidade/logística/entrega/montagem)
create or replace view v_qualidade_por_categoria as
select
  qr.org_id,
  c.id                                   as categoria_id,
  c.nome                                 as categoria,
  qr.data_retorno,
  count(*)                               as ocorrencias,
  sum(qr.quantidade_retornada)           as pecas
from quality_returns qr
join return_reasons   rr on rr.id = qr.reason_id
join return_categories c on c.id = rr.category_id
group by qr.org_id, c.id, c.nome, qr.data_retorno;

-- 9.5 Custo de RETRABALHO consolidado
create or replace view v_retrabalho_custo as
select
  org_id,
  date_trunc('month', created_at)::date  as mes,
  count(*)                               as ordens,
  sum(custo_material + custo_mao_obra)   as custo_total,
  sum(tempo_minutos)                     as tempo_total_min
from rework
group by org_id, date_trunc('month', created_at);

-- ============================================================================
-- 10. SEED — taxonomia padrão de motivos (do briefing). Idempotente.
-- ============================================================================
insert into return_categories (org_id, nome, slug, cor, ordem)
select o.id, v.nome, v.slug, v.cor, v.ordem
from organizations o
cross join (values
  ('Qualidade','qualidade','#ef4444',1),
  ('Logística','logistica','#f59e0b',2),
  ('Entrega','entrega','#3b82f6',3),
  ('Montagem','montagem','#22c55e',4)
) as v(nome, slug, cor, ordem)
where o.slug='infinite'
on conflict (org_id, slug) do nothing;

insert into return_reasons (org_id, category_id, nome, ordem)
select o.id, c.id, v.motivo, v.ordem
from organizations o
join return_categories c on c.org_id = o.id
join (values
  ('qualidade','Peça riscada',1),
  ('qualidade','Furo errado',2),
  ('qualidade','Medida incorreta',3),
  ('qualidade','Cor diferente',4),
  ('qualidade','Acabamento defeituoso',5),
  ('qualidade','Peça quebrada',6),
  ('logistica','Avaria no transporte',1),
  ('logistica','Problema no caminhão',2),
  ('logistica','Falta de proteção',3),
  ('logistica','Carregamento incorreto',4),
  ('entrega','Horário incorreto',1),
  ('entrega','Produto errado',2),
  ('entrega','Falta de peças',3),
  ('montagem','Erro do montador',1),
  ('montagem','Montagem incorreta',2)
) as v(cat_slug, motivo, ordem) on v.cat_slug = c.slug
where o.slug='infinite'
  and not exists (
    select 1 from return_reasons rr
    where rr.org_id = o.id and rr.category_id = c.id and rr.nome = v.motivo
  );

-- ============================================================================
-- 11. RLS — isolamento por organização + permissões por papel
-- ============================================================================
alter table clients           enable row level security;
alter table trucks            enable row level security;
alter table products          enable row level security;
alter table return_categories enable row level security;
alter table return_reasons    enable row level security;
alter table deliveries        enable row level security;
alter table quality_returns   enable row level security;
alter table return_photos     enable row level security;
alter table rework            enable row level security;
alter table weekly_closings   enable row level security;
alter table audit_logs        enable row level security;

-- 11.1 Leitura: qualquer usuário enxerga os dados da própria organização
do $$
declare t text;
begin
  foreach t in array array[
    'clients','trucks','products','return_categories','return_reasons',
    'deliveries','quality_returns','return_photos','rework','weekly_closings'
  ]
  loop
    execute format('drop policy if exists qa_select on %1$s;', t);
    execute format(
      'create policy qa_select on %1$s for select
         using (org_id = auth_org_id());', t);
  end loop;
end $$;

-- 11.2 Catálogos operacionais (clientes/caminhões/produtos/entregas):
--      admin, qualidade e almoxarifado podem cadastrar
do $$
declare t text;
begin
  foreach t in array array['clients','trucks','products','deliveries']
  loop
    execute format('drop policy if exists qa_write on %1$s;', t);
    execute format(
      'create policy qa_write on %1$s for all
         using (org_id = auth_org_id() and auth_role()::text in (''admin'',''qualidade'',''almoxarifado''))
         with check (org_id = auth_org_id());', t);
  end loop;
end $$;

-- 11.3 Taxonomia (categorias/motivos): admin e qualidade
do $$
declare t text;
begin
  foreach t in array array['return_categories','return_reasons']
  loop
    execute format('drop policy if exists qa_write on %1$s;', t);
    execute format(
      'create policy qa_write on %1$s for all
         using (org_id = auth_org_id() and auth_role()::text in (''admin'',''qualidade''))
         with check (org_id = auth_org_id());', t);
  end loop;
end $$;

-- 11.4 Retornos: almoxarifado/qualidade/admin INSEREM; qualidade/admin EDITAM (classificam)
drop policy if exists qr_insert on quality_returns;
create policy qr_insert on quality_returns for insert
  with check (org_id = auth_org_id()
              and auth_role()::text in ('admin','qualidade','almoxarifado'));

drop policy if exists qr_update on quality_returns;
create policy qr_update on quality_returns for update
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'))
  with check (org_id = auth_org_id());

drop policy if exists qr_delete on quality_returns;
create policy qr_delete on quality_returns for delete
  using (org_id = auth_org_id() and auth_role()::text = 'admin');

-- 11.5 Fotos: quem registra o retorno também envia foto
drop policy if exists rp_write on return_photos;
create policy rp_write on return_photos for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade','almoxarifado'))
  with check (org_id = auth_org_id());

-- 11.6 Retrabalho: admin e qualidade
drop policy if exists rw_write on rework;
create policy rw_write on rework for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'))
  with check (org_id = auth_org_id());

-- 11.7 Fechamento semanal: gravação por admin (ou service role no cron)
drop policy if exists wc_write on weekly_closings;
create policy wc_write on weekly_closings for all
  using (org_id = auth_org_id() and auth_role()::text = 'admin')
  with check (org_id = auth_org_id());

-- 11.8 Auditoria: somente admin lê
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select
  using (org_id = auth_org_id() and auth_role()::text = 'admin');
