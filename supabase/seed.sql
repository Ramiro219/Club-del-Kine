-- Club del Kine - datos exclusivamente ficticios para demostracion y pruebas.
-- No crea usuarios de Authentication, no contiene secretos y no borra datos.
-- Cada bloque resuelve relaciones por claves naturales y puede repetirse.

-- 5 obras sociales ficticias ------------------------------------------------

insert into public.obras_sociales (nombre, codigo, telefono, email)
select source.nombre, source.codigo, source.telefono, source.email
from (
  values
    ('Salud Demo', 'DEMO-OS', '011-5555-0101', 'contacto@salud-demo.invalid'),
    ('Particular Demo', 'PARTICULAR-DEMO', null, null),
    ('Bienestar Demo', 'BIENESTAR-DEMO', '011-5555-0102', 'contacto@bienestar-demo.invalid'),
    ('Mutual Demo', 'MUTUAL-DEMO', '011-5555-0103', 'contacto@mutual-demo.invalid'),
    ('Cobertura Integral Demo', 'INTEGRAL-DEMO', '011-5555-0104', 'contacto@integral-demo.invalid')
) as source(nombre, codigo, telefono, email)
where not exists (
  select 1 from public.obras_sociales os
  where lower(os.codigo) = lower(source.codigo)
     or lower(os.nombre) = lower(source.nombre)
     or (source.codigo = 'PARTICULAR-DEMO' and lower(os.nombre) = lower('Particular'))
);

-- Requisitos y reglas de consumo ficticios ---------------------------------

insert into public.requisitos_obra_social (obra_social_id, nombre, descripcion, obligatorio)
select os.id, source.nombre, source.descripcion, source.obligatorio
from (
  values
    ('DEMO-OS', 'Orden medica', 'Orden ficticia vigente para la practica.', true),
    ('DEMO-OS', 'Autorizacion', 'Autorizacion ficticia de sesiones.', true),
    ('BIENESTAR-DEMO', 'Credencial', 'Credencial ficticia de afiliacion.', true),
    ('MUTUAL-DEMO', 'Derivacion', 'Derivacion ficticia del profesional.', true),
    ('INTEGRAL-DEMO', 'Planilla de asistencia', 'Planilla ficticia para firma.', false)
) as source(codigo, nombre, descripcion, obligatorio)
join public.obras_sociales os on lower(os.codigo) = lower(source.codigo)
where not exists (
  select 1 from public.requisitos_obra_social r
  where r.obra_social_id = os.id and lower(r.nombre) = lower(source.nombre)
);

insert into public.reglas_consumo_sesion (
  obra_social_id, estado_turno, consume_sesion, cantidad, prioridad, vigencia_desde
)
select os.id, source.estado_turno, source.consume_sesion, source.cantidad,
       source.prioridad, date '2026-01-01'
from (
  values
    (null::text, 'atendido', true, 1.00::numeric, 100::smallint),
    (null::text, 'cancelado', false, 0.00::numeric, 100::smallint),
    (null::text, 'ausente', false, 0.00::numeric, 100::smallint),
    ('DEMO-OS', 'ausente', true, 1.00::numeric, 10::smallint),
    ('BIENESTAR-DEMO', 'ausente', true, 0.50::numeric, 10::smallint),
    ('MUTUAL-DEMO', 'ausente', false, 0.00::numeric, 10::smallint),
    ('INTEGRAL-DEMO', 'cancelado', true, 1.00::numeric, 10::smallint),
    ('PARTICULAR-DEMO', 'ausente', false, 0.00::numeric, 10::smallint)
) as source(codigo, estado_turno, consume_sesion, cantidad, prioridad)
left join lateral (
  select resolved.id
  from public.obras_sociales resolved
  where lower(resolved.codigo) = lower(source.codigo)
     or (source.codigo = 'PARTICULAR-DEMO'
         and lower(resolved.nombre) in (lower('Particular Demo'), lower('Particular')))
  order by case when lower(resolved.codigo) = lower(source.codigo) then 0 else 1 end
  limit 1
) os on true
where source.codigo is null or os.id is not null
  and not exists (
    select 1 from public.reglas_consumo_sesion existing
    where existing.obra_social_id is not distinct from os.id
      and existing.estado_turno = source.estado_turno
      and existing.prioridad = source.prioridad
  );

-- 3 boxes, 4 tratamientos y 3 metodos de pago ------------------------------

insert into public.boxes (nombre, descripcion, capacidad)
select source.nombre, source.descripcion, source.capacidad
from (
  values
    ('Box Demo 1', 'Box ficticio individual.', 1::smallint),
    ('Box Demo 2', 'Box ficticio individual.', 1::smallint),
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
    ('Rehabilitacion Demo', 'Tratamiento ficticio funcional.', 45::smallint, 12500.00::numeric),
    ('RPG Demo', 'Reeducacion postural ficticia.', 60::smallint, 15000.00::numeric),
    ('Masoterapia Demo', 'Practica manual ficticia.', 30::smallint, 8000.00::numeric)
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

-- 20 pacientes ficticios ----------------------------------------------------

insert into public.pacientes (
  dni, nombres, apellidos, fecha_nacimiento, telefono, email, direccion,
  obra_social_id, numero_afiliado, fecha_registro, estado
)
select source.dni, source.nombres, source.apellidos, source.fecha_nacimiento,
       source.telefono, source.email, source.direccion, os.id,
       source.numero_afiliado, date '2026-08-01', 'activo'
from (
  values
    ('90000001','Ana Demo','Alvarez Ficticia',date '1988-01-12','011-5555-1001','ana.demo01@example.invalid','Calle Demo 101','DEMO-OS','D-0001'),
    ('90000002','Bruno Demo','Benitez Ficticio',date '1979-02-23','011-5555-1002','bruno.demo02@example.invalid','Calle Demo 102','BIENESTAR-DEMO','B-0002'),
    ('90000003','Carla Demo','Castro Ficticia',date '1994-03-08','011-5555-1003','carla.demo03@example.invalid','Calle Demo 103','MUTUAL-DEMO','M-0003'),
    ('90000004','Diego Demo','Dominguez Ficticio',date '1985-04-17','011-5555-1004','diego.demo04@example.invalid','Calle Demo 104','INTEGRAL-DEMO','I-0004'),
    ('90000005','Elena Demo','Estevez Ficticia',date '1968-05-29','011-5555-1005','elena.demo05@example.invalid','Calle Demo 105','PARTICULAR-DEMO',null),
    ('90000006','Facundo Demo','Fernandez Ficticio',date '1991-06-11','011-5555-1006','facundo.demo06@example.invalid','Calle Demo 106','DEMO-OS','D-0006'),
    ('90000007','Gabriela Demo','Gimenez Ficticia',date '1976-07-22','011-5555-1007','gabriela.demo07@example.invalid','Calle Demo 107','BIENESTAR-DEMO','B-0007'),
    ('90000008','Hugo Demo','Herrera Ficticio',date '1983-08-03','011-5555-1008','hugo.demo08@example.invalid','Calle Demo 108','MUTUAL-DEMO','M-0008'),
    ('90000009','Ines Demo','Ibarra Ficticia',date '1997-09-14','011-5555-1009','ines.demo09@example.invalid','Calle Demo 109','INTEGRAL-DEMO','I-0009'),
    ('90000010','Joaquin Demo','Juarez Ficticio',date '1989-10-25','011-5555-1010','joaquin.demo10@example.invalid','Calle Demo 110','PARTICULAR-DEMO',null),
    ('90000011','Karen Demo','Keller Ficticia',date '1972-11-06','011-5555-1011','karen.demo11@example.invalid','Calle Demo 111','DEMO-OS','D-0011'),
    ('90000012','Lucas Demo','Lopez Ficticio',date '1990-12-18','011-5555-1012','lucas.demo12@example.invalid','Calle Demo 112','BIENESTAR-DEMO','B-0012'),
    ('90000013','Mara Demo','Martinez Ficticia',date '1981-01-30','011-5555-1013','mara.demo13@example.invalid','Calle Demo 113','MUTUAL-DEMO','M-0013'),
    ('90000014','Nicolas Demo','Navarro Ficticio',date '1996-02-09','011-5555-1014','nicolas.demo14@example.invalid','Calle Demo 114','INTEGRAL-DEMO','I-0014'),
    ('90000015','Olivia Demo','Ortega Ficticia',date '1987-03-21','011-5555-1015','olivia.demo15@example.invalid','Calle Demo 115','PARTICULAR-DEMO',null),
    ('90000016','Pablo Demo','Pereyra Ficticio',date '1974-04-02','011-5555-1016','pablo.demo16@example.invalid','Calle Demo 116','DEMO-OS','D-0016'),
    ('90000017','Quimey Demo','Quiroga Ficticia',date '1993-05-13','011-5555-1017','quimey.demo17@example.invalid','Calle Demo 117','BIENESTAR-DEMO','B-0017'),
    ('90000018','Ramon Demo','Romero Ficticio',date '1965-06-24','011-5555-1018','ramon.demo18@example.invalid','Calle Demo 118','MUTUAL-DEMO','M-0018'),
    ('90000019','Sofia Demo','Suarez Ficticia',date '1999-07-05','011-5555-1019','sofia.demo19@example.invalid','Calle Demo 119','INTEGRAL-DEMO','I-0019'),
    ('90000020','Tomas Demo','Torres Ficticio',date '1980-08-16','011-5555-1020','tomas.demo20@example.invalid','Calle Demo 120','PARTICULAR-DEMO',null)
) as source(dni,nombres,apellidos,fecha_nacimiento,telefono,email,direccion,codigo_os,numero_afiliado)
join lateral (
  select resolved.id
  from public.obras_sociales resolved
  where lower(resolved.codigo) = lower(source.codigo_os)
     or (source.codigo_os = 'PARTICULAR-DEMO'
         and lower(resolved.nombre) in (lower('Particular Demo'), lower('Particular')))
  order by case when lower(resolved.codigo) = lower(source.codigo_os) then 0 else 1 end
  limit 1
) os on true
on conflict (dni) do nothing;

-- 24 tratamientos: 20 activos y 4 finalizados -----------------------------

insert into public.tratamientos (
  paciente_id, tipo_tratamiento_id, obra_social_id, box_preferido_id,
  diagnostico, fecha_inicio, fecha_alta_clinica, sesiones_autorizadas,
  numero_autorizacion, precio_sesion, estado
)
select p.id, tt.id, p.obra_social_id, b.id, 'Diagnostico ficticio de demostracion',
       source.fecha_inicio, source.fecha_alta, source.sesiones, source.autorizacion,
       source.precio, source.estado
from (
  values
    ('90000001','Kinesiologia Demo',date '2026-08-01',null::date,10::numeric,'AUT-DEMO-001',10000::numeric,'activo','Box Demo 1'),
    ('90000002','Rehabilitacion Demo',date '2026-08-01',null,12,'AUT-DEMO-002',12500,'activo','Gimnasio Demo'),
    ('90000003','RPG Demo',date '2026-08-02',null,8,'AUT-DEMO-003',15000,'activo','Box Demo 2'),
    ('90000004','Masoterapia Demo',date '2026-08-02',null,6,'AUT-DEMO-004',8000,'activo','Box Demo 1'),
    ('90000005','Kinesiologia Demo',date '2026-08-03',null,10,'AUT-DEMO-005',10000,'activo','Box Demo 2'),
    ('90000006','Rehabilitacion Demo',date '2026-08-03',null,12,'AUT-DEMO-006',12500,'activo','Gimnasio Demo'),
    ('90000007','RPG Demo',date '2026-08-04',null,8,'AUT-DEMO-007',15000,'activo','Box Demo 2'),
    ('90000008','Masoterapia Demo',date '2026-08-04',null,6,'AUT-DEMO-008',8000,'activo','Box Demo 1'),
    ('90000009','Kinesiologia Demo',date '2026-08-05',null,10,'AUT-DEMO-009',10000,'activo','Box Demo 1'),
    ('90000010','Rehabilitacion Demo',date '2026-08-05',null,12,'AUT-DEMO-010',12500,'activo','Gimnasio Demo'),
    ('90000011','RPG Demo',date '2026-08-06',null,8,'AUT-DEMO-011',15000,'activo','Box Demo 2'),
    ('90000012','Masoterapia Demo',date '2026-08-06',null,6,'AUT-DEMO-012',8000,'activo','Box Demo 1'),
    ('90000013','Kinesiologia Demo',date '2026-08-07',null,10,'AUT-DEMO-013',10000,'activo','Box Demo 1'),
    ('90000014','Rehabilitacion Demo',date '2026-08-07',null,12,'AUT-DEMO-014',12500,'activo','Gimnasio Demo'),
    ('90000015','RPG Demo',date '2026-08-08',null,8,'AUT-DEMO-015',15000,'activo','Box Demo 2'),
    ('90000016','Masoterapia Demo',date '2026-08-08',null,6,'AUT-DEMO-016',8000,'activo','Box Demo 1'),
    ('90000017','Kinesiologia Demo',date '2026-08-09',null,10,'AUT-DEMO-017',10000,'activo','Box Demo 1'),
    ('90000018','Rehabilitacion Demo',date '2026-08-09',null,12,'AUT-DEMO-018',12500,'activo','Gimnasio Demo'),
    ('90000019','RPG Demo',date '2026-08-10',null,8,'AUT-DEMO-019',15000,'activo','Box Demo 2'),
    ('90000020','Masoterapia Demo',date '2026-08-10',null,6,'AUT-DEMO-020',8000,'activo','Box Demo 1'),
    ('90000001','Masoterapia Demo',date '2026-05-01',date '2026-06-01',4,'FIN-DEMO-001',8000,'finalizado','Box Demo 1'),
    ('90000002','Kinesiologia Demo',date '2026-05-02',date '2026-06-10',6,'FIN-DEMO-002',10000,'finalizado','Box Demo 2'),
    ('90000003','Rehabilitacion Demo',date '2026-05-03',date '2026-06-15',5,'FIN-DEMO-003',12500,'finalizado','Gimnasio Demo'),
    ('90000004','RPG Demo',date '2026-05-04',date '2026-06-20',4,'FIN-DEMO-004',15000,'finalizado','Box Demo 2')
) as source(dni,tipo,fecha_inicio,fecha_alta,sesiones,autorizacion,precio,estado,box_nombre)
join public.pacientes p on p.dni = source.dni
join public.tipos_tratamiento tt on lower(tt.nombre) = lower(source.tipo)
join public.boxes b on lower(b.nombre) = lower(source.box_nombre)
where not exists (
  select 1 from public.tratamientos t
  where t.paciente_id = p.id and t.tipo_tratamiento_id = tt.id
    and t.fecha_inicio = source.fecha_inicio
);

-- 20 turnos ficticios -------------------------------------------------------

insert into public.turnos (
  paciente_id, tratamiento_id, box_id, inicio_at, fin_at, estado,
  motivo_cancelacion, cancelado_at, observaciones
)
select p.id, t.id, b.id, source.inicio_at,
       source.inicio_at + make_interval(mins => tt.duracion_minutos), source.estado,
       case when source.estado = 'cancelado' then 'Cancelacion ficticia' end,
       case when source.estado = 'cancelado' then source.inicio_at - interval '1 day' end,
       'Turno ficticio generado por seed'
from (
  values
    ('90000001','Kinesiologia Demo','Box Demo 1',timestamptz '2026-08-10 08:00:00-03','atendido'),
    ('90000002','Rehabilitacion Demo','Gimnasio Demo',timestamptz '2026-08-10 09:00:00-03','atendido'),
    ('90000003','RPG Demo','Box Demo 2',timestamptz '2026-08-11 10:00:00-03','atendido'),
    ('90000004','Masoterapia Demo','Box Demo 1',timestamptz '2026-08-11 11:00:00-03','atendido'),
    ('90000005','Kinesiologia Demo','Box Demo 2',timestamptz '2026-08-12 08:00:00-03','atendido'),
    ('90000006','Rehabilitacion Demo','Gimnasio Demo',timestamptz '2026-08-12 09:00:00-03','atendido'),
    ('90000007','RPG Demo','Box Demo 2',timestamptz '2026-08-13 10:00:00-03','atendido'),
    ('90000008','Masoterapia Demo','Box Demo 1',timestamptz '2026-08-13 11:00:00-03','atendido'),
    ('90000009','Kinesiologia Demo','Box Demo 1',timestamptz '2026-08-14 08:00:00-03','atendido'),
    ('90000010','Rehabilitacion Demo','Gimnasio Demo',timestamptz '2026-08-14 09:00:00-03','atendido'),
    ('90000011','RPG Demo','Box Demo 2',timestamptz '2026-08-19 10:00:00-03','confirmado'),
    ('90000012','Masoterapia Demo','Box Demo 1',timestamptz '2026-08-19 11:00:00-03','programado'),
    ('90000013','Kinesiologia Demo','Box Demo 1',timestamptz '2026-08-20 08:00:00-03','confirmado'),
    ('90000014','Rehabilitacion Demo','Gimnasio Demo',timestamptz '2026-08-20 09:00:00-03','programado'),
    ('90000015','RPG Demo','Box Demo 2',timestamptz '2026-08-21 10:00:00-03','cancelado'),
    ('90000016','Masoterapia Demo','Box Demo 1',timestamptz '2026-08-21 11:00:00-03','ausente'),
    ('90000017','Kinesiologia Demo','Box Demo 1',timestamptz '2026-08-24 08:00:00-03','confirmado'),
    ('90000018','Rehabilitacion Demo','Gimnasio Demo',timestamptz '2026-08-24 09:00:00-03','programado'),
    ('90000019','RPG Demo','Box Demo 2',timestamptz '2026-08-25 10:00:00-03','confirmado'),
    ('90000020','Masoterapia Demo','Box Demo 1',timestamptz '2026-08-25 11:00:00-03','programado')
) as source(dni,tipo,box_nombre,inicio_at,estado)
join public.pacientes p on p.dni = source.dni
join public.tipos_tratamiento tt on lower(tt.nombre) = lower(source.tipo)
join public.tratamientos t on t.paciente_id = p.id
  and t.tipo_tratamiento_id = tt.id
  and t.numero_autorizacion = 'AUT-DEMO-' || right(source.dni, 3)
  and t.estado = 'activo'
join public.boxes b on lower(b.nombre) = lower(source.box_nombre)
where not exists (
  select 1 from public.turnos existing
  where existing.paciente_id = p.id and existing.inicio_at = source.inicio_at
);

-- 14 sesiones: 10 desde turnos atendidos y 4 historicas --------------------

insert into public.sesiones (
  turno_id, paciente_id, tratamiento_id, fecha_atencion, estado,
  unidades_consumidas, notas
)
select tu.id, tu.paciente_id, tu.tratamiento_id, tu.inicio_at, 'realizada', 1.00,
       'Sesion ficticia asociada a turno'
from public.turnos tu
join public.pacientes p on p.id = tu.paciente_id and p.dni between '90000001' and '90000010'
where tu.estado = 'atendido'
  and tu.observaciones = 'Turno ficticio generado por seed'
  and not exists (select 1 from public.sesiones s where s.turno_id = tu.id);

insert into public.sesiones (
  paciente_id, tratamiento_id, fecha_atencion, estado, unidades_consumidas, notas
)
select p.id, t.id, source.fecha_atencion, 'realizada', 1.00,
       'Sesion historica ficticia sin turno'
from (
  values
    ('90000001','FIN-DEMO-001',timestamptz '2026-05-10 08:00:00-03'),
    ('90000002','FIN-DEMO-002',timestamptz '2026-05-11 09:00:00-03'),
    ('90000003','FIN-DEMO-003',timestamptz '2026-05-12 10:00:00-03'),
    ('90000004','FIN-DEMO-004',timestamptz '2026-05-13 11:00:00-03')
) as source(dni,autorizacion,fecha_atencion)
join public.pacientes p on p.dni = source.dni
join public.tratamientos t on t.paciente_id = p.id and t.numero_autorizacion = source.autorizacion
where not exists (
  select 1 from public.sesiones s
  where s.tratamiento_id = t.id and s.fecha_atencion = source.fecha_atencion
);

-- 12 pagos y 10 aplicaciones ficticias -------------------------------------

insert into public.pagos (
  paciente_id, tratamiento_id, metodo_pago_id, fecha_pago, importe,
  referencia, concepto, estado
)
select p.id, t.id, mp.id, source.fecha_pago, source.importe, source.referencia,
       'Pago ficticio de sesion', 'confirmado'
from (
  values
    ('90000001','AUT-DEMO-001','Efectivo',timestamptz '2026-08-10 09:00:00-03',10000::numeric,'SEED-PAGO-001'),
    ('90000002','AUT-DEMO-002','Transferencia',timestamptz '2026-08-10 10:00:00-03',12500,'SEED-PAGO-002'),
    ('90000003','AUT-DEMO-003','Tarjeta',timestamptz '2026-08-11 11:00:00-03',15000,'SEED-PAGO-003'),
    ('90000004','AUT-DEMO-004','Efectivo',timestamptz '2026-08-11 12:00:00-03',8000,'SEED-PAGO-004'),
    ('90000005','AUT-DEMO-005','Transferencia',timestamptz '2026-08-12 09:00:00-03',10000,'SEED-PAGO-005'),
    ('90000006','AUT-DEMO-006','Tarjeta',timestamptz '2026-08-12 10:00:00-03',12500,'SEED-PAGO-006'),
    ('90000007','AUT-DEMO-007','Efectivo',timestamptz '2026-08-13 11:00:00-03',15000,'SEED-PAGO-007'),
    ('90000008','AUT-DEMO-008','Transferencia',timestamptz '2026-08-13 12:00:00-03',8000,'SEED-PAGO-008'),
    ('90000009','AUT-DEMO-009','Tarjeta',timestamptz '2026-08-14 09:00:00-03',10000,'SEED-PAGO-009'),
    ('90000010','AUT-DEMO-010','Efectivo',timestamptz '2026-08-14 10:00:00-03',12500,'SEED-PAGO-010'),
    ('90000011','AUT-DEMO-011','Transferencia',timestamptz '2026-08-18 10:00:00-03',15000,'SEED-PAGO-011'),
    ('90000012','AUT-DEMO-012','Tarjeta',timestamptz '2026-08-18 11:00:00-03',8000,'SEED-PAGO-012')
) as source(dni,autorizacion,metodo,fecha_pago,importe,referencia)
join public.pacientes p on p.dni = source.dni
join public.tratamientos t on t.paciente_id = p.id and t.numero_autorizacion = source.autorizacion
join public.metodos_pago mp on lower(mp.nombre) = lower(source.metodo)
where not exists (
  select 1 from public.pagos existing where existing.referencia = source.referencia
);

insert into public.pago_aplicaciones (
  pago_id, tratamiento_id, sesion_id, importe_aplicado, estado
)
select pa.id, s.tratamiento_id, s.id, pa.importe, 'aplicado'
from public.pagos pa
join public.pacientes p on p.id = pa.paciente_id and p.dni between '90000001' and '90000010'
join public.sesiones s on s.paciente_id = p.id and s.tratamiento_id = pa.tratamiento_id and s.turno_id is not null
join public.turnos tu on tu.id = s.turno_id and tu.observaciones = 'Turno ficticio generado por seed'
where pa.referencia between 'SEED-PAGO-001' and 'SEED-PAGO-010'
  and not exists (
    select 1 from public.pago_aplicaciones existing
    where existing.pago_id = pa.id and existing.sesion_id = s.id
  );

-- 8 metadatos ficticios de documentos; no se crean objetos en Storage -------

insert into public.documentos (
  paciente_id, tratamiento_id, obra_social_id, nombre, tipo_documento,
  storage_bucket, storage_path, mime_type, tamanio_bytes, estado
)
select p.id, t.id, p.obra_social_id, source.nombre, source.tipo_documento,
       'documentos-demo', source.storage_path, 'application/pdf', source.tamanio, 'vigente'
from (
  values
    ('90000001','AUT-DEMO-001','Orden medica ficticia 01','orden_medica','seed/90000001/orden-demo.pdf',12000::bigint),
    ('90000002','AUT-DEMO-002','Autorizacion ficticia 02','autorizacion','seed/90000002/autorizacion-demo.pdf',13500::bigint),
    ('90000003','AUT-DEMO-003','Informe ficticio 03','informe','seed/90000003/informe-demo.pdf',14200::bigint),
    ('90000004','AUT-DEMO-004','Orden medica ficticia 04','orden_medica','seed/90000004/orden-demo.pdf',11800::bigint),
    ('90000005','AUT-DEMO-005','Autorizacion ficticia 05','autorizacion','seed/90000005/autorizacion-demo.pdf',13100::bigint),
    ('90000006','AUT-DEMO-006','Informe ficticio 06','informe','seed/90000006/informe-demo.pdf',14900::bigint),
    ('90000007','AUT-DEMO-007','Orden medica ficticia 07','orden_medica','seed/90000007/orden-demo.pdf',12500::bigint),
    ('90000008','AUT-DEMO-008','Autorizacion ficticia 08','autorizacion','seed/90000008/autorizacion-demo.pdf',13700::bigint)
) as source(dni,autorizacion,nombre,tipo_documento,storage_path,tamanio)
join public.pacientes p on p.dni = source.dni
join public.tratamientos t on t.paciente_id = p.id and t.numero_autorizacion = source.autorizacion
where not exists (
  select 1 from public.documentos d
  where d.storage_bucket = 'documentos-demo' and d.storage_path = source.storage_path
);

-- 15 franjas horarias: lunes a viernes para cada uno de los 3 boxes ---------

insert into public.configuracion_horarios (
  box_id, dia_semana, hora_desde, hora_hasta, capacidad, vigencia_desde
)
select b.id, d.dia_semana, time '08:00', time '20:00', b.capacidad, date '2026-01-01'
from public.boxes b
cross join (values (1::smallint),(2::smallint),(3::smallint),(4::smallint),(5::smallint)) as d(dia_semana)
where lower(b.nombre) in (lower('Box Demo 1'),lower('Box Demo 2'),lower('Gimnasio Demo'))
  and not exists (
    select 1 from public.configuracion_horarios ch
    where ch.box_id = b.id and ch.dia_semana = d.dia_semana
      and ch.hora_desde = time '08:00' and ch.hora_hasta = time '20:00'
      and ch.vigencia_desde = date '2026-01-01'
  );
