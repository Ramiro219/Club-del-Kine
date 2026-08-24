begin;

-- La devolucion conserva las aplicaciones del cobro original como historial.
-- Su limite es el importe cobrado menos las devoluciones ya confirmadas.
create or replace function public.validate_devolucion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  payment public.pagos%rowtype;
  refunded_total numeric(12,2);
  method_requires_reference boolean;
begin
  if tg_op = 'UPDATE' and new.pago_id <> old.pago_id then
    raise exception 'No se puede cambiar el pago de una devolucion existente';
  end if;
  select * into payment from public.pagos where id = new.pago_id for update;
  if not found then raise exception 'El pago indicado no existe'; end if;
  if payment.estado <> 'confirmado' and new.estado <> 'anulada' then
    raise exception 'Solo se pueden devolver pagos confirmados';
  end if;
  select mp.requiere_referencia into method_requires_reference
  from public.metodos_pago mp where mp.id = new.metodo_pago_id;
  if method_requires_reference and nullif(btrim(new.referencia), '') is null then
    raise exception 'El metodo de devolucion requiere una referencia';
  end if;
  if tg_op = 'INSERT' and new.estado = 'anulada' then
    raise exception 'Una devolucion nueva no puede registrarse anulada';
  end if;
  if tg_op = 'UPDATE' and old.estado = 'anulada' and new is distinct from old then
    raise exception 'Una devolucion anulada es inmutable';
  end if;
  if tg_op = 'UPDATE' and old.estado = 'confirmada' then
    if new.estado not in ('confirmada', 'anulada') then
      raise exception 'Una devolucion confirmada no puede volver a pendiente';
    end if;
    if new.pago_id <> old.pago_id or new.importe <> old.importe
       or new.metodo_pago_id <> old.metodo_pago_id then
      raise exception 'No se pueden alterar los datos economicos de una devolucion confirmada';
    end if;
  end if;
  select coalesce(sum(importe), 0) into refunded_total
  from public.devoluciones
  where pago_id = new.pago_id and estado = 'confirmada' and id <> new.id;
  if new.estado = 'confirmada' and refunded_total + new.importe > payment.importe then
    raise exception 'La devolucion supera el saldo disponible del pago';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_devolucion() from public;

create or replace function public.registrar_pago_atomico(
  p_paciente_id uuid, p_tratamiento_id uuid, p_metodo_pago_id uuid,
  p_fecha_pago timestamptz, p_importe numeric, p_referencia text,
  p_concepto text, p_estado text, p_sesion_ids uuid[] default array[]::uuid[]
) returns uuid
language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare v_pago_id uuid; v_sesion_id uuid; v_count integer; v_part numeric(12,2); v_used numeric(12,2) := 0; v_index integer := 0;
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then raise exception 'Usuario no autorizado'; end if;
  if p_importe <= 0 then raise exception 'El importe debe ser mayor que cero'; end if;
  if p_estado not in ('pendiente','confirmado') then raise exception 'Estado de pago inválido'; end if;
  insert into public.pagos(paciente_id,tratamiento_id,metodo_pago_id,fecha_pago,importe,referencia,concepto,estado)
  values(p_paciente_id,p_tratamiento_id,p_metodo_pago_id,p_fecha_pago,p_importe,nullif(btrim(p_referencia),''),p_concepto,p_estado) returning id into v_pago_id;
  v_count := coalesce(array_length(p_sesion_ids,1),0);
  if p_estado = 'confirmado' and v_count > 0 then
    v_part := trunc(p_importe / v_count, 2);
    foreach v_sesion_id in array p_sesion_ids loop
      v_index := v_index + 1;
      insert into public.pago_aplicaciones(pago_id,tratamiento_id,sesion_id,importe_aplicado)
      values(v_pago_id,p_tratamiento_id,v_sesion_id,case when v_index=v_count then p_importe-v_used else v_part end);
      v_used := v_used + v_part;
    end loop;
  elsif p_estado = 'confirmado' and p_tratamiento_id is not null then
    insert into public.pago_aplicaciones(pago_id,tratamiento_id,importe_aplicado) values(v_pago_id,p_tratamiento_id,p_importe);
  end if;
  return v_pago_id;
end; $$;

create or replace function public.registrar_devolucion_atomica(p_pago_id uuid,p_importe numeric,p_motivo text,p_referencia text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare v_id uuid; v_metodo uuid;
begin
  if not public.current_user_has_role(array['administrador']) then raise exception 'Solo administración puede registrar devoluciones'; end if;
  select metodo_pago_id into v_metodo from public.pagos where id=p_pago_id and estado='confirmado' for update;
  if not found then raise exception 'El pago no existe o no está confirmado'; end if;
  insert into public.devoluciones(pago_id,metodo_pago_id,importe,motivo,referencia,estado)
  values(p_pago_id,v_metodo,p_importe,p_motivo,nullif(btrim(p_referencia),''),'confirmada') returning id into v_id;
  return v_id;
end; $$;

create or replace function public.cerrar_caja_diaria(p_fecha date,p_observaciones text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp
as $$
declare v_id uuid; v_user uuid := auth.uid(); v_income numeric(12,2); v_refunds numeric(12,2); v_payments integer; v_refund_count integer;
begin
  if not public.current_user_has_role(array['administrador']) then raise exception 'Solo administración puede cerrar la caja'; end if;
  select coalesce(sum(importe),0),count(*) into v_income,v_payments from public.pagos where estado='confirmado' and (fecha_pago at time zone 'America/Argentina/Buenos_Aires')::date=p_fecha;
  select coalesce(sum(importe),0),count(*) into v_refunds,v_refund_count from public.devoluciones where estado='confirmada' and (fecha_devolucion at time zone 'America/Argentina/Buenos_Aires')::date=p_fecha;
  insert into public.cierres_caja(fecha_operativa,cerrado_por,total_ingresos,total_devoluciones,cantidad_pagos,cantidad_devoluciones,observaciones)
  values(p_fecha,v_user,v_income,v_refunds,v_payments,v_refund_count,nullif(btrim(p_observaciones),'')) returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.registrar_pago_atomico(uuid,uuid,uuid,timestamptz,numeric,text,text,text,uuid[]) from public;
revoke all on function public.registrar_devolucion_atomica(uuid,numeric,text,text) from public;
revoke all on function public.cerrar_caja_diaria(date,text) from public;
grant execute on function public.registrar_pago_atomico(uuid,uuid,uuid,timestamptz,numeric,text,text,text,uuid[]) to authenticated;
grant execute on function public.registrar_devolucion_atomica(uuid,numeric,text,text) to authenticated;
grant execute on function public.cerrar_caja_diaria(date,text) to authenticated;

commit;
