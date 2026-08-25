# Changelog

## Etapa 9 - Alertas, lista de espera y WhatsApp

### Agregado

- Alertas por sesiones bajas, tratamientos vencidos, documentación y pagos pendientes, turnos próximos, capacidad y espera activa.
- Sincronización idempotente y contador real en la campana superior.
- Acciones para marcar vistas, resolver o descartar alertas.
- Lista de espera con prioridad, fechas, horarios, días, box y estados.
- Confirmación manual antes de marcar una solicitud como asignada.
- Plantillas editables para WhatsApp mediante enlaces gratuitos `wa.me`.
- Migración `20260824040000_stage9_alertas_espera_whatsapp.sql`.

## Etapa 8 - Reportes y cierres por obra social

### Agregado

- Reportes de pacientes, sesiones, ausencias, cancelaciones, pagos, devoluciones y recaudación.
- Conteos por box y obra social con visualización compacta.
- Cierre por obra social con documentación completa o pendiente por paciente.
- Filtros por período, cobertura, box y tipo de tratamiento.
- Exportación CSV compatible con Excel e impresión preparada para guardar como PDF.
- Cálculos derivados sin tablas ni columnas duplicadas.

## Etapa 7 - Documentación y Storage

### Agregado

- Módulo documental general y pestaña integrada en la ficha del paciente.
- Carga privada de PDF, JPG y PNG con validación de tipo y máximo de 10 MB.
- Asociación con paciente, tratamiento, obra social y requisito documental.
- Visualización temporal, descarga, filtros, revisión y estados documentales.
- Reemplazo con confirmación, conservación del archivo anterior y metadata auditable.
- Bucket privado y políticas RLS para administración y recepción.
- Migración `20260824030000_stage7_documentacion_storage.sql`.

## Etapa 6 — Pagos, devoluciones y caja

### En desarrollo

- Registro atómico de pagos totales, parciales y aplicados a una o varias sesiones.
- Historial financiero por paciente y caja diaria.
- Devoluciones independientes vinculadas al pago original y con confirmación.
- Totales por método de pago, ingresos, devoluciones y saldo neto.
- Cierre diario restringido a administración.

## Etapa 5 — Turnos, boxes y calendario

### En desarrollo

- Calendario profesional con vistas día, semana y mes; día como vista principal.
- Grilla por horarios y boxes con disponibilidad y estados visuales.
- Alta, edición, llegada, atención y cancelación de turnos con historial.
- Configuración de boxes, capacidad y horarios de mañana/tarde.
- Validación transaccional para impedir reservas por encima de la capacidad.

## Etapa 4 — Tratamientos y sesiones

### En desarrollo

- Gestión de tratamientos con historial, estados, cobertura, autorización y box sugerido.
- Estadísticas calculadas de sesiones autorizadas, realizadas, ausencias, consumidas y restantes.
- Registro de sesiones, llegada rápida, anulaciones auditables y estado de pago visible.
- Integración dentro de la ficha individual del paciente.
- Consumo automático conforme a las reglas vigentes de cada obra social.

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
