begin;

alter table public.tratamientos
  add column if not exists fecha_estimada_fin date;

alter table public.tratamientos
  drop constraint if exists club_del_kine_tratamientos_fecha_estimada_ck;
alter table public.tratamientos
  add constraint club_del_kine_tratamientos_fecha_estimada_ck
  check (fecha_estimada_fin is null or fecha_estimada_fin >= fecha_inicio);

alter table public.sesiones
  add column if not exists box_id uuid references public.boxes(id) on delete restrict;

alter table public.sesiones drop constraint if exists sesiones_estado_check;
alter table public.sesiones
  add constraint sesiones_estado_check check (estado in (
    'programada', 'realizada', 'ausente_avisado', 'ausente_consumida',
    'cancelada', 'reprogramada', 'anulada'
  ));

create index if not exists sesiones_box_fecha_idx
  on public.sesiones (box_id, fecha_atencion desc);

create or replace function public.set_consumo_sesion_from_rules()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  treatment_insurer uuid;
  appointment_state text;
  selected_rule record;
begin
  if new.estado = 'anulada' then
    new.unidades_consumidas := 0;
    new.regla_consumo_id := null;
    return new;
  end if;

  appointment_state := case new.estado
    when 'realizada' then 'atendido'
    when 'ausente_consumida' then 'ausente'
    when 'ausente_avisado' then 'cancelado'
    when 'cancelada' then 'cancelado'
    when 'reprogramada' then 'cancelado'
    else 'programado'
  end;

  select t.obra_social_id into treatment_insurer
  from public.tratamientos t
  where t.id = new.tratamiento_id and t.paciente_id = new.paciente_id;

  select r.id, r.consume_sesion, r.cantidad into selected_rule
  from public.reglas_consumo_sesion r
  where r.activo
    and r.estado_turno = appointment_state
    and (r.obra_social_id = treatment_insurer or r.obra_social_id is null)
    and r.vigencia_desde <= new.fecha_atencion::date
    and (r.vigencia_hasta is null or r.vigencia_hasta >= new.fecha_atencion::date)
  order by (r.obra_social_id is not null) desc, r.prioridad asc, r.vigencia_desde desc
  limit 1;

  if selected_rule.id is not null then
    new.regla_consumo_id := selected_rule.id;
    new.unidades_consumidas := case when selected_rule.consume_sesion then selected_rule.cantidad else 0 end;
  else
    new.regla_consumo_id := null;
    new.unidades_consumidas := case when new.estado in ('realizada', 'ausente_consumida') then 1 else 0 end;
  end if;
  return new;
end;
$$;

revoke all on function public.set_consumo_sesion_from_rules() from public;
drop trigger if exists club_del_kine_set_consumo_sesion on public.sesiones;
create trigger club_del_kine_set_consumo_sesion
  before insert or update of estado, fecha_atencion, tratamiento_id, paciente_id
  on public.sesiones
  for each row execute function public.set_consumo_sesion_from_rules();

commit;
