begin;

-- Las funciones de trigger no necesitan ser invocables mediante la API.
-- El trigger conserva su funcionamiento aunque EXECUTE esté revocado a los
-- roles cliente.
revoke all on function public.proteger_rol_desarrollador() from public, anon, authenticated;

commit;
