# Arquitectura propuesta

## Enfoque

Monolito frontend modular para la escala real del centro: React consume directamente la API, Authentication y Storage de Supabase. No se agrega un backend Node independiente. Las operaciones críticas se implementarán mediante funciones PostgreSQL/RPC transaccionales y RLS, evitando confiar en el navegador.

Capas:

1. **Presentación:** páginas, layout ERP y componentes reutilizables.
2. **Aplicación:** hooks y contextos para sesión, filtros y casos de uso.
3. **Datos:** servicios tipados por módulo que encapsulan Supabase.
4. **Seguridad:** RLS, constraints, funciones PostgreSQL y auditoría.

La zona horaria operativa será `America/Argentina/Buenos_Aires`. Los instantes se guardarán como `timestamptz`; fechas clínicas puras como `date`; la interfaz mostrará `DD/MM/YYYY` y `HH:mm`.

## Modelo de datos inicial

Entidades principales y relaciones previstas:

- `auth.users` 1—1 `profiles` (rol y estado).
- `pacientes` N—1 `obras_sociales` para cobertura actual, conservando la cobertura aplicada en cada tratamiento.
- `pacientes` 1—N `tratamientos`.
- `tratamientos` N—1 `obras_sociales` y N—1 `boxes` como sugerencia opcional.
- `turnos` N—1 `pacientes`, `tratamientos` y `boxes`.
- `sesiones` N—1 `turnos` y `tratamientos`; turno, sesión y pago permanecen separados.
- `pagos` N—1 `pacientes` y opcionalmente `tratamientos`.
- `pago_aplicaciones` vinculará pagos con sesiones/tratamientos para soportar pagos parciales o múltiples.
- `devoluciones` N—1 `pagos`, sin borrar el movimiento original.
- `documentos` N—1 `pacientes`, con vínculos opcionales a tratamiento y obra social; el archivo vive en Storage.
- `requisitos_obra_social` N—1 `obras_sociales`.
- `reglas_consumo_sesion` N—1 `obras_sociales`, configurables por estado.
- `lista_espera` N—1 `pacientes` y opcionalmente `boxes`.
- `configuracion_horarios`, `excepciones_horarias` y `boxes` determinan capacidad.
- `cierres_caja`, `alertas` y `auditoria` conservan historia y usuario responsable.

Todos los identificadores serán UUID. Los importes usarán `numeric(12,2)`. Habrá `created_at`, `updated_at`, índices para búsquedas y restricciones de integridad. La Etapa 2 entregará el SQL ejecutable; este documento no anticipa una migración incompleta.

## Contradicciones y decisiones pendientes

- La cobertura actual del paciente puede cambiar. Se propone guardar la cobertura vigente en el paciente por rapidez y copiar la referencia histórica al tratamiento; no se duplican datos descriptivos.
- Los estados de turno aparecen con dos vocabularios en la especificación (`reservado/programado/confirmado`, `llegó/asistió/atendido`). Antes de la Etapa 5 se fijará un enum canónico y un mapeo visual.
- Falta definir si un box admite varios pacientes simultáneos con un único profesional o por recurso. La capacidad quedará configurable por franja, sin codificar el ejemplo como regla.
- El consumo de sesión ante ausencias/cancelaciones varía por obra social. Se modelará como configuración; no se asume ninguna regla irreversible.
- Se deberá acordar tamaño máximo de documentos, política de retención y quién puede reemplazarlos antes de la Etapa 7.
- Se deberá definir política de devoluciones y permisos por rol antes de la Etapa 6.
- “Fecha de alta” puede significar ingreso del paciente o alta clínica. Se propone llamar `fecha_registro` al ingreso y reservar el alta clínica para cada tratamiento.
- Los planes gratuitos alcanzan para desarrollo y pruebas, pero límites y condiciones comerciales cambian; antes del deploy se verificarán cuotas vigentes de Supabase y del hosting elegido.

## Etapas y límites

La navegación anticipa módulos futuros, pero las páginas no implementadas muestran un estado explícito de próxima etapa. Esto evita mezclar lógica o tablas antes de aprobar el modelo y las reglas del negocio.
