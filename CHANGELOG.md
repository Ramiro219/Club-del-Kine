# Changelog

## Etapa 3 — Pacientes y Obras Sociales

### En desarrollo

- Listado paginado y búsqueda en tiempo real de pacientes.
- Alta, edición y ficha individual con pestañas preparadas por módulo.
- Cálculo de edad desde la fecha de nacimiento.
- Administración de obras sociales y acceso seguro a sus portales.
- Segunda migración incremental para información clínica inicial y URLs configurables.

## Etapa 2 — Base de datos PostgreSQL

### Aplicado

- Migración `20260817232455_initial_schema.sql` aplicada correctamente al proyecto remoto de Supabase el 18/08/2026.
- Seed ampliado y preparado, todavía sin ejecutar en remoto, con pacientes, tratamientos, agenda, sesiones, pagos, aplicaciones, documentos y configuración ficticios.
- Tipos TypeScript generados desde el esquema remoto y cliente Supabase tipado con `Database`.

### Agregado

- Migración inicial completa para PostgreSQL de Supabase con 21 tablas de dominio.
- UUID, timestamps, claves foráneas, restricciones de integridad e índices.
- Perfiles sincronizados con `auth.users`, incluidos usuarios preexistentes.
- RLS y políticas para los roles `administrador` y `recepcion`.
- Auditoría automática de cambios y bloqueo de escritura directa sobre su historial.
- Estados y anulaciones para conservar datos clínicos y financieros.
- Reglas configurables para el consumo de sesiones.
- Seed idempotente completo con catálogos y operaciones exclusivamente ficticios.
- Documentación del modelo, seguridad y procedimiento de revisión.
- Integridad financiera transaccional frente a cambios del pago padre, aplicaciones y devoluciones.
- Matriz de privilegios mínimos por operación para administración y recepción.
- Seed idempotente por claves naturales, independiente de UUID fijos.

### Seguridad

- Sin claves `service_role`, credenciales ni secretos.
- Sin privilegios para `anon` en tablas del dominio.
- La migración aplicada no contiene `DROP TABLE`.

### Pendiente

- Cargar y validar el seed de forma controlada.
- Ejecutar pruebas RLS positivas y negativas con usuarios ficticios de administración y recepción.
- Validar concurrencia de aplicaciones y devoluciones antes de habilitar los módulos financieros.

## Etapa 1 — Arquitectura y dashboard

### Agregado

- Proyecto React + TypeScript + Vite + Tailwind.
- Cliente Supabase basado exclusivamente en variables de entorno públicas.
- Inicio de sesión, recuperación de contraseña y sesión persistente.
- Acceso demo local con datos totalmente ficticios.
- Protección de rutas, cierre de sesión y roles iniciales.
- Layout ERP responsive con sidebar colapsable y menú móvil.
- Dashboard inicial, accesos rápidos, agenda, ocupación y alertas.
- Documentación de arquitectura, modelo conceptual y decisiones pendientes.

### Base de datos

- Sin cambios. El SQL completo queda reservado para la Etapa 2.
