-- ============================================================================
-- Perda com frete de retorno. O almoxarifado informa, no retorno, quanto o
-- motorista cobrou por aquela volta (= o prejuízo) e o cenário. Em ambos os
-- cenários a empresa perde 1 frete; o cenário é só para análise.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================================

alter table quality_returns
  add column if not exists frete_valor     numeric(12,2),   -- o que o motorista cobrou (o prejuízo)
  add column if not exists frete_cenario   text,            -- perda_total | remarcacao
  add column if not exists frete_motorista text;            -- motorista/veículo (opcional)

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quality_returns_frete_cenario_chk') then
    alter table quality_returns add constraint quality_returns_frete_cenario_chk
      check (frete_cenario is null or frete_cenario in ('perda_total','remarcacao'));
  end if;
end$$;

-- índice para o dashboard de perdas (só linhas com frete informado)
create index if not exists idx_qr_frete on quality_returns (org_id, data_retorno) where frete_valor is not null;
