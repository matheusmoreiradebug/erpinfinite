-- ============================================================================
-- INFINITE DASHBOARD — BLINDAGEM DE SEGURANÇA
-- Rode no SQL Editor do Supabase (uma vez). Corrige 3 falhas de controle de acesso.
-- ----------------------------------------------------------------------------
-- ⚠️ AÇÃO MANUAL OBRIGATÓRIA (não dá para fazer por SQL):
--    Supabase → Authentication → Sign In / Providers → Email →
--    DESLIGUE "Allow new users to sign up" (disable_signup).
--    Sem isso, qualquer pessoa pode criar conta no sistema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) PROFILES — impedir auto-escalonamento de cargo
--    Antes: política FOR ALL só com USING permitia o usuário mudar o próprio
--    cargo para 'admin' e editar perfis de outros.
--    Agora: usuários só LEEM perfis da org; criação/edição de perfil só via
--    service role (fluxo administrativo). Sem política de update = negado.
-- ----------------------------------------------------------------------------
drop policy if exists org_isolation on profiles;
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (org_id = auth_org_id());

-- ----------------------------------------------------------------------------
-- 2) MÓDULO 1 — gravação por cargo (antes: qualquer usuário da org gravava)
--    Leitura: todos da org. Escrita: cargos de gestão.
-- ----------------------------------------------------------------------------

-- sectors / employees: gravam admin, gestor, qualidade
do $$
declare t text;
begin
  foreach t in array array['sectors','employees']
  loop
    execute format('drop policy if exists org_isolation on %1$s;', t);
    execute format('drop policy if exists %1$s_select on %1$s;', t);
    execute format('drop policy if exists %1$s_write on %1$s;', t);
    execute format('create policy %1$s_select on %1$s for select using (org_id = auth_org_id());', t);
    execute format(
      'create policy %1$s_write on %1$s for all
         using (org_id = auth_org_id() and auth_role()::text in (''admin'',''gestor'',''qualidade''))
         with check (org_id = auth_org_id() and auth_role()::text in (''admin'',''gestor'',''qualidade''));', t);
  end loop;
end $$;

-- production_entries: lançam admin, gestor, operador, qualidade
drop policy if exists org_isolation on production_entries;
drop policy if exists prod_select on production_entries;
drop policy if exists prod_write on production_entries;
create policy prod_select on production_entries
  for select using (org_id = auth_org_id());
create policy prod_write on production_entries
  for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','gestor','operador','qualidade'))
  with check (org_id = auth_org_id() and auth_role()::text in ('admin','gestor','operador','qualidade'));

-- ai_insights: gravam admin, qualidade (geradas pelo sistema)
drop policy if exists org_isolation on ai_insights;
drop policy if exists ai_select on ai_insights;
drop policy if exists ai_write on ai_insights;
create policy ai_select on ai_insights
  for select using (org_id = auth_org_id());
create policy ai_write on ai_insights
  for all
  using (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'))
  with check (org_id = auth_org_id() and auth_role()::text in ('admin','qualidade'));

-- ----------------------------------------------------------------------------
-- 3) TRIGGER de novo usuário — menor privilégio + só domínio da empresa
--    Antes: TODO novo usuário virava 'admin' da org.
--    Agora: só e-mails @infinitemoveis.com ganham perfil (fail-closed),
--    e o cargo inicial é 'viewer' (admin eleva manualmente / via script).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare default_org uuid;
begin
  if new.email is null or new.email not ilike '%@infinitemoveis.com' then
    return new; -- fora do domínio: sem perfil, sem acesso
  end if;
  select id into default_org from public.organizations order by created_at limit 1;
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    default_org,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- 4) Conferência: garantir que a RLS está LIGADA em tudo (idempotente)
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','sectors','employees','production_entries','ai_insights',
    'clients','trucks','products','return_categories','return_reasons','deliveries',
    'quality_returns','return_photos','rework','weekly_closings','audit_logs'
  ]
  loop
    execute format('alter table %1$s enable row level security;', t);
  end loop;
end $$;
