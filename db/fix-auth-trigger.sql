-- ============================================================================
-- CORREÇÃO — trigger de criação de perfil estava quebrando o Auth.
-- Cole no SQL Editor do Supabase e rode (Run). Roda em segundos, é seguro.
-- Depois disso a criação de usuários volta a funcionar.
-- ============================================================================

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
  for each row execute function public.handle_new_user();
