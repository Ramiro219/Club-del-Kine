begin;
create or replace function public.preservar_alerta_vista_en_sincronizacion()
returns trigger language plpgsql set search_path=pg_catalog,pg_temp as $$
begin
  if old.estado='vista' and new.estado in ('pendiente','descartada')
     and coalesce(current_setting('club_del_kine.cambio_alerta_manual',true),'')<>'true' then new.estado:='vista'; end if;
  return new;
end; $$;
revoke all on function public.preservar_alerta_vista_en_sincronizacion() from public;
drop trigger if exists club_del_kine_preservar_alerta_vista on public.alertas;
create trigger club_del_kine_preservar_alerta_vista before update of estado on public.alertas
for each row execute function public.preservar_alerta_vista_en_sincronizacion();

create or replace function public.cambiar_estado_alerta(p_alerta_id uuid,p_estado text)
returns void language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
begin
  if not public.current_user_has_role(array['administrador','recepcion']) then raise exception 'Usuario no autorizado'; end if;
  if p_estado not in ('vista','resuelta','descartada') then raise exception 'Estado invalido'; end if;
  perform set_config('club_del_kine.cambio_alerta_manual','true',true);
  update public.alertas set estado=p_estado,resuelta_por=case when p_estado='resuelta' then auth.uid() else null end,resuelta_at=case when p_estado='resuelta' then now() else null end where id=p_alerta_id;
end; $$;
revoke all on function public.cambiar_estado_alerta(uuid,text) from public;
grant execute on function public.cambiar_estado_alerta(uuid,text) to authenticated;
commit;
