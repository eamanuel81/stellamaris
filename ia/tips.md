# Tips y Hallazgos — Stella Maris Manager

## Auth y sesión

### Rol
Un solo origen: `users.subrole` (`admin` | `encargado` | `empleado`), incluido en el JWT por los callbacks de `src/auth.ts`. En APIs de admin usar `requireAdmin()`.

### Variables de entorno
`NEXTAUTH_SECRET`/`AUTH_SECRET` y `NEXTAUTH_URL`/`AUTH_URL` deben coincidir en producción. Sin `DATABASE_URL` el build pasa pero la app no puede autenticar.

## Base de datos

### Acceso
Usar `db` de `@/lib/db` con las tablas de `@/lib/schema`. El `search_path` se fija con `DATABASE_SCHEMA` (default `guarderia`).

## UI / Componentes

### AppLayout protege rutas
`AppLayout` redirige a `/` si no hay rol. Todas las páginas autenticadas deben usar `AppLayout` como wrapper.

### Navegación por rol
- Admin ve: Dashboard, Tareas del Día, Asignar Tareas, Tipos de Tareas, Empleados, Clientes
- Empleado ve: Mis Tareas, Calendario
Definido en `app-layout.tsx` con `adminNavItems` y `employeeNavItems`.

### Avatar
El avatar usa dicebear con seed. La seed viene del `avatarKey` en `AvatarContext`. Por defecto es el `user.id`.

## Datos

### Assignment.employeeId es array
A diferencia del tipo original, `employeeId` es `string[]` — una tarea puede tener múltiples empleados. Al hacer queries filtrar con `.contains()` o similar.

### Datos mock en data.ts
`src/lib/data.ts` tiene arrays de ejemplo (`employees`, `tasks`, `assignments`, `clients`). Son datos de prueba/fallback — la app real usa PostgreSQL vía Drizzle.

## Patrones de formularios
- Todos usan `react-hook-form` + `zod` para validación
- Dialogs de CRUD: `task-dialog.tsx`, `client-dialog.tsx`, `employee-dialog.tsx`, `assign-task-dialog.tsx`
- Pattern: abrir con prop `open`, cerrar con `onClose`, pasar `item` para edición o `null` para crear

## AI / Genkit
- Flows en `src/ai/`
- Dev server: `npm run genkit:dev` en paralelo con `npm run dev`
- Proveedor: Google AI (`@genkit-ai/googleai`)
