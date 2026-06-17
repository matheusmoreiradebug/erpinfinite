-- ============================================================================
-- INFINITE DASHBOARD — Seed (dados reais de junho/2026)
-- Rode DEPOIS de db/schema.sql, no SQL Editor do Supabase.
-- Idempotente: pode rodar mais de uma vez sem duplicar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Organização
-- ----------------------------------------------------------------------------
insert into organizations (name, slug)
values ('Infinite Móveis', 'infinite')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Setores (meta por funcionário/dia)
-- ----------------------------------------------------------------------------
insert into sectors (org_id, nome, slug, meta_diaria_funcionario, cor)
select o.id, v.nome, v.slug, v.meta, v.cor
from organizations o
cross join (values
  ('Acabamento', 'acabamento', 50, '#2563eb'),
  ('Fundo',      'fundo',      70, '#3b82f6'),
  ('Estante',    'estante',    30, '#60a5fa'),
  ('Balcão',     'balcao',     25, '#0ea5e9'),
  ('Desmontado', 'desmontado', 20, '#38bdf8')
) as v(nome, slug, meta, cor)
where o.slug = 'infinite'
on conflict (org_id, slug) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Funcionários (setor "casa" padrão)
-- ----------------------------------------------------------------------------
insert into employees (org_id, nome, setor_id)
select o.id, v.nome, s.id
from organizations o
join (values
  ('Ramy', 'acabamento'),
  ('Gabriel', 'acabamento'),
  ('Gui', 'acabamento'),
  ('Wenderson', 'acabamento'),
  ('Elias', 'acabamento'),
  ('Marivaldo', 'acabamento'),
  ('Felipe', 'fundo'),
  ('Gustavo', 'fundo'),
  ('Abraão', 'fundo'),
  ('Marcelo', 'estante'),
  ('Leoncio', 'estante'),
  ('Samuel', 'estante'),
  ('Nicolas', 'estante'),
  ('João Paulo', 'estante'),
  ('Wendell', 'estante'),
  ('Pedro', 'estante'),
  ('Leandro', 'balcao'),
  ('Guilherme Maximiniano', 'balcao')
) as v(nome, setor_slug) on true
join sectors s on s.org_id = o.id and s.slug = v.setor_slug
where o.slug = 'infinite'
  and not exists (
    select 1 from employees e where e.org_id = o.id and e.nome = v.nome
  );

-- ----------------------------------------------------------------------------
-- 4. Produção diária (junho/2026) — exatamente como na planilha
-- ----------------------------------------------------------------------------
insert into production_entries
  (org_id, funcionario_id, setor_id, data, quantidade_produzida, meta_individual_snapshot)
select o.id, e.id, s.id, v.data::date, v.qtd, s.meta_diaria_funcionario
from organizations o
join (values
  -- ACABAMENTO
  ('acabamento','Ramy','2026-06-03',34), ('acabamento','Gabriel','2026-06-03',36),
  ('acabamento','Gui','2026-06-03',33), ('acabamento','Wenderson','2026-06-03',45),
  ('acabamento','Gustavo','2026-06-03',32), ('acabamento','Elias','2026-06-03',45),
  ('acabamento','Ramy','2026-06-05',44), ('acabamento','Gabriel','2026-06-05',3),
  ('acabamento','Gui','2026-06-05',42), ('acabamento','Elias','2026-06-05',50),
  ('acabamento','Ramy','2026-06-09',34), ('acabamento','Gabriel','2026-06-09',8),
  ('acabamento','Gui','2026-06-09',34), ('acabamento','Wenderson','2026-06-09',38),
  ('acabamento','Elias','2026-06-09',40),
  ('acabamento','Ramy','2026-06-12',34), ('acabamento','Gabriel','2026-06-12',21),
  ('acabamento','Gui','2026-06-12',42), ('acabamento','Wenderson','2026-06-12',40),
  ('acabamento','Elias','2026-06-12',48),
  ('acabamento','Ramy','2026-06-16',30), ('acabamento','Marivaldo','2026-06-16',33),
  ('acabamento','Gui','2026-06-16',40), ('acabamento','Wenderson','2026-06-16',40),
  ('acabamento','Elias','2026-06-16',42),
  -- FUNDO
  ('fundo','Felipe','2026-06-09',44), ('fundo','Gustavo','2026-06-09',49),
  ('fundo','Felipe','2026-06-10',59), ('fundo','Gustavo','2026-06-10',40),
  ('fundo','Abraão','2026-06-10',36),
  ('fundo','Felipe','2026-06-16',20), ('fundo','Gustavo','2026-06-16',41),
  -- ESTANTE
  ('estante','Marcelo','2026-06-03',17), ('estante','Leoncio','2026-06-03',31),
  ('estante','Samuel','2026-06-03',30), ('estante','Nicolas','2026-06-03',3),
  ('estante','João Paulo','2026-06-05',26), ('estante','Marcelo','2026-06-05',14),
  ('estante','Leoncio','2026-06-05',32), ('estante','Samuel','2026-06-05',33),
  ('estante','Nicolas','2026-06-05',30),
  ('estante','Pedro','2026-06-09',7), ('estante','Wendell','2026-06-09',4),
  ('estante','João Paulo','2026-06-09',26), ('estante','Marcelo','2026-06-09',36),
  ('estante','Leoncio','2026-06-09',16), ('estante','Samuel','2026-06-09',22),
  ('estante','Nicolas','2026-06-09',30),
  ('estante','Marcelo','2026-06-10',26), ('estante','Leoncio','2026-06-10',39),
  ('estante','Samuel','2026-06-10',37), ('estante','Nicolas','2026-06-10',18),
  ('estante','Marcelo','2026-06-12',26), ('estante','Leoncio','2026-06-12',39),
  ('estante','Samuel','2026-06-12',37), ('estante','Nicolas','2026-06-12',18),
  ('estante','Marcelo','2026-06-16',24), ('estante','Samuel','2026-06-16',30),
  ('estante','Wendell','2026-06-16',11),
  -- BALCÃO
  ('balcao','Leandro','2026-06-03',17), ('balcao','Guilherme Maximiniano','2026-06-03',21),
  ('balcao','Leandro','2026-06-05',12), ('balcao','Guilherme Maximiniano','2026-06-05',17),
  ('balcao','Leandro','2026-06-09',20), ('balcao','Guilherme Maximiniano','2026-06-09',26),
  ('balcao','Leandro','2026-06-10',20), ('balcao','Guilherme Maximiniano','2026-06-10',33),
  ('balcao','Leandro','2026-06-12',13), ('balcao','Guilherme Maximiniano','2026-06-12',30),
  -- DESMONTADO
  ('desmontado','Abraão','2026-06-10',12), ('desmontado','Gabriel','2026-06-10',6)
) as v(setor_slug, func, data, qtd) on true
join sectors s on s.org_id = o.id and s.slug = v.setor_slug
join employees e on e.org_id = o.id and e.nome = v.func
where o.slug = 'infinite'
on conflict (funcionario_id, setor_id, data) do update
  set quantidade_produzida = excluded.quantidade_produzida;

-- ----------------------------------------------------------------------------
-- 5. Insights iniciais da IA
-- ----------------------------------------------------------------------------
insert into ai_insights (org_id, escopo, severidade, titulo, conteudo)
select o.id, v.escopo, v.sev, v.titulo, v.conteudo
from organizations o
cross join (values
  ('geral','sucesso','Destaque do mês','Elias é o funcionário mais produtivo, com 225 peças e média de 45/dia.'),
  ('geral','alerta','Setor em queda','O setor Fundo está com aproveitamento abaixo de 70% — vale checar material.'),
  ('geral','info','Projeção de meta','Mantendo o ritmo atual, o mês deve fechar em torno de 92% da meta.')
) as v(escopo, sev, titulo, conteudo)
where o.slug = 'infinite'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 6. Gatilho — todo novo usuário do Auth ganha um perfil na organização
-- ----------------------------------------------------------------------------
-- IMPORTANTE: `set search_path = public` é obrigatório. Funções SECURITY DEFINER
-- não herdam o search_path; sem isto o trigger não acha as tabelas e a criação
-- de usuários no Auth falha com "Database error creating new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare default_org uuid;
begin
  select id into default_org from public.organizations order by created_at limit 1;
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    default_org,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- backfill: cria perfil para usuários que já existiam antes do gatilho
insert into profiles (id, org_id, full_name, role)
select u.id,
       (select id from organizations order by created_at limit 1),
       coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Usuário'),
       'admin'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
  and exists (select 1 from organizations);
