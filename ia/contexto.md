# Contexto del Proyecto — Stella Maris Manager

## Qué es
App de gestión para una **guardería de lanchas**. Permite asignar tareas a empleados, gestionar clientes, embarcaciones y ver el calendario de trabajo.

## Stack
- **Framework**: Next.js 15 (App Router, Turbopack) en puerto 9002
- **Auth**: NextAuth v5 (credentials + JWT)
- **DB**: PostgreSQL + Drizzle ORM (esquema `guarderia`)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **AI**: Genkit (Google AI) — en `src/ai/`
- **Forms**: react-hook-form + zod
- **Fechas**: date-fns

## Roles de usuario
| Role | Subrole | Acceso |
|------|---------|--------|
| `admin` | `admin` | Todo — dashboard, tareas, empleados, clientes, schedule |
| `employee` | `encargado` | Mis Tareas + Calendario |
| `employee` | `empleado` | Mis Tareas + Calendario |

El rol sale de `users.subrole` (tabla `users`, vinculada a `employees` por `employeeId`) y se guarda en el JWT de NextAuth. `requireAdmin()` (`src/lib/auth-helpers.ts`) protege los endpoints de admin.

## Estructura de carpetas clave
```
src/
  app/              → páginas Next.js (App Router)
    page.tsx        → login
    dashboard/      → admin: resumen
    today-tasks/    → admin: tareas del día
    schedule/       → admin: asignar tareas (vista día/semana)
    tasks/          → admin: tipos de tareas
    employees/      → admin: gestión empleados
    clients/        → admin: gestión clientes
    boats/          → todos: último lavado y última bajada por embarcación (tareas con Tipo = LAVADO / BAJADA)
    my-tasks/       → empleado: sus tareas
    my-calendar/    → empleado: calendario
    settings/       → todos: configuración
  components/       → componentes compartidos
    app-layout.tsx  → sidebar + header (protege rutas)
    auth-provider.tsx → contexto de auth global
    task-dialog.tsx → CRUD de tipos de tareas
    assign-task-dialog.tsx → asignar tarea a empleado
    client-dialog.tsx → CRUD de clientes
    employee-dialog.tsx → CRUD de empleados
  hooks/            → consumen las APIs REST (`/api/*`)
    use-assignments.ts → CRUD de asignaciones
    use-tasks.ts    → CRUD de tipos de tareas
    use-clients.ts  → CRUD de clientes
    use-employees.ts → CRUD de empleados
    use-notifications.ts → notificaciones
    use-notification-preferences.ts → preferencias de notificación
  lib/
    data.ts         → tipos TypeScript (Employee, Task, Assignment, Client, Boat...)
    db.ts           → conexión Postgres + Drizzle
    schema.ts       → tablas Drizzle
    auth-helpers.ts → requireAdmin()
  auth.ts           → config NextAuth
  middleware.ts     → protección de rutas
  app/api/          → API REST (assignments, clients, employees, tasks, notifications, profile)
  ai/               → flows de Genkit (Google AI)
  contexts/
    avatar-context.tsx → contexto global del avatar
```

## Clasificadores de tareas
El campo **Tipo** del tipo de tarea clasifica la actividad: `LAVADO` y `BAJADA` alimentan la pantalla Embarcaciones. Un empleado puede dejar asentada una tarea hecha por su cuenta con *Registrar tarea realizada* (`POST /api/assignments/register`): queda a su nombre, completada y con fecha de hoy.

## Tablas principales (schema `guarderia`, ver `src/lib/schema.ts`)
- `users` — login: email, passwordHash, `subrole`, `employeeId`
- `employees` — datos del empleado
- `clients` — clientes con embarcaciones y responsables
- `tasks` — tipos de tareas (title, duration, requiresDriving, extras)
- `assignments` — asignaciones (taskId, employeeId[], startTime, endTime, status, clientId, boatIds)
- `notifications` y `user_preferences`

## Tipos clave (src/lib/data.ts)
- `Assignment.status`: `'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled'`
- `Assignment.employeeId`: `string[]` (múltiples empleados por asignación)
- `Employee.subrole`: `'empleado' | 'encargado' | 'admin'`

## Comandos de desarrollo
```bash
npm run dev          # inicia en http://localhost:9002
npm run build        # build de producción
npm run typecheck    # tsc sin emit
npm run lint         # eslint
```
