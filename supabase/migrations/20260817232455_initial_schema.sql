-- Club del Kine - Etapa 2
-- Esquema inicial PostgreSQL para Supabase.
-- Migracion aditiva: no elimina tablas ni datos existentes.

create extension if not exists pgcrypto with schema extensions;

-- Evita secuestro de nombres usados por funciones SECURITY DEFINER. Los
-- clientes conservan USAGE para acceder a los objetos publicados por RLS.
revoke create on schema public from public, anon, authenticated;
grant usage on schema public to authenticated;

-- Funciones base ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Identidad y autorizacion --------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null check (btrim(nombre_completo) <> ''),
  email text not null check (email = lower(email) and position('@' in email) > 1),
  rol text not null default 'recepcion' check (rol in ('administrador', 'recepcion')),
  activo boolean not null default true,
  ultimo_acceso_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_uidx on public.profiles (lower(email));
create index if not exists profiles_rol_activo_idx on public.profiles (rol, activo);

create or replace function public.current_user_has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo
      and p.rol = any(roles)
  );
$$;

revoke all on function public.current_user_has_role(text[]) from public;
grant execute on function public.current_user_has_role(text[]) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  insert into public.profiles (id, nombre_completo, email, rol)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nombre_completo'), ''),
             nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
             split_part(coalesce(new.email, new.id::text), '@', 1)),
    lower(coalesce(new.email, new.id::text || '@sin-email.local')),
    'recepcion'
  )
  on conflict (id) do update
  set email = excluded.email,
      nombre_completo = case
        when public.profiles.nombre_completo = '' then excluded.nombre_completo
        else public.profiles.nombre_completo
      end,
      updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists club_del_kine_sync_profile_from_auth on auth.users;
create trigger club_del_kine_sync_profile_from_auth
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_auth_user();

-- Sincroniza usuarios creados antes de esta migracion. El rol se limita de
-- forma deliberada a recepcion. El rol nunca se toma de metadatos controlados
-- por el usuario. El primer administrador se asigna por SQL confiable.
insert into public.profiles (id, nombre_completo, email, rol, created_at, updated_at)
select
  u.id,
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'nombre_completo'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
           split_part(coalesce(u.email, u.id::text), '@', 1)),
  lower(coalesce(u.email, u.id::text || '@sin-email.local')),
  'recepcion',
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do nothing;

-- Catalogos y configuracion -------------------------------------------------

create table if not exists public.obras_sociales (
  id uuid primary key default extensions.gen_random_uuid(),
  nombre text not null check (btrim(nombre) <> ''),
  codigo text,
  telefono text,
  email text check (email is null or position('@' in email) > 1),
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint obras_sociales_codigo_uk unique (codigo)
);
create unique index if not exists obras_sociales_nombre_uidx on public.obras_sociales (lower(nombre));
create unique index if not exists obras_sociales_codigo_lower_uidx
  on public.obras_sociales (lower(codigo)) where codigo is not null;
create index if not exists obras_sociales_activo_idx on public.obras_sociales (activo);

create table if not exists public.requisitos_obra_social (
  id uuid primary key default extensions.gen_random_uuid(),
  obra_social_id uuid not null references public.obras_sociales(id) on delete restrict,
  nombre text not null check (btrim(nombre) <> ''),
  descripcion text,
  obligatorio boolean not null default true,
  vigencia_desde date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requisitos_vigencia_ck check (vigencia_hasta is null or vigencia_desde is null or vigencia_hasta >= vigencia_desde),
  constraint requisitos_obra_social_nombre_uk unique (obra_social_id, nombre),
  constraint requisitos_obra_social_contexto_uk unique (id, obra_social_id)
);
create index if not exists requisitos_obra_social_idx on public.requisitos_obra_social (obra_social_id, activo);
create unique index if not exists requisitos_obra_social_nombre_lower_uidx
  on public.requisitos_obra_social (obra_social_id, lower(nombre));

create table if not exists public.reglas_consumo_sesion (
  id uuid primary key default extensions.gen_random_uuid(),
  obra_social_id uuid references public.obras_sociales(id) on delete restrict,
  estado_turno text not null check (estado_turno in ('programado', 'confirmado', 'presente', 'atendido', 'cancelado', 'ausente')),
  consume_sesion boolean not null,
  cantidad numeric(6,2) not null default 1.00 check (cantidad >= 0),
  prioridad smallint not null default 100 check (prioridad >= 0),
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reglas_consumo_vigencia_ck check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde),
  constraint reglas_consumo_coherencia_ck check (
    (consume_sesion and cantidad > 0) or (not consume_sesion and cantidad = 0)
  )
);
create index if not exists reglas_consumo_busqueda_idx on public.reglas_consumo_sesion (obra_social_id, estado_turno, activo, vigencia_desde, vigencia_hasta);
create unique index if not exists reglas_consumo_clave_natural_uidx
  on public.reglas_consumo_sesion (
    coalesce(obra_social_id, '00000000-0000-0000-0000-000000000000'::uuid),
    estado_turno,
    vigencia_desde,
    prioridad
  );

create table if not exists public.boxes (
  id uuid primary key default extensions.gen_random_uuid(),
  nombre text not null check (btrim(nombre) <> ''),
  descripcion text,
  capacidad smallint not null default 1 check (capacidad > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists boxes_nombre_uidx on public.boxes (lower(nombre));
create index if not exists boxes_activo_idx on public.boxes (activo);

create table if not exists public.tipos_tratamiento (
  id uuid primary key default extensions.gen_random_uuid(),
  nombre text not null check (btrim(nombre) <> ''),
  descripcion text,
  duracion_minutos smallint not null default 60 check (duracion_minutos > 0),
  precio_referencia numeric(12,2) check (precio_referencia is null or precio_referencia >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tipos_tratamiento_nombre_uidx on public.tipos_tratamiento (lower(nombre));
create index if not exists tipos_tratamiento_activo_idx on public.tipos_tratamiento (activo);

create table if not exists public.metodos_pago (
  id uuid primary key default extensions.gen_random_uuid(),
  nombre text not null check (btrim(nombre) <> ''),
  requiere_referencia boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists metodos_pago_nombre_uidx on public.metodos_pago (lower(nombre));
create index if not exists metodos_pago_activo_idx on public.metodos_pago (activo);

-- Pacientes y tratamientos --------------------------------------------------

create table if not exists public.pacientes (
  id uuid primary key default extensions.gen_random_uuid(),
  dni text not null check (dni ~ '^[0-9]{6,10}$'),
  nombres text not null check (btrim(nombres) <> ''),
  apellidos text not null check (btrim(apellidos) <> ''),
  fecha_nacimiento date,
  telefono text,
  email text check (email is null or position('@' in email) > 1),
  direccion text,
  contacto_emergencia text,
  telefono_emergencia text,
  obra_social_id uuid references public.obras_sociales(id) on delete restrict,
  numero_afiliado text,
  observaciones text,
  fecha_registro date not null default current_date,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo', 'archivado')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pacientes_dni_uk unique (dni),
  constraint pacientes_afiliacion_ck check (numero_afiliado is null or obra_social_id is not null)
);
create index if not exists pacientes_nombre_idx on public.pacientes (lower(apellidos), lower(nombres));
create index if not exists pacientes_obra_social_idx on public.pacientes (obra_social_id);
create index if not exists pacientes_estado_idx on public.pacientes (estado);

create or replace function public.validate_paciente_fecha_nacimiento()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.fecha_nacimiento is not null and new.fecha_nacimiento > current_date then
    raise exception 'La fecha de nacimiento no puede estar en el futuro';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_paciente_fecha_nacimiento() from public;
drop trigger if exists club_del_kine_validate_paciente_fecha_nacimiento on public.pacientes;
create trigger club_del_kine_validate_paciente_fecha_nacimiento
  before insert or update of fecha_nacimiento on public.pacientes
  for each row execute function public.validate_paciente_fecha_nacimiento();

create table if not exists public.tratamientos (
  id uuid primary key default extensions.gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  tipo_tratamiento_id uuid not null references public.tipos_tratamiento(id) on delete restrict,
  obra_social_id uuid references public.obras_sociales(id) on delete restrict,
  box_preferido_id uuid references public.boxes(id) on delete set null,
  diagnostico text,
  indicaciones text,
  fecha_inicio date not null default current_date,
  fecha_alta_clinica date,
  sesiones_autorizadas numeric(6,2) check (sesiones_autorizadas is null or sesiones_autorizadas >= 0),
  numero_autorizacion text,
  precio_sesion numeric(12,2) check (precio_sesion is null or precio_sesion >= 0),
  estado text not null default 'activo' check (estado in ('borrador', 'activo', 'pausado', 'finalizado', 'cancelado')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tratamientos_fechas_ck check (fecha_alta_clinica is null or fecha_alta_clinica >= fecha_inicio),
  constraint tratamientos_paciente_uk unique (id, paciente_id)
);
create index if not exists tratamientos_paciente_estado_idx on public.tratamientos (paciente_id, estado);
create index if not exists tratamientos_tipo_idx on public.tratamientos (tipo_tratamiento_id);
create index if not exists tratamientos_obra_social_idx on public.tratamientos (obra_social_id);

-- Agenda y sesiones ---------------------------------------------------------

create table if not exists public.turnos (
  id uuid primary key default extensions.gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  tratamiento_id uuid not null references public.tratamientos(id) on delete restrict,
  box_id uuid not null references public.boxes(id) on delete restrict,
  inicio_at timestamptz not null,
  fin_at timestamptz not null,
  estado text not null default 'programado' check (estado in ('programado', 'confirmado', 'presente', 'atendido', 'cancelado', 'ausente')),
  motivo_cancelacion text,
  observaciones text,
  cancelado_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turnos_horario_ck check (fin_at > inicio_at),
  constraint turnos_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict,
  constraint turnos_cancelacion_ck check (
    (estado = 'cancelado' and cancelado_at is not null
      and nullif(btrim(motivo_cancelacion), '') is not null)
    or (estado <> 'cancelado' and cancelado_at is null and motivo_cancelacion is null)
  ),
  constraint turnos_paciente_tratamiento_uk unique (id, paciente_id, tratamiento_id)
);
create index if not exists turnos_inicio_idx on public.turnos (inicio_at);
create index if not exists turnos_box_inicio_idx on public.turnos (box_id, inicio_at, fin_at) where estado not in ('cancelado', 'ausente');
create index if not exists turnos_paciente_idx on public.turnos (paciente_id, inicio_at desc);
create index if not exists turnos_tratamiento_idx on public.turnos (tratamiento_id, inicio_at desc);
create index if not exists turnos_estado_idx on public.turnos (estado);

create table if not exists public.sesiones (
  id uuid primary key default extensions.gen_random_uuid(),
  turno_id uuid,
  paciente_id uuid not null,
  tratamiento_id uuid not null,
  fecha_atencion timestamptz not null default now(),
  estado text not null default 'realizada' check (estado in ('realizada', 'ausente_consumida', 'anulada')),
  unidades_consumidas numeric(6,2) not null default 1.00 check (unidades_consumidas >= 0),
  regla_consumo_id uuid references public.reglas_consumo_sesion(id) on delete set null,
  notas text,
  anulada_at timestamptz,
  motivo_anulacion text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sesiones_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict,
  constraint sesiones_turno_contexto_fk foreign key (turno_id, paciente_id, tratamiento_id)
    references public.turnos(id, paciente_id, tratamiento_id) on delete restrict,
  constraint sesiones_turno_uk unique (turno_id),
  constraint sesiones_anulacion_ck check (
    (estado = 'anulada' and anulada_at is not null
      and nullif(btrim(motivo_anulacion), '') is not null)
    or (estado <> 'anulada' and anulada_at is null and motivo_anulacion is null)
  )
);
create index if not exists sesiones_paciente_fecha_idx on public.sesiones (paciente_id, fecha_atencion desc);
create index if not exists sesiones_tratamiento_fecha_idx on public.sesiones (tratamiento_id, fecha_atencion desc);
create index if not exists sesiones_estado_idx on public.sesiones (estado);

-- Caja, pagos y devoluciones ------------------------------------------------

create table if not exists public.pagos (
  id uuid primary key default extensions.gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  tratamiento_id uuid references public.tratamientos(id) on delete restrict,
  metodo_pago_id uuid not null references public.metodos_pago(id) on delete restrict,
  fecha_pago timestamptz not null default now(),
  importe numeric(12,2) not null check (importe > 0),
  referencia text,
  concepto text not null check (btrim(concepto) <> ''),
  estado text not null default 'confirmado' check (estado in ('pendiente', 'confirmado', 'anulado')),
  anulado_at timestamptz,
  motivo_anulacion text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pagos_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict,
  constraint pagos_anulacion_ck check (
    (estado = 'anulado' and anulado_at is not null
      and nullif(btrim(motivo_anulacion), '') is not null)
    or (estado <> 'anulado' and anulado_at is null and motivo_anulacion is null)
  )
);
create index if not exists pagos_paciente_fecha_idx on public.pagos (paciente_id, fecha_pago desc);
create index if not exists pagos_tratamiento_idx on public.pagos (tratamiento_id);
create index if not exists pagos_fecha_estado_idx on public.pagos (fecha_pago, estado);
create index if not exists pagos_metodo_idx on public.pagos (metodo_pago_id);

create table if not exists public.pago_aplicaciones (
  id uuid primary key default extensions.gen_random_uuid(),
  pago_id uuid not null references public.pagos(id) on delete restrict,
  tratamiento_id uuid references public.tratamientos(id) on delete restrict,
  sesion_id uuid references public.sesiones(id) on delete restrict,
  importe_aplicado numeric(12,2) not null check (importe_aplicado > 0),
  estado text not null default 'aplicado' check (estado in ('aplicado', 'anulado')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pago_aplicaciones_destino_ck check (tratamiento_id is not null or sesion_id is not null),
  constraint pago_aplicaciones_pago_sesion_uk unique (pago_id, sesion_id)
);
create index if not exists pago_aplicaciones_pago_idx on public.pago_aplicaciones (pago_id, estado);
create index if not exists pago_aplicaciones_tratamiento_idx on public.pago_aplicaciones (tratamiento_id);
create index if not exists pago_aplicaciones_sesion_idx on public.pago_aplicaciones (sesion_id);

create table if not exists public.devoluciones (
  id uuid primary key default extensions.gen_random_uuid(),
  pago_id uuid not null references public.pagos(id) on delete restrict,
  metodo_pago_id uuid not null references public.metodos_pago(id) on delete restrict,
  fecha_devolucion timestamptz not null default now(),
  importe numeric(12,2) not null check (importe > 0),
  motivo text not null check (btrim(motivo) <> ''),
  referencia text,
  estado text not null default 'confirmada' check (estado in ('pendiente', 'confirmada', 'anulada')),
  anulada_at timestamptz,
  motivo_anulacion text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devoluciones_anulacion_ck check (
    (estado = 'anulada' and anulada_at is not null
      and nullif(btrim(motivo_anulacion), '') is not null)
    or (estado <> 'anulada' and anulada_at is null and motivo_anulacion is null)
  )
);
create index if not exists devoluciones_pago_idx on public.devoluciones (pago_id, fecha_devolucion desc);
create index if not exists devoluciones_fecha_estado_idx on public.devoluciones (fecha_devolucion, estado);

-- Los movimientos financieros se validan bajo bloqueo del pago para evitar
-- sobreaplicaciones o devoluciones concurrentes. Las anulaciones no computan.
create or replace function public.validate_pago_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  applied_total numeric(12,2);
  refunded_total numeric(12,2);
  related_count bigint;
  active_related_count bigint;
  method_requires_reference boolean;
  actor_is_admin boolean;
begin
  -- UPDATE ya mantiene un bloqueo de fila sobre el pago durante toda la
  -- transaccion. Las consultas siguientes observan el mismo snapshot.
  select mp.requiere_referencia
    into method_requires_reference
  from public.metodos_pago mp
  where mp.id = new.metodo_pago_id;

  if method_requires_reference and nullif(btrim(new.referencia), '') is null then
    raise exception 'El metodo de pago requiere una referencia';
  end if;

  if tg_op = 'INSERT' then
    if new.estado = 'anulado' then
      raise exception 'Un pago nuevo no puede registrarse anulado';
    end if;
    return new;
  end if;

  select
    (select count(*) from public.pago_aplicaciones pa where pa.pago_id = old.id),
    coalesce((select sum(pa.importe_aplicado) from public.pago_aplicaciones pa
              where pa.pago_id = old.id and pa.estado = 'aplicado'), 0),
    coalesce((select sum(d.importe) from public.devoluciones d
              where d.pago_id = old.id and d.estado = 'confirmada'), 0),
    (select count(*) from public.pago_aplicaciones pa
      where pa.pago_id = old.id and pa.estado = 'aplicado')
      + (select count(*) from public.devoluciones d
          where d.pago_id = old.id and d.estado <> 'anulada'),
    public.current_user_has_role(array['administrador'])
  into related_count, applied_total, refunded_total, active_related_count, actor_is_admin;

  if exists (select 1 from public.devoluciones d where d.pago_id = old.id) then
    related_count := related_count + 1;
  end if;

  if related_count > 0 and
     (new.paciente_id is distinct from old.paciente_id
      or new.tratamiento_id is distinct from old.tratamiento_id
      or new.metodo_pago_id is distinct from old.metodo_pago_id) then
    raise exception 'No se puede cambiar paciente, tratamiento o metodo de un pago con movimientos';
  end if;

  if new.importe < applied_total + refunded_total then
    raise exception 'El nuevo importe es menor que el total aplicado y devuelto';
  end if;

  if old.estado = 'anulado' and new is distinct from old then
    raise exception 'Un pago anulado es inmutable';
  end if;
  if old.estado = 'confirmado' and new.estado = 'pendiente' then
    raise exception 'Un pago confirmado no puede volver a pendiente';
  end if;
  if old.estado = 'confirmado' and not actor_is_admin and
     (new.importe is distinct from old.importe
      or new.paciente_id is distinct from old.paciente_id
      or new.tratamiento_id is distinct from old.tratamiento_id
      or new.metodo_pago_id is distinct from old.metodo_pago_id
      or new.fecha_pago is distinct from old.fecha_pago) then
    raise exception 'Recepcion no puede alterar los datos economicos de un pago confirmado';
  end if;
  if new.estado = 'anulado' and old.estado <> 'anulado' then
    if not actor_is_admin then
      raise exception 'Solo administracion puede anular pagos';
    end if;
    if active_related_count > 0 then
      raise exception 'No se puede anular un pago con aplicaciones o devoluciones activas';
    end if;
    if new.anulado_at is null or nullif(btrim(new.motivo_anulacion), '') is null then
      raise exception 'La anulacion requiere fecha y motivo';
    end if;
  elsif new.estado <> 'anulado' and
        (new.anulado_at is not null or new.motivo_anulacion is not null) then
    raise exception 'Un pago no anulado no puede tener datos de anulacion';
  end if;

  return new;
end;
$$;

create or replace function public.validate_pago_aplicacion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  payment public.pagos%rowtype;
  applied_total numeric(12,2);
  refunded_total numeric(12,2);
  target_patient_id uuid;
  target_treatment_id uuid;
begin
  if tg_op = 'UPDATE' and new.pago_id <> old.pago_id then
    raise exception 'No se puede cambiar el pago de una aplicacion existente';
  end if;
  if tg_op = 'INSERT' and new.estado <> 'aplicado' then
    raise exception 'Una aplicacion nueva debe registrarse aplicada';
  end if;
  if tg_op = 'UPDATE' and old.estado = 'anulado' and new is distinct from old then
    raise exception 'Una aplicacion anulada es inmutable';
  end if;
  if tg_op = 'UPDATE' and
     (new.pago_id is distinct from old.pago_id
      or new.tratamiento_id is distinct from old.tratamiento_id
      or new.sesion_id is distinct from old.sesion_id
      or new.importe_aplicado is distinct from old.importe_aplicado) then
    raise exception 'No se pueden alterar los datos economicos de una aplicacion existente';
  end if;
  if tg_op = 'UPDATE' and old.estado = 'aplicado' and new.estado = 'anulado'
     and not public.current_user_has_role(array['administrador']) then
    raise exception 'Solo administracion puede anular aplicaciones de pago';
  end if;
  select * into payment from public.pagos where id = new.pago_id for update;
  if not found then
    raise exception 'El pago indicado no existe';
  end if;
  if payment.estado <> 'confirmado' and new.estado = 'aplicado' then
    raise exception 'Solo se pueden aplicar pagos confirmados';
  end if;

  if new.sesion_id is not null then
    select paciente_id, tratamiento_id
      into target_patient_id, target_treatment_id
    from public.sesiones where id = new.sesion_id;
    if not found then
      raise exception 'La sesion indicada no existe';
    end if;
    if new.tratamiento_id is not null and new.tratamiento_id <> target_treatment_id then
      raise exception 'La sesion no pertenece al tratamiento indicado';
    end if;
  elsif new.tratamiento_id is not null then
    select paciente_id, id into target_patient_id, target_treatment_id
    from public.tratamientos where id = new.tratamiento_id;
  end if;

  if target_patient_id is distinct from payment.paciente_id then
    raise exception 'El destino de la aplicacion no pertenece al paciente del pago';
  end if;
  if payment.tratamiento_id is not null and
     target_treatment_id is distinct from payment.tratamiento_id then
    raise exception 'La aplicacion no pertenece al tratamiento del pago';
  end if;

  select coalesce(sum(importe_aplicado), 0)
    into applied_total
  from public.pago_aplicaciones
  where pago_id = new.pago_id
    and estado = 'aplicado'
    and id <> new.id;

  select coalesce(sum(importe), 0)
    into refunded_total
  from public.devoluciones
  where pago_id = new.pago_id
    and estado = 'confirmada';

  if new.estado = 'aplicado' and
     applied_total + refunded_total + new.importe_aplicado > payment.importe then
    raise exception 'La aplicacion supera el saldo disponible del pago';
  end if;
  return new;
end;
$$;

create or replace function public.validate_devolucion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  payment public.pagos%rowtype;
  refunded_total numeric(12,2);
  applied_total numeric(12,2);
  method_requires_reference boolean;
begin
  if tg_op = 'UPDATE' and new.pago_id <> old.pago_id then
    raise exception 'No se puede cambiar el pago de una devolucion existente';
  end if;
  select * into payment from public.pagos where id = new.pago_id for update;
  if not found then
    raise exception 'El pago indicado no existe';
  end if;
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

  select coalesce(sum(importe), 0)
    into refunded_total
  from public.devoluciones
  where pago_id = new.pago_id
    and estado = 'confirmada'
    and id <> new.id;

  select coalesce(sum(importe_aplicado), 0)
    into applied_total
  from public.pago_aplicaciones
  where pago_id = new.pago_id
    and estado = 'aplicado';

  if new.estado = 'confirmada' and
     applied_total + refunded_total + new.importe > payment.importe then
    raise exception 'La devolucion supera el saldo disponible del pago';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_pago_aplicacion() from public;
revoke all on function public.validate_devolucion() from public;
revoke all on function public.validate_pago_write() from public;

drop trigger if exists club_del_kine_validate_pago_before_write on public.pagos;
create trigger club_del_kine_validate_pago_before_write
  before insert or update on public.pagos
  for each row execute function public.validate_pago_write();
drop trigger if exists club_del_kine_validate_pago_aplicacion_before_write on public.pago_aplicaciones;
create trigger club_del_kine_validate_pago_aplicacion_before_write
  before insert or update on public.pago_aplicaciones
  for each row execute function public.validate_pago_aplicacion();
drop trigger if exists club_del_kine_validate_devolucion_before_write on public.devoluciones;
create trigger club_del_kine_validate_devolucion_before_write
  before insert or update on public.devoluciones
  for each row execute function public.validate_devolucion();

-- Documentos, espera y horarios --------------------------------------------

create table if not exists public.documentos (
  id uuid primary key default extensions.gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  tratamiento_id uuid references public.tratamientos(id) on delete restrict,
  obra_social_id uuid references public.obras_sociales(id) on delete restrict,
  requisito_obra_social_id uuid references public.requisitos_obra_social(id) on delete set null,
  nombre text not null check (btrim(nombre) <> ''),
  tipo_documento text not null check (btrim(tipo_documento) <> ''),
  storage_bucket text not null check (btrim(storage_bucket) <> ''),
  storage_path text not null check (btrim(storage_path) <> ''),
  mime_type text,
  tamanio_bytes bigint check (tamanio_bytes is null or tamanio_bytes >= 0),
  fecha_vencimiento date,
  estado text not null default 'vigente' check (estado in ('pendiente', 'vigente', 'vencido', 'reemplazado', 'archivado')),
  reemplazado_por_id uuid references public.documentos(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documentos_storage_uk unique (storage_bucket, storage_path),
  constraint documentos_reemplazo_ck check (reemplazado_por_id is null or reemplazado_por_id <> id),
  constraint documentos_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict,
  constraint documentos_requisito_obra_ck check (
    requisito_obra_social_id is null or obra_social_id is not null
  ),
  constraint documentos_requisito_obra_fk foreign key (requisito_obra_social_id, obra_social_id)
    references public.requisitos_obra_social(id, obra_social_id) on delete restrict
);
create index if not exists documentos_paciente_idx on public.documentos (paciente_id, estado);
create index if not exists documentos_tratamiento_idx on public.documentos (tratamiento_id);
create index if not exists documentos_vencimiento_idx on public.documentos (fecha_vencimiento) where estado = 'vigente';

create table if not exists public.lista_espera (
  id uuid primary key default extensions.gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  tratamiento_id uuid references public.tratamientos(id) on delete restrict,
  tipo_tratamiento_id uuid references public.tipos_tratamiento(id) on delete restrict,
  box_id uuid references public.boxes(id) on delete set null,
  fecha_desde date not null default current_date,
  fecha_hasta date,
  hora_desde time,
  hora_hasta time,
  dias_semana smallint[] not null default array[1,2,3,4,5]::smallint[],
  prioridad smallint not null default 100 check (prioridad >= 0),
  observaciones text,
  estado text not null default 'activa' check (estado in ('activa', 'contactada', 'asignada', 'cancelada', 'vencida')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lista_espera_fechas_ck check (fecha_hasta is null or fecha_hasta >= fecha_desde),
  constraint lista_espera_horas_ck check (hora_hasta is null or hora_desde is null or hora_hasta > hora_desde),
  constraint lista_espera_dias_ck check (dias_semana <@ array[0,1,2,3,4,5,6]::smallint[] and cardinality(dias_semana) > 0),
  constraint lista_espera_tipo_ck check (tratamiento_id is not null or tipo_tratamiento_id is not null),
  constraint lista_espera_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict
);
create index if not exists lista_espera_estado_prioridad_idx on public.lista_espera (estado, prioridad, created_at);
create index if not exists lista_espera_paciente_idx on public.lista_espera (paciente_id);

create table if not exists public.configuracion_horarios (
  id uuid primary key default extensions.gen_random_uuid(),
  box_id uuid references public.boxes(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_desde time not null,
  hora_hasta time not null,
  capacidad smallint not null default 1 check (capacidad > 0),
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracion_horarios_horas_ck check (hora_hasta > hora_desde),
  constraint configuracion_horarios_vigencia_ck check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde)
);
create index if not exists configuracion_horarios_busqueda_idx on public.configuracion_horarios (box_id, dia_semana, activo, vigencia_desde, vigencia_hasta);
create unique index if not exists configuracion_horarios_clave_natural_uidx
  on public.configuracion_horarios (
    coalesce(box_id, '00000000-0000-0000-0000-000000000000'::uuid),
    dia_semana, hora_desde, hora_hasta, vigencia_desde
  );

create table if not exists public.excepciones_horarias (
  id uuid primary key default extensions.gen_random_uuid(),
  box_id uuid references public.boxes(id) on delete cascade,
  fecha date not null,
  hora_desde time,
  hora_hasta time,
  tipo text not null check (tipo in ('cerrado', 'horario_especial', 'capacidad_especial')),
  capacidad smallint check (capacidad is null or capacidad >= 0),
  motivo text not null check (btrim(motivo) <> ''),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint excepciones_horas_ck check (hora_hasta is null or hora_desde is null or hora_hasta > hora_desde),
  constraint excepciones_tipo_ck check (
    (tipo = 'cerrado')
    or (tipo = 'horario_especial' and hora_desde is not null and hora_hasta is not null)
    or (tipo = 'capacidad_especial' and capacidad is not null)
  )
);
create index if not exists excepciones_horarias_fecha_idx on public.excepciones_horarias (fecha, box_id, activo);

-- Caja, alertas y auditoria -------------------------------------------------

create table if not exists public.cierres_caja (
  id uuid primary key default extensions.gen_random_uuid(),
  fecha_operativa date not null,
  cerrado_por uuid not null references public.profiles(id) on delete restrict,
  cerrado_at timestamptz not null default now(),
  total_ingresos numeric(12,2) not null default 0 check (total_ingresos >= 0),
  total_devoluciones numeric(12,2) not null default 0 check (total_devoluciones >= 0),
  saldo_neto numeric(12,2) generated always as (total_ingresos - total_devoluciones) stored,
  cantidad_pagos integer not null default 0 check (cantidad_pagos >= 0),
  cantidad_devoluciones integer not null default 0 check (cantidad_devoluciones >= 0),
  observaciones text,
  estado text not null default 'cerrado' check (estado in ('cerrado', 'reabierto', 'anulado')),
  reabierto_por uuid references public.profiles(id) on delete restrict,
  reabierto_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cierres_caja_fecha_uk unique (fecha_operativa),
  constraint cierres_caja_reapertura_ck check (
    (estado = 'reabierto' and reabierto_por is not null and reabierto_at is not null)
    or (estado <> 'reabierto' and reabierto_por is null and reabierto_at is null)
  )
);
create index if not exists cierres_caja_estado_idx on public.cierres_caja (estado, fecha_operativa desc);

create table if not exists public.alertas (
  id uuid primary key default extensions.gen_random_uuid(),
  tipo text not null check (btrim(tipo) <> ''),
  titulo text not null check (btrim(titulo) <> ''),
  mensaje text not null check (btrim(mensaje) <> ''),
  severidad text not null default 'info' check (severidad in ('info', 'advertencia', 'critica')),
  paciente_id uuid references public.pacientes(id) on delete restrict,
  tratamiento_id uuid references public.tratamientos(id) on delete restrict,
  turno_id uuid references public.turnos(id) on delete restrict,
  asignada_a uuid references public.profiles(id) on delete set null,
  vence_at timestamptz,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'vista', 'resuelta', 'descartada')),
  resuelta_por uuid references public.profiles(id) on delete set null,
  resuelta_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alertas_resolucion_ck check (
    (estado = 'resuelta' and resuelta_por is not null and resuelta_at is not null)
    or (estado <> 'resuelta' and resuelta_por is null and resuelta_at is null)
  ),
  constraint alertas_tratamiento_contexto_ck check (
    tratamiento_id is null or paciente_id is not null
  ),
  constraint alertas_turno_contexto_ck check (
    turno_id is null or (paciente_id is not null and tratamiento_id is not null)
  ),
  constraint alertas_tratamiento_paciente_fk foreign key (tratamiento_id, paciente_id)
    references public.tratamientos(id, paciente_id) on delete restrict,
  constraint alertas_turno_paciente_tratamiento_fk foreign key (turno_id, paciente_id, tratamiento_id)
    references public.turnos(id, paciente_id, tratamiento_id) on delete restrict
);
create index if not exists alertas_estado_severidad_idx on public.alertas (estado, severidad, created_at desc);
create index if not exists alertas_asignada_idx on public.alertas (asignada_a, estado);
create index if not exists alertas_paciente_idx on public.alertas (paciente_id);

create table if not exists public.auditoria (
  id uuid primary key default extensions.gen_random_uuid(),
  tabla text not null,
  registro_id uuid,
  accion text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id uuid references public.profiles(id) on delete set null,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  campos_modificados text[],
  request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists auditoria_registro_idx on public.auditoria (tabla, registro_id, created_at desc);
create index if not exists auditoria_usuario_idx on public.auditoria (usuario_id, created_at desc);
create index if not exists auditoria_fecha_idx on public.auditoria (created_at desc);

-- Triggers comunes y auditoria ---------------------------------------------

create or replace function public.set_created_by_from_auth()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.created_by := auth.uid();
    else
      new.created_by := old.created_by;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.set_created_by_from_auth() from public;

do $block$
declare
  table_name text;
  actor_tables constant text[] := array[
    'pacientes', 'tratamientos', 'turnos', 'sesiones', 'pagos',
    'pago_aplicaciones', 'devoluciones', 'documentos', 'lista_espera', 'alertas'
  ];
begin
  foreach table_name in array actor_tables loop
    execute format(
      'drop trigger if exists club_del_kine_set_created_by_%I on public.%I',
      table_name, table_name
    );
    execute format(
      'create trigger club_del_kine_set_created_by_%I before insert or update on public.%I for each row execute function public.set_created_by_from_auth()',
      table_name, table_name
    );
  end loop;
end;
$block$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  target_id uuid;
  actor_id uuid;
begin
  old_data := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_data := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  target_id := coalesce((new_data ->> 'id')::uuid, (old_data ->> 'id')::uuid);
  select p.id into actor_id
  from public.profiles p
  where p.id = auth.uid();

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), array[]::text[])
      into changed_fields
    from jsonb_each(old_data) o
    full join jsonb_each(new_data) n using (key)
    where o.value is distinct from n.value;
  end if;

  insert into public.auditoria (
    tabla, registro_id, accion, usuario_id, datos_anteriores,
    datos_nuevos, campos_modificados, request_id
  ) values (
    tg_table_name, target_id, tg_op, actor_id, old_data,
    new_data, changed_fields,
    nullif(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id', '')
  );
  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_row_change() from public;

do $block$
declare
  table_name text;
  tracked_tables constant text[] := array[
    'profiles', 'pacientes', 'obras_sociales', 'requisitos_obra_social',
    'reglas_consumo_sesion', 'boxes', 'tipos_tratamiento', 'tratamientos',
    'turnos', 'sesiones', 'metodos_pago', 'pagos', 'pago_aplicaciones',
    'devoluciones', 'documentos', 'lista_espera', 'configuracion_horarios',
    'excepciones_horarias', 'cierres_caja', 'alertas'
  ];
begin
  foreach table_name in array tracked_tables loop
    execute format('drop trigger if exists club_del_kine_set_updated_at_%I on public.%I', table_name, table_name);
    execute format(
      'create trigger club_del_kine_set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at()',
      table_name, table_name
    );
    execute format('drop trigger if exists club_del_kine_audit_%I on public.%I', table_name, table_name);
    execute format(
      'create trigger club_del_kine_audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      table_name, table_name
    );
  end loop;
end;
$block$;

-- RLS y privilegios ---------------------------------------------------------

do $block$
declare
  table_name text;
  sensitive_tables constant text[] := array[
    'profiles', 'pacientes', 'obras_sociales', 'requisitos_obra_social',
    'reglas_consumo_sesion', 'boxes', 'tipos_tratamiento', 'tratamientos',
    'turnos', 'sesiones', 'metodos_pago', 'pagos', 'pago_aplicaciones',
    'devoluciones', 'documentos', 'lista_espera', 'configuracion_horarios',
    'excepciones_horarias', 'cierres_caja', 'alertas', 'auditoria'
  ];
begin
  foreach table_name in array sensitive_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
  end loop;
end;
$block$;

-- authenticated es un rol tecnico compartido. INSERT/UPDATE se otorgan para
-- que RLS distinga administracion de recepcion; DELETE no se concede en ninguna
-- tabla del dominio para preservar historia.
grant insert, update on table
  public.profiles,
  public.pacientes,
  public.obras_sociales,
  public.requisitos_obra_social,
  public.reglas_consumo_sesion,
  public.boxes,
  public.tipos_tratamiento,
  public.tratamientos,
  public.turnos,
  public.sesiones,
  public.metodos_pago,
  public.pagos,
  public.pago_aplicaciones,
  public.devoluciones,
  public.documentos,
  public.lista_espera,
  public.configuracion_horarios,
  public.excepciones_horarias,
  public.cierres_caja,
  public.alertas
to authenticated;

-- Profiles tiene politicas especificas: cada usuario ve su perfil; solo un
-- administrador gestiona roles y estados.
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.current_user_has_role(array['administrador']));
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.current_user_has_role(array['administrador']));
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.current_user_has_role(array['administrador']))
  with check (public.current_user_has_role(array['administrador']));
-- Administracion puede consultar, crear y actualizar todo el dominio, pero no
-- borrar historia. Las bajas se representan mediante estado/activo/anulacion.
do $block$
declare
  table_name text;
  operational_tables constant text[] := array[
    'pacientes', 'obras_sociales', 'requisitos_obra_social',
    'reglas_consumo_sesion', 'boxes', 'tipos_tratamiento', 'tratamientos',
    'turnos', 'sesiones', 'metodos_pago', 'pagos', 'pago_aplicaciones',
    'devoluciones', 'documentos', 'lista_espera', 'configuracion_horarios',
    'excepciones_horarias', 'cierres_caja', 'alertas'
  ];
begin
  foreach table_name in array operational_tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_has_role(array[''administrador'']))',
      table_name || '_admin_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.current_user_has_role(array[''administrador'']))',
      table_name || '_admin_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.current_user_has_role(array[''administrador''])) with check (public.current_user_has_role(array[''administrador'']))',
      table_name || '_admin_update', table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_has_role(array[''recepcion'']))',
      table_name || '_recepcion_select', table_name
    );
  end loop;
end;
$block$;

-- Operaciones habituales de recepcion. Se excluyen perfiles, catalogos y
-- configuracion sensible, reglas, devoluciones, cierres de caja y auditoria.
do $block$
declare
  table_name text;
  reception_insert_tables constant text[] := array[
    'pacientes', 'tratamientos', 'turnos', 'sesiones', 'pagos',
    'pago_aplicaciones', 'documentos', 'lista_espera', 'alertas'
  ];
  reception_update_tables constant text[] := array[
    'pacientes', 'tratamientos', 'turnos', 'sesiones', 'pagos',
    'documentos', 'lista_espera', 'alertas'
  ];
begin
  foreach table_name in array reception_insert_tables loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.current_user_has_role(array[''recepcion'']))',
      table_name || '_recepcion_insert', table_name
    );
  end loop;
  foreach table_name in array reception_update_tables loop
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.current_user_has_role(array[''recepcion''])) with check (public.current_user_has_role(array[''recepcion'']))',
      table_name || '_recepcion_update', table_name
    );
  end loop;
end;
$block$;

-- La auditoria es de solo lectura para administradores. Sus escrituras se
-- realizan exclusivamente mediante audit_row_change().
create policy auditoria_admin_select on public.auditoria
  for select to authenticated
  using (public.current_user_has_role(array['administrador']));

-- No se otorgan privilegios al rol anon ni se incorporan secretos.
