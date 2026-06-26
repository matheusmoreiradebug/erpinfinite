-- ============================================================================
-- Ficha de análise da Qualidade — campos da revisão que a Jaque faz ao
-- classificar um retorno (gravidade/risco, o que aconteceu com a peça, destino,
-- responsabilidade e ação preventiva). Tudo opcional e retrocompatível.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================================

alter table quality_returns
  add column if not exists gravidade        text,   -- baixa | media | alta | critica
  add column if not exists destino          text,   -- retrabalho | sucata | reposicao | reparada | sem_acao
  add column if not exists responsabilidade text,   -- producao | transporte | cliente | fornecedor | projeto
  add column if not exists analise          text,   -- diagnóstico: o que aconteceu com a peça
  add column if not exists acao_preventiva  text;   -- recomendação para não repetir

-- validações (CHECK só aceita os valores previstos; null é permitido)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quality_returns_gravidade_chk') then
    alter table quality_returns add constraint quality_returns_gravidade_chk
      check (gravidade is null or gravidade in ('baixa','media','alta','critica'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quality_returns_destino_chk') then
    alter table quality_returns add constraint quality_returns_destino_chk
      check (destino is null or destino in ('retrabalho','sucata','reposicao','reparada','sem_acao'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quality_returns_responsabilidade_chk') then
    alter table quality_returns add constraint quality_returns_responsabilidade_chk
      check (responsabilidade is null or responsabilidade in ('producao','transporte','cliente','fornecedor','projeto'));
  end if;
end$$;

-- índices para filtrar/agrupar por gravidade e responsabilidade no painel
create index if not exists idx_qr_gravidade        on quality_returns (org_id, gravidade);
create index if not exists idx_qr_responsabilidade  on quality_returns (org_id, responsabilidade);
