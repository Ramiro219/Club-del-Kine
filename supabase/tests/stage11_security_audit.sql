-- Etapa 11: auditoría estructural de seguridad, sólo lectura.
-- Ejecutar en Supabase SQL Editor después de aplicar todas las migraciones.
do $$
declare
  tablas text[] := array[
    'profiles','pacientes','obras_sociales','requisitos_obra_social',
    'reglas_consumo_sesion','boxes','tipos_tratamiento','tratamientos',
    'turnos','sesiones','metodos_pago','pagos','pago_aplicaciones',
    'devoluciones','documentos','lista_espera','configuracion_horarios',
    'excepciones_horarias','cierres_caja','alertas','auditoria',
    'licencias','licencia_renovaciones'
  ];
  tabla text;
  funcion text;
begin
  foreach tabla in array tablas loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=tabla and c.relkind='r'
    ) then raise exception 'Falta la tabla public.%', tabla; end if;

    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=tabla and c.relrowsecurity
    ) then raise exception 'RLS no está habilitado en public.%', tabla; end if;

    if has_table_privilege('anon',format('public.%I',tabla),'SELECT')
      or has_table_privilege('anon',format('public.%I',tabla),'INSERT')
      or has_table_privilege('anon',format('public.%I',tabla),'UPDATE')
      or has_table_privilege('anon',format('public.%I',tabla),'DELETE') then
      raise exception 'anon tiene privilegios sobre public.%', tabla;
    end if;

    if has_table_privilege('authenticated',format('public.%I',tabla),'DELETE') then
      raise exception 'authenticated puede borrar directamente public.%', tabla;
    end if;
  end loop;

  select string_agg(p.oid::regprocedure::text,', ')
    into funcion
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and not coalesce(p.proconfig,array[]::text[]) @> array['search_path=pg_catalog, pg_temp'];
  if funcion is not null then
    raise exception 'Funciones SECURITY DEFINER sin search_path seguro: %', funcion;
  end if;

  select string_agg(p.oid::regprocedure::text,', ')
    into funcion
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and exists (
      select 1
      from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
      where acl.grantee=0 and acl.privilege_type='EXECUTE'
    );
  if funcion is not null then
    raise exception 'PUBLIC puede ejecutar funciones privilegiadas: %', funcion;
  end if;

  if not exists(select 1 from public.licencias) then
    raise exception 'No existe una licencia configurada';
  end if;
end $$;

select 'AUDITORÍA ESTRUCTURAL SUPERADA' as resultado;
