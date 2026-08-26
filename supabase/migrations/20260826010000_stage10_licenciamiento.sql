begin;

alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check check (rol in ('administrador','recepcion','desarrollador'));

create table if not exists public.licencias (
  id uuid primary key default extensions.gen_random_uuid(),
  cliente_codigo text not null unique check (btrim(cliente_codigo)<>''),
  cliente_nombre text not null check (btrim(cliente_nombre)<>''),
  inicio_at timestamptz not null,
  vence_at timestamptz not null,
  activa boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint licencias_periodo_ck check (vence_at>inicio_at)
);

create table if not exists public.licencia_renovaciones (
  id uuid primary key default extensions.gen_random_uuid(),
  licencia_id uuid not null references public.licencias(id) on delete restrict,
  renovada_por uuid not null references public.profiles(id) on delete restrict,
  periodo_dias integer not null check (periodo_dias=30),
  vigencia_anterior_at timestamptz not null,
  vigencia_nueva_at timestamptz not null,
  observaciones text,
  created_at timestamptz not null default now()
);
create index if not exists licencia_renovaciones_fecha_idx on public.licencia_renovaciones(created_at desc);

insert into public.licencias(id,cliente_codigo,cliente_nombre,inicio_at,vence_at,observaciones)
values('00000000-0000-0000-0000-000000000100','CLUB-DEL-KINE','Club del Kine',now(),now()+interval '30 days','Licencia inicial')
on conflict(cliente_codigo) do nothing;

alter table public.licencias enable row level security;
alter table public.licencia_renovaciones enable row level security;
revoke all on public.licencias,public.licencia_renovaciones from public,anon,authenticated;
grant select on public.licencias,public.licencia_renovaciones to authenticated;
create policy licencias_desarrollador_select on public.licencias for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.rol='desarrollador')
);
create policy licencia_renovaciones_desarrollador_select on public.licencia_renovaciones for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.rol='desarrollador')
);

create or replace function public.current_user_has_role(roles text[])
returns boolean language sql stable security definer set search_path=pg_catalog,pg_temp as $$
  select exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.activo and p.rol=any(roles)
      and (p.rol='desarrollador' or exists(select 1 from public.licencias l where l.activa and now()>=l.inicio_at and now()<l.vence_at))
  );
$$;
revoke all on function public.current_user_has_role(text[]) from public;
grant execute on function public.current_user_has_role(text[]) to authenticated;

create or replace function public.estado_licencia()
returns jsonb language sql stable security definer set search_path=pg_catalog,pg_temp as $$
  select jsonb_build_object('id',l.id,'cliente_nombre',l.cliente_nombre,'inicio_at',l.inicio_at,'vence_at',l.vence_at,
    'activa',l.activa and now()>=l.inicio_at and now()<l.vence_at,
    'dias_restantes',greatest(0,ceil(extract(epoch from (l.vence_at-now()))/86400)::int),
    'estado',case when not l.activa or now()>=l.vence_at then 'vencida' when l.vence_at-now()<=interval '7 days' then 'por_vencer' else 'vigente' end)
  from public.licencias l order by l.created_at limit 1;
$$;

create or replace function public.renovar_licencia_30_dias(p_observaciones text default null)
returns timestamptz language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare l public.licencias%rowtype; nueva timestamptz;
begin
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.activo and p.rol='desarrollador') then raise exception 'Solo el desarrollador puede renovar licencias'; end if;
  select * into l from public.licencias order by created_at limit 1 for update;
  if not found then raise exception 'No existe una licencia configurada'; end if;
  nueva:=greatest(l.vence_at,now())+interval '30 days';
  update public.licencias set inicio_at=case when l.vence_at<=now() then now() else inicio_at end,vence_at=nueva,activa=true,observaciones=nullif(btrim(p_observaciones),'') where id=l.id;
  insert into public.licencia_renovaciones(licencia_id,renovada_por,periodo_dias,vigencia_anterior_at,vigencia_nueva_at,observaciones)
  values(l.id,auth.uid(),30,l.vence_at,nueva,nullif(btrim(p_observaciones),''));
  return nueva;
end; $$;

create or replace function public.historial_licencia()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,pg_temp as $$
declare resultado jsonb;
begin
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.activo and p.rol='desarrollador') then raise exception 'Solo el desarrollador puede consultar renovaciones'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'created_at',r.created_at,'periodo_dias',r.periodo_dias,'vigencia_anterior_at',r.vigencia_anterior_at,'vigencia_nueva_at',r.vigencia_nueva_at,'observaciones',r.observaciones,'responsable',p.nombre_completo) order by r.created_at desc),'[]'::jsonb) into resultado
  from public.licencia_renovaciones r join public.profiles p on p.id=r.renovada_por;
  return resultado;
end; $$;

create or replace function public.proteger_rol_desarrollador()
returns trigger language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
begin
  if (new.rol='desarrollador' or old.rol='desarrollador') and auth.uid() is not null then raise exception 'El rol desarrollador solo puede administrarse desde una conexion PostgreSQL confiable'; end if;
  return new;
end; $$;
drop trigger if exists club_del_kine_proteger_rol_desarrollador on public.profiles;
create trigger club_del_kine_proteger_rol_desarrollador before update of rol on public.profiles for each row execute function public.proteger_rol_desarrollador();

drop trigger if exists club_del_kine_set_updated_at_licencias on public.licencias;
create trigger club_del_kine_set_updated_at_licencias before update on public.licencias for each row execute function public.set_updated_at();
drop trigger if exists club_del_kine_audit_licencias on public.licencias;
create trigger club_del_kine_audit_licencias after insert or update or delete on public.licencias for each row execute function public.audit_row_change();
drop trigger if exists club_del_kine_audit_licencia_renovaciones on public.licencia_renovaciones;
create trigger club_del_kine_audit_licencia_renovaciones after insert or update or delete on public.licencia_renovaciones for each row execute function public.audit_row_change();

revoke all on function public.estado_licencia() from public;
revoke all on function public.renovar_licencia_30_dias(text) from public;
revoke all on function public.historial_licencia() from public;
grant execute on function public.estado_licencia() to authenticated;
grant execute on function public.renovar_licencia_30_dias(text) to authenticated;
grant execute on function public.historial_licencia() to authenticated;
commit;
