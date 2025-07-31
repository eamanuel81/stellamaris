# Sistema de Notificaciones - Stella Maris Manager

## Descripción

Este sistema de notificaciones permite a los empleados recibir notificaciones automáticas cuando se les asignan nuevas tareas o se modifican las existentes. Los empleados pueden configurar sus preferencias de notificaciones desde la sección de Configuración.

## Características

- ✅ Notificaciones automáticas cuando se asignan tareas
- ✅ Notificaciones cuando se modifican tareas existentes
- ✅ Interfaz de usuario para ver y gestionar notificaciones
- ✅ Configuración de preferencias de notificaciones
- ✅ Contador de notificaciones no leídas
- ✅ Marcado de notificaciones como leídas
- ✅ Eliminación de notificaciones individuales o masivas

## Configuración en Supabase

### 1. Crear tabla de notificaciones

Ejecuta el script SQL `notifications_table.sql` en el SQL Editor de Supabase:

```sql
-- Ver el archivo notifications_table.sql para el script completo
```

### 2. Crear tabla de preferencias de usuario

Ejecuta el script SQL `user_preferences_table.sql` en el SQL Editor de Supabase:

```sql
-- Ver el archivo user_preferences_table.sql para el script completo
```

## Componentes Implementados

### Hooks

1. **`useNotifications`** (`src/hooks/use-notifications.ts`)
   - Maneja todas las operaciones CRUD de notificaciones
   - Gestiona el estado de notificaciones no leídas
   - Funciones para marcar como leídas, eliminar, etc.

2. **`useNotificationPreferences`** (`src/hooks/use-notification-preferences.ts`)
   - Maneja las preferencias de notificaciones del usuario
   - Permite activar/desactivar diferentes tipos de notificaciones

### Componentes

1. **`NotificationsDialog`** (`src/components/notifications-dialog.tsx`)
   - Diálogo modal para mostrar todas las notificaciones
   - Interfaz para marcar como leídas y eliminar notificaciones
   - Contador de notificaciones no leídas

### Integración

1. **Layout** (`src/components/app-layout.tsx`)
   - Integrado el componente de notificaciones en el header
   - Muestra el contador de notificaciones no leídas

2. **Configuración** (`src/app/settings/page.tsx`)
   - Sección para configurar preferencias de notificaciones
   - Opción para limpiar todas las notificaciones

3. **Asignaciones** (`src/hooks/use-assignments.ts`)
   - Creación automática de notificaciones al asignar tareas
   - Notificaciones al modificar asignaciones existentes

## Tipos de Notificaciones

- **`task_assigned`**: Nueva tarea asignada
- **`task_modified`**: Tarea modificada
- **`task_completed`**: Tarea completada
- **`system`**: Notificaciones del sistema

## Flujo de Notificaciones

1. **Asignación de Tarea**:
   - Admin asigna tarea a empleado(s)
   - Sistema crea notificación automáticamente
   - Empleado ve notificación en el icono de campana

2. **Modificación de Tarea**:
   - Admin modifica asignación existente
   - Sistema detecta nuevos empleados agregados
   - Crea notificaciones solo para empleados nuevos

3. **Gestión de Notificaciones**:
   - Empleado puede marcar como leídas
   - Puede eliminar notificaciones individuales
   - Puede limpiar todas las notificaciones

## Configuración de Preferencias

Los usuarios pueden configurar:

- ✅ Activar/desactivar todas las notificaciones
- ✅ Notificaciones de asignación de tareas
- ✅ Notificaciones de modificación de tareas
- ✅ Notificaciones de completado de tareas
- ✅ Notificaciones del sistema

## Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- Los usuarios solo pueden ver sus propias notificaciones
- Los usuarios solo pueden modificar sus propias preferencias
- Políticas de seguridad configuradas para cada operación

## Dependencias

- `date-fns`: Para formateo de fechas en las notificaciones
- Componentes UI existentes de shadcn/ui

## Instalación

1. Ejecutar los scripts SQL en Supabase
2. Instalar dependencias: `npm install date-fns`
3. Los componentes ya están integrados en el layout

## Uso

### Para Empleados:
1. Ver notificaciones: Hacer clic en el icono de campana en el header
2. Configurar preferencias: Ir a Configuración > Notificaciones
3. Marcar como leídas: Hacer clic en el check de cada notificación
4. Eliminar notificaciones: Hacer clic en la X de cada notificación

### Para Administradores:
1. Las notificaciones se crean automáticamente al asignar tareas
2. No se requieren acciones adicionales

## Notas Técnicas

- Las notificaciones se almacenan en la tabla `notifications`
- Las preferencias se almacenan en la tabla `user_preferences`
- El sistema usa UUIDs para los IDs
- Timestamps automáticos para created_at y updated_at
- Índices optimizados para consultas frecuentes

## Mantenimiento

- Las notificaciones antiguas (30+ días) se pueden limpiar automáticamente
- Función `cleanup_old_notifications()` disponible para limpieza manual
- Logs de errores para debugging

## Próximas Mejoras

- [ ] Notificaciones push en tiempo real
- [ ] Notificaciones por email
- [ ] Filtros avanzados de notificaciones
- [ ] Notificaciones de recordatorio
- [ ] Integración con calendario 