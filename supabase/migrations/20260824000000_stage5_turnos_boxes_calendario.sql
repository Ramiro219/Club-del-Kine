begin;

drop index if exists public.configuracion_horarios_clave_natural_uidx;
create unique index if not exists configuracion_horarios_activos_uidx
  on public.configuracion_horarios (
    coalesce(box_id, '00000000-0000-0000-0000-000000000000'::uuid),
    dia_semana, hora_desde, hora_hasta
  ) where activo;

create or replace function public.validate_turno_capacity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  allowed_capacity integer;
  occupied integer;
  closed_for_period boolean;
begin
  if new.estado in ('cancelado', 'ausente') then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(new.box_id::text, 0));

  select b.capacidad into allowed_capacity
  from public.boxes b where b.id = new.box_id and b.activo;
  if allowed_capacity is null then raise exception 'El box no existe o está inactivo'; end if;

  select coalesce((
    select ch.capacidad from public.configuracion_horarios ch
    where ch.activo and (ch.box_id = new.box_id or ch.box_id is null)
      and ch.dia_semana = extract(dow from new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::integer
      and ch.vigencia_desde <= (new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::date
      and (ch.vigencia_hasta is null or ch.vigencia_hasta >= (new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::date)
      and (new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::time >= ch.hora_desde
      and (new.fin_at at time zone 'America/Argentina/Buenos_Aires')::time <= ch.hora_hasta
    order by (ch.box_id is not null) desc, ch.vigencia_desde desc limit 1
  ), allowed_capacity) into allowed_capacity;

  select exists(
    select 1 from public.excepciones_horarias eh
    where eh.activo and eh.tipo = 'cerrado' and (eh.box_id = new.box_id or eh.box_id is null)
      and eh.fecha = (new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::date
      and (eh.hora_desde is null or (new.inicio_at at time zone 'America/Argentina/Buenos_Aires')::time < eh.hora_hasta)
      and (eh.hora_hasta is null or (new.fin_at at time zone 'America/Argentina/Buenos_Aires')::time > eh.hora_desde)
  ) into closed_for_period;
  if closed_for_period then raise exception 'El box está cerrado en ese horario'; end if;

  select count(*) into occupied from public.turnos t
  where t.box_id = new.box_id and t.id <> coalesce(new.id, extensions.gen_random_uuid())
    and t.estado not in ('cancelado', 'ausente')
    and t.inicio_at < new.fin_at and t.fin_at > new.inicio_at;
  if occupied >= allowed_capacity then raise exception 'El box alcanzó su capacidad máxima en ese horario'; end if;
  return new;
end;
$$;

revoke all on function public.validate_turno_capacity() from public;
drop trigger if exists club_del_kine_validate_turno_capacity on public.turnos;
create trigger club_del_kine_validate_turno_capacity
  before insert or update of box_id, inicio_at, fin_at, estado on public.turnos
  for each row execute function public.validate_turno_capacity();

commit;
