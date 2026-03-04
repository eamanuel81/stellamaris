# Contexto del Proyecto — Stella Maris Manager

## Qué es
App de gestión para una **guardería de lanchas**. Permite asignar tareas a empleados, gestionar clientes, embarcaciones y ver el calendario de trabajo.

## Stack
- **Framework**: Next.js 15 (App Router, Turbopack) en puerto 9002
- **Auth + DB**: Supabase (Auth + Postgres)
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

El rol se determina en `auth-provider.tsx`:
1. Consulta `employees` por email → obtiene `subrole`
2. Consulta `profiles` por `user.id` → obtiene `role` y `avatar_url`
3. Si `subrole === 'admin'` → `role = 'admin'`
4. Si email es `admin@stellamaris.com` o contiene 'admin' → `role = 'admin'`

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
  hooks/            → lógica con Supabase
    use-assignments.ts → CRUD de asignaciones
    use-tasks.ts    → CRUD de tipos de tareas
    use-clients.ts  → CRUD de clientes
    use-employees.ts → CRUD de empleados
    use-notifications.ts → notificaciones
    use-auth-state.ts → listener único de Supabase auth
  lib/
    data.ts         → tipos TypeScript (Employee, Task, Assignment, Client, Boat...)
    supabaseClient.ts → instancia de Supabase (singleton)
    init-supabase.ts → inicialización con reset para dev
  ai/               → flows de Genkit (Google AI)
  contexts/
    avatar-context.tsx → contexto global del avatar
```

## Tablas Supabase principales
- `profiles` — rol (`Administrador`/`employee`) y `avatar_url`
- `employees` — datos del empleado + `subrole` + `auth_id`
- `clients` — clientes con `boats[]` y `responsibles[]`
- `tasks` — tipos de tareas (title, duration, requiresDriving, extras)
- `assignments` — asignaciones (taskId, employeeId[], startTime, endTime, status, clientId, boatIds)

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
