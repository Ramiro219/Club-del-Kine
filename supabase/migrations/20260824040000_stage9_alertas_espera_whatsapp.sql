begin;

alter table public.alertas add column if not exists clave_dedupe text;
create unique index if not exists alertas_clave_dedupe_uidx on public.alertas (clave_dedupe) where clave_dedupe is not null;

create or replace function public.sincronizar_alertas_operativas()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare total integer;
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then raise exception 'Usuario no autorizado'; end if;
  update public.alertas set estado='descartada'
  where clave_dedupe is not null and estado in ('pendiente','vista');

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,vence_at,clave_dedupe)
  select 'sesiones_bajas','Pocas sesiones restantes','El tratamiento tiene '||(t.sesiones_autorizadas-coalesce(s.usadas,0))||' sesiones disponibles.','advertencia',t.paciente_id,t.id,t.fecha_estimada_fin::timestamptz,'sesiones:'||t.id
  from public.tratamientos t left join lateral (select sum(unidades_consumidas)::int usadas from public.sesiones where tratamiento_id=t.id and estado<>'anulada') s on true
  where t.estado='activo' and t.sesiones_autorizadas-coalesce(s.usadas,0) between 1 and 2
  on conflict (clave_dedupe) where clave_dedupe is not null do update set mensaje=excluded.mensaje,severidad=excluded.severidad,estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,vence_at,clave_dedupe)
  select 'tratamiento_vencido','Tratamiento vencido','La fecha estimada de finalización ya pasó.','critica',paciente_id,id,fecha_estimada_fin::timestamptz,'tratamiento:'||id
  from public.tratamientos where estado='activo' and fecha_estimada_fin<current_date
  on conflict (clave_dedupe) where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe)
  select 'documentacion_pendiente','Documentación pendiente','El paciente tiene documentación pendiente, observada o vencida.','advertencia',paciente_id,'documentos:'||paciente_id
  from public.documentos where estado in ('pendiente','observado','vencido') group by paciente_id
  on conflict (clave_dedupe) where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe)
  select 'pago_pendiente','Pago pendiente','Existe un pago pendiente de confirmación.','advertencia',paciente_id,'pago:'||id
  from public.pagos where estado='pendiente'
  on conflict (clave_dedupe) where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,tratamiento_id,turno_id,vence_at,clave_dedupe)
  select 'turno_proximo','Turno próximo','Turno programado dentro de las próximas 24 horas.','info',paciente_id,tratamiento_id,id,inicio_at,'turno:'||id
  from public.turnos where estado in ('programado','confirmado') and inicio_at between now() and now()+interval '24 hours'
  on conflict (clave_dedupe) where clave_dedupe is not null do update set vence_at=excluded.vence_at,estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,paciente_id,clave_dedupe)
  select 'lista_espera','Paciente en espera','Hay una solicitud activa en lista de espera.','info',paciente_id,'espera:'||id
  from public.lista_espera where estado='activa' and (fecha_hasta is null or fecha_hasta>=current_date)
  on conflict (clave_dedupe) where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  insert into public.alertas(tipo,titulo,mensaje,severidad,vence_at,clave_dedupe)
  select 'capacidad','Horario casi completo','El box tiene su capacidad casi completa para este horario.','advertencia',date_trunc('day',t.inicio_at),'capacidad:'||t.box_id||':'||t.inicio_at
  from public.turnos t join public.boxes b on b.id=t.box_id
  where t.estado in ('programado','confirmado','presente') and t.inicio_at between now() and now()+interval '7 days'
  group by t.box_id,t.inicio_at,b.capacidad having count(*)>=greatest(1,b.capacidad-1)
  on conflict (clave_dedupe) where clave_dedupe is not null do update set estado=case when public.alertas.estado='resuelta' then 'resuelta' else 'pendiente' end;

  select count(*) into total from public.alertas where estado in ('pendiente','vista');
  return total;
end; $$;

create or replace function public.cambiar_estado_alerta(p_alerta_id uuid,p_estado text)
returns void language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then raise exception 'Usuario no autorizado'; end if;
  if p_estado not in ('vista','resuelta','descartada') then raise exception 'Estado invalido'; end if;
  update public.alertas set estado=p_estado,resuelta_por=case when p_estado='resuelta' then auth.uid() else null end,resuelta_at=case when p_estado='resuelta' then now() else null end where id=p_alerta_id;
end; $$;

revoke all on function public.sincronizar_alertas_operativas() from public;
revoke all on function public.cambiar_estado_alerta(uuid,text) from public;
grant execute on function public.sincronizar_alertas_operativas() to authenticated;
grant execute on function public.cambiar_estado_alerta(uuid,text) to authenticated;

commit;
