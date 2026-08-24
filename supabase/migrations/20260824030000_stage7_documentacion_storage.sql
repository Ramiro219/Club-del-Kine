begin;

alter table public.documentos drop constraint if exists documentos_estado_check;
alter table public.documentos add constraint documentos_estado_check
  check (estado in ('pendiente','vigente','observado','vencido','reemplazado','archivado'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentacion', 'documentacion', false, 10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.validate_documento_storage()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.storage_bucket <> 'documentacion' then
    raise exception 'Bucket de documentacion invalido';
  end if;
  if new.mime_type not in ('application/pdf','image/jpeg','image/png') then
    raise exception 'Tipo de archivo no permitido';
  end if;
  if new.tamanio_bytes is null or new.tamanio_bytes <= 0 or new.tamanio_bytes > 10485760 then
    raise exception 'El archivo supera el limite permitido';
  end if;
  if split_part(new.storage_path, '/', 1) <> new.paciente_id::text then
    raise exception 'La ruta del archivo no pertenece al paciente';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_documento_storage() from public;
drop trigger if exists club_del_kine_validate_documento_storage on public.documentos;
create trigger club_del_kine_validate_documento_storage
before insert or update of storage_bucket, storage_path, mime_type, tamanio_bytes, paciente_id
on public.documentos for each row execute function public.validate_documento_storage();

drop policy if exists club_documentacion_select on storage.objects;
create policy club_documentacion_select on storage.objects
for select to authenticated
using (
  bucket_id = 'documentacion'
  and public.current_user_has_role(array['administrador','recepcion'])
);

drop policy if exists club_documentacion_insert on storage.objects;
create policy club_documentacion_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'documentacion'
  and public.current_user_has_role(array['administrador','recepcion'])
);

drop policy if exists club_documentacion_update on storage.objects;
create policy club_documentacion_update on storage.objects
for update to authenticated
using (
  bucket_id = 'documentacion'
  and public.current_user_has_role(array['administrador','recepcion'])
)
with check (
  bucket_id = 'documentacion'
  and public.current_user_has_role(array['administrador','recepcion'])
);

-- DELETE solo se usa para limpiar un archivo si falla el registro de metadata.
-- La interfaz nunca elimina documentacion ya registrada.
drop policy if exists club_documentacion_delete on storage.objects;
create policy club_documentacion_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'documentacion'
  and public.current_user_has_role(array['administrador','recepcion'])
);

create or replace function public.reemplazar_documento_atomico(
  p_documento_id uuid,
  p_nombre text,
  p_storage_path text,
  p_mime_type text,
  p_tamanio_bytes bigint
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  anterior public.documentos%rowtype;
  nuevo_id uuid;
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then
    raise exception 'Usuario no autorizado';
  end if;
  if p_mime_type not in ('application/pdf','image/jpeg','image/png') then
    raise exception 'Tipo de archivo no permitido';
  end if;
  if p_tamanio_bytes <= 0 or p_tamanio_bytes > 10485760 then
    raise exception 'El archivo supera el limite permitido';
  end if;

  select * into anterior from public.documentos
  where id = p_documento_id and estado <> 'reemplazado'
  for update;
  if not found then raise exception 'El documento no existe o ya fue reemplazado'; end if;

  insert into public.documentos (
    paciente_id, tratamiento_id, obra_social_id, requisito_obra_social_id,
    nombre, tipo_documento, storage_bucket, storage_path, mime_type,
    tamanio_bytes, fecha_vencimiento, estado
  ) values (
    anterior.paciente_id, anterior.tratamiento_id, anterior.obra_social_id,
    anterior.requisito_obra_social_id, p_nombre, anterior.tipo_documento,
    'documentacion', p_storage_path, p_mime_type, p_tamanio_bytes,
    anterior.fecha_vencimiento, 'pendiente'
  ) returning id into nuevo_id;

  update public.documentos
  set estado = 'reemplazado', reemplazado_por_id = nuevo_id
  where id = anterior.id;
  return nuevo_id;
end;
$$;

revoke all on function public.reemplazar_documento_atomico(uuid,text,text,text,bigint) from public;
grant execute on function public.reemplazar_documento_atomico(uuid,text,text,text,bigint) to authenticated;

commit;
