begin;

create table if not exists public.configuracion_centro (
  id uuid primary key, nombre text not null, direccion text, telefono text, email text,
  zona_horaria text not null default 'America/Argentina/Buenos_Aires', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint configuracion_centro_singleton check (id = '00000000-0000-0000-0000-000000000120'), constraint configuracion_centro_nombre_check check (char_length(trim(nombre)) between 1 and 120),
  constraint configuracion_centro_email_check check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);
insert into public.configuracion_centro(id,nombre) values ('00000000-0000-0000-0000-000000000120','Club del Kine') on conflict (id) do nothing;

create table if not exists public.profesionales (
  id uuid primary key default extensions.gen_random_uuid(), nombre_completo text not null, matricula text not null, especialidad text not null,
  telefono text, email text, activo boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint profesionales_nombre_check check (char_length(trim(nombre_completo)) between 1 and 120), constraint profesionales_matricula_check check (char_length(trim(matricula)) between 1 and 60),
  constraint profesionales_especialidad_check check (char_length(trim(especialidad)) between 1 and 120), constraint profesionales_email_check check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);
create unique index if not exists profesionales_matricula_uidx on public.profesionales(lower(btrim(matricula)));

create table if not exists public.configuracion_alertas (
  id uuid primary key, sesiones_bajas_activa boolean not null default true, sesiones_restantes_umbral smallint not null default 2,
  tratamiento_vencido_activa boolean not null default true, documentacion_pendiente_activa boolean not null default true, pago_pendiente_activa boolean not null default true,
  turno_proximo_activa boolean not null default true, turno_proximo_horas smallint not null default 24, lista_espera_activa boolean not null default true,
  capacidad_activa boolean not null default true, capacidad_dias_anticipacion smallint not null default 7, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint configuracion_alertas_singleton check (id = '00000000-0000-0000-0000-000000000121'), constraint configuracion_alertas_sesiones_check check (sesiones_restantes_umbral between 1 and 20),
  constraint configuracion_alertas_horas_check check (turno_proximo_horas between 1 and 168), constraint configuracion_alertas_dias_check check (capacidad_dias_anticipacion between 1 and 30)
);
insert into public.configuracion_alertas(id) values ('00000000-0000-0000-0000-000000000121') on conflict (id) do nothing;

alter table public.configuracion_centro enable row level security;
alter table public.profesionales enable row level security;
alter table public.configuracion_alertas enable row level security;
revoke all on table public.configuracion_centro, public.profesionales, public.configuracion_alertas from public, anon, authenticated;
grant select on table public.configuracion_centro, public.profesionales, public.configuracion_alertas to authenticated;
grant update (nombre, direccion, telefono, email, zona_horaria) on table public.configuracion_centro to authenticated;
grant insert (nombre_completo, matricula, especialidad, telefono, email, activo),
      update (nombre_completo, matricula, especialidad, telefono, email, activo)
on table public.profesionales to authenticated;
grant update (
  sesiones_bajas_activa, sesiones_restantes_umbral, tratamiento_vencido_activa,
  documentacion_pendiente_activa, pago_pendiente_activa, turno_proximo_activa,
  turno_proximo_horas, lista_espera_activa, capacidad_activa,
  capacidad_dias_anticipacion
) on table public.configuracion_alertas to authenticated;

do $$ declare t text; begin foreach t in array array['configuracion_centro','profesionales','configuracion_alertas'] loop
  execute format('drop policy if exists %I on public.%I',t||'_read',t);
  execute format('drop policy if exists %I on public.%I',t||'_admin_insert',t);
  execute format('drop policy if exists %I on public.%I',t||'_admin_update',t);
  execute format('create policy %I on public.%I for select to authenticated using (public.current_user_has_role(array[''administrador'',''recepcion'']))',t||'_read',t);
  if t = 'profesionales' then
    execute format('create policy %I on public.%I for insert to authenticated with check (public.current_user_has_role(array[''administrador'']))',t||'_admin_insert',t);
  end if;
  execute format('create policy %I on public.%I for update to authenticated using (public.current_user_has_role(array[''administrador''])) with check (public.current_user_has_role(array[''administrador'']))',t||'_admin_update',t);
  execute format('drop trigger if exists club_del_kine_updated_%I on public.%I',t,t);
  execute format('drop trigger if exists club_del_kine_audit_%I on public.%I',t,t);
  execute format('create trigger club_del_kine_updated_%I before update on public.%I for each row execute function public.set_updated_at()',t,t);
  execute format('create trigger club_del_kine_audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',t,t);
end loop; end $$;

create or replace function public.sincronizar_alertas_operativas() returns integer language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare total integer; cfg public.configuracion_alertas%rowtype;
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then raise exception 'Usuario no autorizado'; end if;
  select * into strict cfg from public.configuracion_alertas;
  update public.alertas set estado='descartada' where clave_dedupe is not null and estado in ('pendiente','vista');
  if cfg.sesiones_bajas_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,vence_at,clave_dedupe) select 'sesiones_bajas','Pocas sesiones restantes','El tratamiento tiene '||(t.sesiones_autorizadas-coalesce(s.usadas,0))||' sesiones disponibles.','advertencia',t.paciente_id,t.id,t.fecha_estimada_fin::timestamptz,'sesiones:'||t.id from public.tratamientos t left join lateral(select sum(unidades_consumidas)::int usadas from public.sesiones where tratamiento_id=t.id and estado<>'anulada')s on true where t.estado='activo' and t.sesiones_autorizadas-coalesce(s.usadas,0) between 1 and cfg.sesiones_restantes_umbral on conflict(clave_dedupe)where clave_dedupe is not null do update set mensaje=excluded.mensaje,severidad=excluded.severidad,estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.tratamiento_vencido_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,vence_at,clave_dedupe) select 'tratamiento_vencido','Tratamiento vencido','La fecha estimada de finalización ya pasó.','critica',paciente_id,id,fecha_estimada_fin::timestamptz,'tratamiento:'||id from public.tratamientos where estado='activo' and fecha_estimada_fin<current_date on conflict(clave_dedupe)where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.documentacion_pendiente_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe) select 'documentacion_pendiente','Documentación pendiente','El paciente tiene documentación pendiente, observada o vencida.','advertencia',paciente_id,'documentos:'||paciente_id from public.documentos where estado in('pendiente','observado','vencido')group by paciente_id on conflict(clave_dedupe)where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.pago_pendiente_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe) select 'pago_pendiente','Pago pendiente','Existe un pago pendiente de confirmación.','advertencia',paciente_id,'pago:'||id from public.pagos where estado='pendiente' on conflict(clave_dedupe)where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.turno_proximo_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,turno_id,vence_at,clave_dedupe) select 'turno_proximo','Turno próximo','Turno programado dentro de las próximas '||cfg.turno_proximo_horas||' horas.','info',paciente_id,tratamiento_id,id,inicio_at,'turno:'||id from public.turnos where estado in('programado','confirmado')and inicio_at between now()and now()+make_interval(hours=>cfg.turno_proximo_horas) on conflict(clave_dedupe)where clave_dedupe is not null do update set vence_at=excluded.vence_at,estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.lista_espera_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe) select 'lista_espera','Paciente en espera','Hay una solicitud activa en lista de espera.','info',paciente_id,'espera:'||id from public.lista_espera where estado='activa'and(fecha_hasta is null or fecha_hasta>=current_date)on conflict(clave_dedupe)where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  if cfg.capacidad_activa then insert into public.alertas(tipo,titulo,mensaje,severidad,vence_at,clave_dedupe) select 'capacidad','Horario casi completo','El box tiene su capacidad casi completa para este horario.','advertencia',date_trunc('day',t.inicio_at),'capacidad:'||t.box_id||':'||t.inicio_at from public.turnos t join public.boxes b on b.id=t.box_id where t.estado in('programado','confirmado','presente')and t.inicio_at between now()and now()+make_interval(days=>cfg.capacidad_dias_anticipacion)group by t.box_id,t.inicio_at,b.capacidad having count(*)>=greatest(1,b.capacidad-1)on conflict(clave_dedupe)where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta'then'resuelta'else'pendiente'end; end if;
  select count(*) into total from public.alertas where estado in('pendiente','vista'); return total;
end; $$;
revoke all on function public.sincronizar_alertas_operativas() from public, anon, authenticated;
grant execute on function public.sincronizar_alertas_operativas() to authenticated;
commit;
