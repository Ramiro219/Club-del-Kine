# Base de datos

## Estado

Etapa 2 implementada en `supabase/migrations/20260817232455_initial_schema.sql`. La migración inicial fue aplicada correctamente al proyecto remoto de Supabase el **18 de agosto de 2026**. El archivo aplicado queda congelado como registro histórico y no debe editarse después de esta aplicación.

El seed ampliado está preparado en `supabase/seed.sql`, pero todavía debe cargarse de forma controlada y validarse en el proyecto remoto. No fue ejecutado como parte de esta actualización documental.

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

Tablas incluidas: `profiles`, `pacientes`, `obras_sociales`, `requisitos_obra_social`, `reglas_consumo_sesion`, `boxes`, `tipos_tratamiento`, `tratamientos`, `turnos`, `sesiones`, `metodos_pago`, `pagos`, `pago_aplicaciones`, `devoluciones`, `documentos`, `lista_espera`, `configuracion_horarios`, `excepciones_horarias`, `cierres_caja`, `alertas` y `auditoria`.

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

## Estado de validación y limitaciones

### Etapa 3 pendiente de aplicar

La migración incremental `20260823010000_stage3_pacientes_obras_sociales.sql` amplía `pacientes` con patología general y antecedentes, y `obras_sociales` con enlaces web, plantilla del portal del afiliado, sesiones típicas y requisitos generales. El frontend ya está preparado, pero esta migración todavía no se aplicó al proyecto remoto desde este entorno porque Supabase CLI no tenía una sesión autenticada.

Flujo seguro para habilitarla:

1. Ejecutar `npx.cmd supabase login` si la sesión de CLI no está vigente.
2. Confirmar el proyecto con `npx.cmd supabase projects list` y `npx.cmd supabase migration list`.
3. Revisar el SQL incremental y ejecutar `npx.cmd supabase db push`.
4. Regenerar `src/types/database.types.ts` con `npx.cmd supabase gen types typescript --linked --schema public` usando una redirección segura a un archivo temporal y reemplazando el generado solamente si el comando terminó correctamente.
5. Ejecutar `npm.cmd run build` y probar los módulos con usuarios de administrador y recepción.

- La migración figura aplicada en el historial remoto; debe verificarse con `npx supabase migration list` antes de cualquier trabajo posterior.
- El seed contiene únicamente información ficticia e idempotente por claves naturales. Resuelve FKs por DNI, código, nombre, autorización, referencia, fecha o ruta, tolera UUID de catálogo diferentes, no crea usuarios y no incluye secretos.
- El seed completo todavía no fue cargado ni validado en remoto. Su carga deberá hacerse manualmente desde SQL Editor, en una ventana controlada, después de revisar el proyecto y confirmar que no existen datos que puedan confundirse con el prefijo ficticio `SEED-`, DNI `90000001`–`90000020` o códigos `*-DEMO`.
- Sigue pendiente generar y versionar los tipos TypeScript desde el esquema aplicado.
- Siguen pendientes pruebas RLS con usuarios ficticios separados de `administrador` y `recepcion`, incluida la comprobación negativa de devoluciones, cierres, configuración y auditoría.
- Las operaciones compuestas y las pruebas de concurrencia financiera deben validarse antes de habilitar módulos productivos posteriores.
