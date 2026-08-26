# Etapa 11 — Pruebas integrales y seguridad

Esta etapa no publica la aplicación ni modifica datos productivos. Su objetivo es cerrar la calidad técnica antes del despliegue de la Etapa 12.

## 1. Controles automáticos locales

Ejecutar desde la raíz del proyecto:

```powershell
npm.cmd run check
```

El comando debe finalizar sin errores de ESLint, TypeScript ni Vite. Las advertencias de tamaño de chunks no invalidan el resultado, pero quedan como mejora de rendimiento para el despliegue.

## 2. Auditoría de Supabase

1. Aplicar la migración de endurecimiento `20260826020000_stage11_endurecer_funcion_rol.sql` y confirmar con `npx.cmd supabase migration list` que todas las migraciones aparecen en Local y Remote.
2. Ejecutar `supabase/tests/stage10_licenciamiento.sql` en SQL Editor.
3. Ejecutar `supabase/tests/stage11_security_audit.sql` en SQL Editor.
4. Confirmar que el último resultado sea `AUDITORÍA ESTRUCTURAL SUPERADA`.
5. Revisar Authentication y mantener usuarios separados para `administrador`, `recepcion` y `desarrollador`.

## 3. Matriz funcional manual

### Recepción

- Inicia y cierra sesión.
- Consulta, crea y edita pacientes, tratamientos, sesiones, turnos, pagos, documentos y lista de espera.
- No puede registrar devoluciones, cerrar caja, cambiar roles, consultar auditoría ni renovar licencias.

### Administración

- Realiza las operaciones de recepción.
- Registra devoluciones y cierres de caja.
- Administra catálogos y perfiles operativos.
- No puede conceder el rol `desarrollador` ni renovar licencias.

### Desarrollador

- Es redirigido exclusivamente a `/licencia`.
- Consulta estado e historial y renueva exactamente 30 días.
- No accede a pacientes, caja, documentación ni otros módulos operativos.

### Vencimiento y continuidad

- La hora del dispositivo no cambia el estado de la licencia.
- Una licencia vencida restringe administración y recepción.
- Los datos permanecen en las tablas y vuelven a estar disponibles al renovar.
- Si Supabase no puede validar la licencia, el acceso operativo permanece restringido.

## 4. Regresión por módulos

- Pacientes y obras sociales: búsqueda, alta, edición y ficha.
- Tratamientos y sesiones: realizadas, ausentes, anuladas y sesiones restantes.
- Turnos: capacidad por box, cambio de estado y cancelación.
- Caja: pago, aplicación, devolución y cierre.
- Documentación: carga, vista, descarga, revisión y reemplazo.
- Reportes: filtros, cifras, CSV e impresión/PDF.
- Alertas: marcar vista, resolver y sincronizar sin reaparecer indebidamente.
- WhatsApp: número normalizado, texto editable y apertura segura.
- Celular: menú, tablas desplazables, formularios y modales.

## 5. Condición de cierre

La Etapa 11 queda aprobada únicamente cuando `npm run check`, ambas auditorías SQL y la matriz de tres roles finalizan correctamente. Recién entonces se continúa con variables de producción, URL pública, redirecciones y despliegue de la Etapa 12.
