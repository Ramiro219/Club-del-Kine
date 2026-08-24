begin;

alter table public.pacientes
  add column if not exists patologia_general text,
  add column if not exists antecedentes text;

alter table public.obras_sociales
  add column if not exists sitio_web text,
  add column if not exists portal_url text,
  add column if not exists portal_paciente_url_template text,
  add column if not exists sesiones_tipicas integer,
  add column if not exists requisitos_generales text;

alter table public.obras_sociales
  drop constraint if exists club_del_kine_obras_sociales_sesiones_tipicas_ck;

alter table public.obras_sociales
  add constraint club_del_kine_obras_sociales_sesiones_tipicas_ck
  check (sesiones_tipicas is null or sesiones_tipicas > 0);

commit;
