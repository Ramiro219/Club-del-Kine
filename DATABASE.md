# Base de datos

## Estado

Etapa 1: modelo conceptual aprobado en `ARCHITECTURE.md`. Todavía no se creó ni modificó ninguna tabla de Supabase.

## Convenciones acordadas

- PostgreSQL de Supabase.
- Nombres `snake_case` y claves foráneas `<entidad>_id`.
- UUID como claves primarias.
- `timestamptz` para instantes y `date` para fechas sin hora.
- `numeric(12,2)` para dinero.
- RLS en todas las tablas sensibles.
- Migraciones incrementales en `supabase/migrations/` desde la Etapa 2.
- Borrado lógico o estados para información histórica.
