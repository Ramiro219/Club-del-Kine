# Base de datos

## Estado

Etapa 2 implementada en `supabase/migrations/20260817232455_initial_schema.sql`. La migración es aditiva, no usa `DROP TABLE` y no fue aplicada a ningún proyecto remoto.

## Convenciones

- PostgreSQL 17 de Supabase, nombres `snake_case` y claves foráneas `<entidad>_id`.
- UUID generados con `extensions.gen_random_uuid()` para todas las claves primarias.
- `timestamptz` para instantes, `date` para fechas clínicas y `time` para franjas horarias.
- `numeric(12,2)` para importes. Las cantidades de sesiones admiten fracciones con `numeric(6,2)`.
- `created_at` y `updated_at` en todas las tablas; un trigger mantiene `updated_at`.
- Información histórica conservada mediante estados y anulaciones. Las FKs de negocio usan principalmente `restrict`; no hay borrado en cascada de historia clínica o financiera.
- El DNI se guarda normalizado como texto numérico de 6 a 10 dígitos y es único. No se guarda edad: se deriva de `fecha_nacimiento` al consultar.
- No se almacena `sesiones_restantes`: se calcula como `sesiones_autorizadas` menos la suma de `sesiones.unidades_consumidas` no anuladas.

## Modelo y decisiones

- `turnos`, `sesiones` y `pagos` son entidades independientes. Una sesión puede referir a un turno, pero también registra explícitamente paciente y tratamiento, con una FK compuesta que impide mezclar contextos.
- `pago_aplicaciones` permite distribuir un pago entre tratamientos o sesiones. Triggers con bloqueo de la fila padre impiden mezclar pacientes y hacen que aplicaciones y devoluciones confirmadas compitan por el mismo saldo del pago. También protegen cambios posteriores de importe, identidad y estado. Las futuras operaciones compuestas del frontend deberán envolverse además en funciones RPC.
- Cada devolución es un movimiento en `devoluciones`; el pago original no se modifica ni elimina.
- `reglas_consumo_sesion` define por obra social, estado, vigencia y prioridad si corresponde consumir y cuántas unidades. Una regla con `obra_social_id` nulo actúa como valor general. La elección de regla se implementará en la capa transaccional de la etapa funcional correspondiente.
- `documentos` sólo guarda metadatos y la ruta de Storage, nunca el archivo binario.
- `configuracion_horarios` expresa disponibilidad recurrente y `excepciones_horarias` cierres o cambios puntuales. La capacidad puede ser general (`box_id` nulo) o por box.

## Seguridad

Todas las tablas del dominio tienen RLS habilitado y `anon` no recibe privilegios. Las políticas consultan `profiles` mediante `current_user_has_role()`:

- `administrador`: lectura, alta y actualización de las tablas operativas, administración de perfiles y lectura de auditoría. La API no tiene DELETE sobre tablas del dominio: las bajas usan estados, anulaciones o `activo`.
- `recepcion`: consulta el dominio y registra operaciones habituales de pacientes, tratamientos, agenda, sesiones, pagos, aplicaciones, documentos, espera y alertas. No registra devoluciones o cierres, no administra perfiles, roles, catálogos, reglas ni configuración sensible y no lee auditoría.
- Perfil propio: cada usuario autenticado puede leer su perfil. Los cambios de rol o estado quedan reservados al administrador.

El trigger sobre `auth.users` crea o sincroniza el perfil. La migración también inserta perfiles faltantes para usuarios preexistentes. Todo usuario nuevo o preexistente se sincroniza como `recepcion`: nunca se confía en `raw_user_meta_data` para conceder privilegios. El primer administrador debe asignarse una sola vez desde SQL Editor o una sesión PostgreSQL confiable, después de verificar manualmente su UUID; desde entonces los administradores pueden gestionar roles mediante RLS.

La función de auditoría registra INSERT, UPDATE y DELETE con tabla, UUID, usuario, valores anterior/nuevo, campos cambiados y request id. `auditoria` no concede escritura directa a clientes autenticados.

## Aplicación y revisión local

Antes de aplicar en un entorno real:

1. Revisar completa la migración y el `seed.sql`.
2. Probar en un proyecto local descartable con `supabase db reset` (requiere Docker y no se ejecutó en esta etapa).
3. Inspeccionar tablas, constraints, índices, triggers y políticas en Studio local.
4. Crear dos usuarios ficticios, asignar roles y probar permisos con sus JWT.
5. Verificar operaciones financieras concurrentes mediante futuras RPC antes de habilitarlas en UI.
6. Aplicar al remoto sólo después de aprobación y respaldo, usando el flujo de despliegue acordado.

`supabase/seed.sql` contiene únicamente catálogos ficticios e idempotentes por claves naturales para desarrollo local; resuelve sus FKs por código o nombre, tolera UUID preexistentes, no crea usuarios y no incluye secretos.
