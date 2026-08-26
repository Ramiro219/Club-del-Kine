-- Pruebas estructurales no destructivas de la Etapa 10.
-- Ejecutar en SQL Editor después del db push. La transacción siempre se revierte.
begin;

do $$
declare
  licencia_count integer;
  periodo interval;
begin
  select count(*), max(vence_at-inicio_at)
    into licencia_count, periodo
  from public.licencias;

  if licencia_count <> 1 then
    raise exception 'Debe existir exactamente una licencia; existen %', licencia_count;
  end if;
  if periodo < interval '30 days' then
    raise exception 'La licencia inicial no tiene 30 días de vigencia';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='licencias'
      and policyname='licencias_desarrollador_select'
  ) then
    raise exception 'Falta la política de lectura exclusiva para desarrollador';
  end if;
  if has_table_privilege('anon','public.licencias','SELECT') then
    raise exception 'anon no debe leer licencias';
  end if;
end $$;

-- Una sesión de SQL Editor no representa a un desarrollador autenticado.
-- La renovación debe ser rechazada incluso con ejecución de la función.
do $$
begin
  begin
    perform public.renovar_licencia_30_dias('prueba que debe revertirse');
    raise exception 'La renovación sin desarrollador fue aceptada';
  exception
    when others then
      if sqlerrm='La renovación sin desarrollador fue aceptada' then raise; end if;
  end;
end $$;

rollback;
