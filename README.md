# Club del Kine

Aplicación web de gestión para un centro pequeño de kinesiología y rehabilitación. Las Etapas 1 y 2 incluyen la arquitectura frontend, autenticación preparada para Supabase, layout responsive, dashboard inicial y el esquema PostgreSQL completo con RLS y auditoría.

## Tecnologías

- React 19, TypeScript estricto y Vite.
- Tailwind CSS 4 y CSS de componentes.
- React Router.
- Supabase Authentication/API como backend principal (conexión preparada).
- Sonner para notificaciones y Lucide para iconografía.

## Requisitos e instalación

1. Instalar Node.js LTS (22 o superior), Git y Visual Studio Code.
2. Crear una cuenta gratuita en GitHub y otra en Supabase.
3. En la carpeta del proyecto ejecutar `npm install`.
4. Copiar `.env.example` como `.env` y completar la URL y la clave pública `anon` de Supabase.
5. Ejecutar `npm run dev` y abrir la URL informada por Vite.

Nunca usar `service_role` en el frontend. La pantalla de acceso mantiene una demostración local con datos ficticios para trabajar sin afectar información remota.

## Comandos

- `npm run dev`: desarrollo local.
- `npm run build`: comprobación TypeScript y build de producción.
- `npm run preview`: vista previa del build.
- `npm run lint`: análisis estático.

## Estructura

```text
src/
  components/       Componentes de UI y layout reutilizables
  contexts/         Estado de sesión
  pages/            Páginas por módulo
  routes/           Rutas públicas y protegidas
  services/         Clientes y acceso a Supabase
  styles/           Sistema visual global
  types/            Tipos del dominio
```

La arquitectura completa, modelo inicial y decisiones pendientes están en `ARCHITECTURE.md`. La base PostgreSQL se documenta en `DATABASE.md` y sus cambios se realizan mediante migraciones incrementales.

## Base de datos

- Migración inicial: `supabase/migrations/20260817232455_initial_schema.sql`.
- Datos ficticios para carga controlada: `supabase/seed.sql`.
- Modelo, seguridad y guía de revisión: `DATABASE.md`.

La migración inicial fue aplicada correctamente al proyecto remoto el 18/08/2026. Crea el esquema de la Etapa 2, sincroniza perfiles con `auth.users`, habilita RLS y registra auditoría. No incluye secretos ni claves `service_role`.

## Etapa 3: pacientes y obras sociales

La interfaz de la Etapa 3 incorpora el padrón paginado de pacientes, alta y edición, ficha individual, datos clínicos iniciales, búsqueda y accesos a WhatsApp y al portal de la obra social. También incorpora el catálogo de obras sociales con requisitos, cantidad habitual de sesiones y enlaces externos.

Antes de utilizar estos módulos contra Supabase remoto se debe aplicar, en este orden, la migración incremental `supabase/migrations/20260823010000_stage3_pacientes_obras_sociales.sql` y regenerar `src/types/database.types.ts`. No se debe editar el archivo de tipos generado manualmente.

## Etapa 4: tratamientos y sesiones

Incluye planes terapéuticos históricos, estadísticas calculadas, registro de asistencias y ausencias, llegada rápida y anulación sin borrado. Para habilitarla se debe aplicar `supabase/migrations/20260823022000_stage4_tratamientos_sesiones.sql` y regenerar los tipos TypeScript.

## Etapa 5: turnos, boxes y calendario

Incluye agenda diaria por box, resúmenes semanal y mensual, gestión de turnos, estados asistenciales y configuración de capacidad y horarios. La migración incremental `20260824000000_stage5_turnos_boxes_calendario.sql` agrega la validación de capacidad concurrente.

## Etapa 6: pagos, devoluciones y caja

Incluye registro y aplicación de pagos, devoluciones con conservación del movimiento original, caja diaria por método y cierre administrativo. La migración `20260824020000_stage6_pagos_devoluciones_caja.sql` encapsula las operaciones críticas en funciones PostgreSQL atómicas.

## Etapa 7: documentación y Storage

Incluye carga privada de PDF, JPG y PNG de hasta 10 MB, asociación con paciente, tratamiento, obra social y requisito, filtros, visualización mediante URL temporal, descarga, revisión y reemplazo con conservación del historial. La migración `20260824030000_stage7_documentacion_storage.sql` crea el bucket privado `documentacion`, sus políticas RLS y la operación atómica de reemplazo.

## Etapa 8: reportes y cierres por obra social

Incluye filtros por período, obra social, box y tratamiento; indicadores de pacientes, sesiones, ausencias, cancelaciones, documentación y recaudación; cierres detallados por obra social; distribución por box y exportación CSV o impresión PDF. Los resultados se derivan de las tablas operativas existentes y no almacenan totales duplicados.

## Etapa 9: alertas, lista de espera y WhatsApp

Incluye sincronización idempotente de alertas operativas, contador en la cabecera, resolución y descarte; lista de espera con prioridades, disponibilidad y estados; y mensajes editables que abren WhatsApp mediante `wa.me`, sin API paga ni envío automático.

## Etapa 10: configuración y licenciamiento

Incluye una licencia única de 30 días validada exclusivamente con el reloj de PostgreSQL, avisos progresivos durante los últimos 7 días y bloqueo operativo al vencer sin borrar ni modificar datos. El rol protegido `desarrollador` queda separado de administración y recepción; sólo ese rol puede renovar por períodos fijos de 30 días y consultar el historial de renovaciones.

La migración `20260826010000_stage10_licenciamiento.sql` debe aplicarse antes de utilizar la interfaz. Para crear el primer desarrollador, primero se crea un usuario normal en Authentication y después, desde SQL Editor y tras verificar su UUID, se asigna `rol='desarrollador'`. La interfaz web no permite conceder ni quitar ese rol. Las comprobaciones no destructivas están en `supabase/tests/stage10_licenciamiento.sql`.

## Etapa 11: pruebas integrales y seguridad

La guía de cierre está en `STAGE11_QA.md`. `npm run check` ejecuta ESLint, TypeScript y el build de producción; `supabase/tests/stage11_security_audit.sql` comprueba RLS, privilegios y funciones privilegiadas sin modificar datos. La aplicación sólo queda lista para desplegar cuando también se completa la matriz manual de los tres roles.

### Flujo de base de datos sin Docker

El flujo utilizado fue remoto y controlado desde Supabase CLI, sin levantar el stack local con Docker:

1. Vincular la carpeta con el proyecto correcto mediante el flujo autenticado de Supabase CLI.
2. Revisar el SQL y el proyecto vinculado antes de aplicar cambios.
3. Consultar `npx supabase migration list` y confirmar que `20260817232455` aparece tanto en Local como en Remote.
4. Generar los tipos del esquema aplicado con `npx supabase gen types typescript --linked --schema public` y guardar la salida en el archivo TypeScript acordado. Esta generación sigue pendiente.
5. Cargar `supabase/seed.sql` únicamente desde SQL Editor, después de una revisión manual y en una ventana controlada. El seed no se ejecuta automáticamente ni crea usuarios de Authentication.
6. Repetir `migration list`, probar ambos roles y revisar auditoría después de la carga.

El seed usa exclusivamente datos ficticios y claves naturales, por lo que puede repetirse sin duplicar su conjunto. Su carga remota y las pruebas RLS siguen pendientes. Nunca usar una clave `service_role` en el frontend, scripts distribuidos o archivos versionados.

## Deploy

El frontend es un build Vite estático y podrá publicarse en un plan gratuito compatible. La publicación se realizará recién en la Etapa 12, después de validar seguridad, variables y redirecciones SPA.
