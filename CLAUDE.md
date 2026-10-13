# CLAUDE.md — Stella Maris Manager

## Contexto rápido
App Next.js 15 para gestión de guardería de lanchas. Ver `/ia/contexto.md` para arquitectura completa y `/ia/tips.md` para trampas y patrones.

## Stack
- Next.js 15 (App Router) + TypeScript
- NextAuth v5 (credentials, JWT) — `src/auth.ts`
- PostgreSQL + Drizzle ORM (esquema `guarderia`) — `src/lib/db.ts`, `src/lib/schema.ts`
- shadcn/ui + Tailwind CSS
- react-hook-form + zod
- Genkit (Google AI) en `src/ai/`
- Deploy: Railway (`nixpacks.toml`, ver `DEPLOY-RAILWAY.md`)

## Puerto de desarrollo
```bash
npm run dev  # http://localhost:9002
```

## Comandos de verificación
```bash
npm run typecheck && npm run lint && npm run build
```

## Reglas específicas de este proyecto

### Base de datos
- Usar siempre `import { db } from '@/lib/db'` y las tablas de `@/lib/schema`. No crear conexiones nuevas.
- Las API REST viven en `src/app/api/*`; los hooks de `src/hooks/` las consumen con fetch.

### Auth
- La sesión se obtiene con `auth()` de `@/auth` (servidor) y se expone al cliente vía `AuthProvider` (`src/components/auth-provider.tsx`).
- Para endpoints solo-admin usar `requireAdmin()` de `src/lib/auth-helpers.ts`.
- El rol sale de `users.subrole` (`'admin' | 'encargado' | 'empleado'`) y viaja en el JWT.

### Rutas protegidas
- Envolver páginas autenticadas con `<AppLayout>` de `src/components/app-layout.tsx`.

### Tipos
- Los tipos centrales están en `src/lib/data.ts`.
- `Assignment.employeeId` es `string[]` (múltiples empleados).

### Secretos
- Nunca commitear credenciales. `documentacion/**/credenciales.html` está ignorado; solo se versiona `credenciales.ejemplo.html`.

### Tests
Playwright (`npm run test` no existe aún; ver `playwright.config.ts` y `tests/e2e/`). Requiere `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`.
