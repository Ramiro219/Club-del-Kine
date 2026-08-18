-- Datos exclusivamente ficticios para desarrollo local.
-- Idempotente por claves naturales; no crea usuarios, credenciales ni secretos.

insert into public.obras_sociales (nombre, codigo, telefono, email)
select source.nombre, source.codigo, source.telefono, source.email
from (
  values
    ('Salud Demo', 'DEMO-OS', '011-5555-0101', 'contacto@salud-demo.invalid'),
    ('Particular', 'PARTICULAR', null, null)
) as source(nombre, codigo, telefono, email)
where not exists (
  select 1 from public.obras_sociales os
  where lower(os.codigo) = lower(source.codigo) or lower(os.nombre) = lower(source.nombre)
);

insert into public.requisitos_obra_social (
  obra_social_id, nombre, descripcion, obligatorio
)
select os.id, source.nombre, source.descripcion, true
from public.obras_sociales os
cross join (
  values
    ('Orden medica', 'Orden ficticia vigente para la practica.'),
    ('Autorizacion', 'Autorizacion ficticia de sesiones.')
) as source(nombre, descripcion)
where os.id = (
    select resolved.id
    from public.obras_sociales resolved
    where lower(resolved.codigo) = lower('DEMO-OS')
       or lower(resolved.nombre) = lower('Salud Demo')
    order by case when lower(resolved.codigo) = lower('DEMO-OS') then 0 else 1 end
    limit 1
  )
  and not exists (
    select 1 from public.requisitos_obra_social r
    where r.obra_social_id = os.id
      and lower(r.nombre) = lower(source.nombre)
  );

insert into public.reglas_consumo_sesion (
  obra_social_id, estado_turno, consume_sesion, cantidad, prioridad, vigencia_desde
)
select source.obra_social_id, source.estado_turno, source.consume_sesion,
       source.cantidad, source.prioridad, date '2026-01-01'
from (
  select null::uuid, 'atendido'::text, true, 1.00::numeric, 100::smallint
  union all select null::uuid, 'cancelado', false, 0.00, 100
  union all select null::uuid, 'ausente', false, 0.00, 100
  union all
  select os.id, 'ausente', true, 1.00, 10
  from public.obras_sociales os
  where os.id = (
    select resolved.id
    from public.obras_sociales resolved
    where lower(resolved.codigo) = lower('DEMO-OS')
       or lower(resolved.nombre) = lower('Salud Demo')
    order by case when lower(resolved.codigo) = lower('DEMO-OS') then 0 else 1 end
    limit 1
  )
) as source(obra_social_id, estado_turno, consume_sesion, cantidad, prioridad)
on conflict (
  (coalesce(obra_social_id, '00000000-0000-0000-0000-000000000000'::uuid)),
  estado_turno, vigencia_desde, prioridad
) do nothing;

insert into public.boxes (nombre, descripcion, capacidad)
select source.nombre, source.descripcion, source.capacidad
from (
  values
    ('Box Demo 1', 'Box ficticio para pruebas locales.', 1::smallint),
    ('Gimnasio Demo', 'Espacio ficticio de rehabilitacion.', 4::smallint)
) as source(nombre, descripcion, capacidad)
where not exists (
  select 1 from public.boxes b where lower(b.nombre) = lower(source.nombre)
);

insert into public.tipos_tratamiento (nombre, descripcion, duracion_minutos, precio_referencia)
select source.nombre, source.descripcion, source.duracion_minutos, source.precio_referencia
from (
  values
    ('Kinesiologia Demo', 'Tratamiento ficticio general.', 60::smallint, 10000.00::numeric),
    ('Rehabilitacion Demo', 'Tratamiento ficticio funcional.', 45::smallint, 12500.00::numeric)
) as source(nombre, descripcion, duracion_minutos, precio_referencia)
where not exists (
  select 1 from public.tipos_tratamiento tt where lower(tt.nombre) = lower(source.nombre)
);

insert into public.metodos_pago (nombre, requiere_referencia)
select source.nombre, source.requiere_referencia
from (values ('Efectivo', false), ('Transferencia', true), ('Tarjeta', true))
  as source(nombre, requiere_referencia)
where not exists (
  select 1 from public.metodos_pago mp where lower(mp.nombre) = lower(source.nombre)
);

insert into public.configuracion_horarios (
  box_id, dia_semana, hora_desde, hora_hasta, capacidad, vigencia_desde
)
select b.id, d.dia_semana, time '08:00', time '20:00', b.capacidad, date '2026-01-01'
from public.boxes b
cross join (values (1::smallint), (2::smallint), (3::smallint), (4::smallint), (5::smallint))
  as d(dia_semana)
where lower(b.nombre) in (lower('Box Demo 1'), lower('Gimnasio Demo'))
  and not exists (
    select 1 from public.configuracion_horarios ch
    where ch.box_id = b.id
      and ch.dia_semana = d.dia_semana
      and ch.hora_desde = time '08:00'
      and ch.hora_hasta = time '20:00'
      and ch.vigencia_desde = date '2026-01-01'
  );
