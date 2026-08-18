# Changelog

## Etapa 2 — Base de datos PostgreSQL

### Agregado

- Migración inicial completa para PostgreSQL de Supabase con 21 tablas de dominio.
- UUID, timestamps, claves foráneas, restricciones de integridad e índices.
- Perfiles sincronizados con `auth.users`, incluidos usuarios preexistentes.
- RLS y políticas para los roles `administrador` y `recepcion`.
- Auditoría automática de cambios y bloqueo de escritura directa sobre su historial.
- Estados y anulaciones para conservar datos clínicos y financieros.
- Reglas configurables para el consumo de sesiones.
- Seed local idempotente con catálogos exclusivamente ficticios.
- Documentación del modelo, seguridad y procedimiento de revisión.
- Integridad financiera transaccional frente a cambios del pago padre, aplicaciones y devoluciones.
- Matriz de privilegios mínimos por operación para administración y recepción.
- Seed idempotente por claves naturales, independiente de UUID fijos.

### Seguridad

- Sin claves `service_role`, credenciales ni secretos.
- Sin privilegios para `anon` en tablas del dominio.
- La migración no contiene `DROP TABLE` ni fue aplicada a Supabase remoto.

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
