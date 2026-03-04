# Tips y Hallazgos — Stella Maris Manager

## Auth y sesión

### Patrón de rol doble
El sistema usa DOS fuentes para determinar el rol:
1. `employees.subrole` (por email) → puede ser `admin`, `encargado`, `empleado`
2. `profiles.role` (por user.id) → puede ser `Administrador` o `employee`
Si `subrole === 'admin'` prevalece sobre `profiles.role`.

### Sesión corrupta
Si el token de refresh es inválido (`Invalid Refresh Token`), el `AuthProvider` llama a `clearCorruptedSession()` que limpia localStorage + sessionStorage + signOut de Supabase. La clave de storage es `stellamaris-auth`.

### Listener único de auth
No crear suscripciones directas a `supabase.auth.onAuthStateChange` en componentes. Usar el hook `use-auth-state.ts` que centraliza el listener y expone `addAuthListener()`.

## Supabase

### Singleton
Usar siempre `import { supabase } from '@/lib/supabaseClient'`. No crear instancias nuevas. Si se necesita admin, usar `getSupabaseAdmin()` del mismo archivo.

### Reinicio en dev
`resetSupabaseClients()` existe para limpiar instancias cacheadas en desarrollo con HMR.

## UI / Componentes

### AppLayout protege rutas
`AppLayout` redirige a `/` si no hay rol. Todas las páginas autenticadas deben usar `AppLayout` como wrapper.

### Navegación por rol
- Admin ve: Dashboard, Tareas del Día, Asignar Tareas, Tipos de Tareas, Empleados, Clientes
- Empleado ve: Mis Tareas, Calendario
Definido en `app-layout.tsx` con `adminNavItems` y `employeeNavItems`.

### Avatar
El avatar usa dicebear con seed. La seed viene del `avatarKey` en `AvatarContext`. Por defecto es el `user.id` de Supabase o el `avatar_url` de `profiles`.

## Datos

### Assignment.employeeId es array
A diferencia del tipo original, `employeeId` es `string[]` — una tarea puede tener múltiples empleados. Al hacer queries filtrar con `.contains()` o similar.

### Datos mock en data.ts
`src/lib/data.ts` tiene arrays de ejemplo (`employees`, `tasks`, `assignments`, `clients`). Son datos de prueba/fallback — la app real usa Supabase.

## Patrones de formularios
- Todos usan `react-hook-form` + `zod` para validación
- Dialogs de CRUD: `task-dialog.tsx`, `client-dialog.tsx`, `employee-dialog.tsx`, `assign-task-dialog.tsx`
- Pattern: abrir con prop `open`, cerrar con `onClose`, pasar `item` para edición o `null` para crear

## AI / Genkit
- Flows en `src/ai/`
- Dev server: `npm run genkit:dev` en paralelo con `npm run dev`
- Proveedor: Google AI (`@genkit-ai/googleai`)
