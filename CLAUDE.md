# CLAUDE.md — Stella Maris Manager

## Contexto rápido
App Next.js 15 para gestión de guardería de lanchas. Ver `/ia/contexto.md` para arquitectura completa y `/ia/tips.md` para trampas y patrones.

## Stack
- Next.js 15 (App Router) + TypeScript
- Supabase (Auth + Postgres)
- shadcn/ui + Tailwind CSS
- react-hook-form + zod
- Genkit (Google AI) en `src/ai/`

## Puerto de desarrollo
```bash
npm run dev  # http://localhost:9002
```

## Reglas específicas de este proyecto

### Supabase
- Siempre usar el singleton: `import { supabase } from '@/lib/supabaseClient'`
- Para operaciones admin: `getSupabaseAdmin()` del mismo archivo
- No crear instancias nuevas de Supabase

### Auth
- No suscribirse directamente a `supabase.auth.onAuthStateChange` — usar `addAuthListener()` de `use-auth-state.ts`
- El rol se resuelve en `AuthProvider` (`src/components/auth-provider.tsx`)

### Rutas protegidas
- Envolver páginas autenticadas con `<AppLayout>` de `src/components/app-layout.tsx`

### Tipos
- Los tipos centrales están en `src/lib/data.ts`
- `Assignment.employeeId` es `string[]` (múltiples empleados)
- `Employee.subrole`: `'empleado' | 'encargado' | 'admin'`

### Tests
No hay tests configurados aún. Si se piden, sugerir Playwright siguiendo la estructura global.
