# Stella Maris Manager

Sistema de gestión de tareas para guardería de lanchas.

## Stack

- Next.js 15 + TypeScript
- NextAuth (credentials)
- PostgreSQL + Drizzle ORM
- Tailwind + shadcn/ui

## Variables de entorno

Usá `.env.example` como base y creá tu `.env` local.

Variables principales:

- `DATABASE_URL`
- `DATABASE_SCHEMA` (default: `guarderia`)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_SECRET` (mismo valor que `NEXTAUTH_SECRET` en producción)
- `AUTH_URL` (mismo valor que `NEXTAUTH_URL` en producción)

Para desarrollo (seed/tests/capturas):

- `DEV_ADMIN_EMAIL`
- `DEV_ADMIN_PASSWORD`

Para credenciales internas:

- Plantilla versionada: `documentacion/credenciales.ejemplo.html`
- Archivo local no versionado: `documentacion/credenciales.html`

## Instalación local

```bash
npm ci
npm run dev
```

App local: `http://localhost:9002`

## Scripts útiles

- `npm run build`
- `npm run start`
- `npm run typecheck`
- `npm run set-admin-password`

## Despliegue en Railway

El proyecto incluye `nixpacks.toml` para build reproducible:

- Node 20
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm run start`

Ver pasos completos en `DEPLOY-RAILWAY.md`.
