# Club del Kine

Aplicación web de gestión para un centro pequeño de kinesiología y rehabilitación. La Etapa 1 incluye arquitectura frontend, autenticación preparada para Supabase, rutas protegidas, layout responsive y dashboard inicial.

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

Nunca usar `service_role` en el frontend. Si todavía no se configuró Supabase, la pantalla de acceso permite entrar a una demostración local con datos ficticios.

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

La arquitectura completa, modelo inicial y decisiones pendientes están en `ARCHITECTURE.md`. La futura base PostgreSQL se documenta en `DATABASE.md` y sus cambios se realizarán mediante migraciones incrementales.

## Deploy

El frontend es un build Vite estático y podrá publicarse en un plan gratuito compatible. La publicación se realizará recién en la Etapa 12, después de validar seguridad, variables y redirecciones SPA.
