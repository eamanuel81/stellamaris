# Stella Maris Manager
V  1.0.2

Sistema de gestión de tareas para guardería de lanchas.

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase
```

**Importante:** La `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` es necesaria para crear usuarios automáticamente cuando se agregan nuevos empleados. Esta clave se puede obtener desde el dashboard de Supabase en Settings > API.

### Configuración de la Base de Datos

#### 1. Tabla `employees`

Agrega el campo `auth_id` a la tabla `employees`:

```sql
ALTER TABLE employees 
ADD COLUMN auth_id UUID REFERENCES auth.users(id);
```

#### 2. Tabla `profiles`

Ejecuta el script `setup-profiles-table.sql` en el SQL Editor de Supabase para crear y configurar la tabla `profiles` correctamente.

**Estructura de la tabla `profiles`:**
- `id` (UUID, Primary Key) - Referencia al usuario de Auth
- `name` (TEXT) - Nombre del empleado
- `last_name` (TEXT) - Apellido del empleado
- `full_name` (TEXT) - Apodo o nombre completo
- `email` (TEXT) - Email del empleado
- `role` (TEXT) - Rol del usuario (Empleado, Administrador, etc.)
- `avatar_url` (TEXT) - Clave para generar el avatar del usuario
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Para agregar el campo avatar_url (si no existe):**
Ejecuta el script `add-avatar-to-profiles.sql` en el SQL Editor de Supabase.

### Funcionalidades

- **Autenticación:** Login seguro para administradores y empleados
- **Gestión de Tareas:** Crear, editar y eliminar tareas con detalles como título, descripción, habilidades requeridas y duración estimada
- **Asignación de Tareas:** Asignar tareas a empleados con interfaz de calendario configurable
- **Vista de Empleados:** Los empleados pueden ver sus tareas asignadas y actualizar el estado
- **Directorio de Usuarios:** Directorio buscable por nombre, DNI, apodo, etc.
- **Creación Automática de Usuarios:** Al agregar un nuevo empleado, se crea automáticamente un usuario en Supabase Auth con:
  - Email del empleado
  - Contraseña generada: `Nombre + DNI` (ej: "Juan12345678")
  - Perfil en la tabla `profiles` con rol "Empleado"

## Instalación

```bash
npm install
npm run dev
```

## Uso

1. Inicia sesión con las credenciales de administrador
2. Navega a "Empleados" para gestionar el personal
3. Al agregar un nuevo empleado, se creará automáticamente su cuenta de usuario
4. El empleado podrá iniciar sesión con su email y la contraseña generada

## Solución de Problemas

### Error al crear perfil

Si encuentras el error "Error creando perfil", verifica:

1. Que la tabla `profiles` existe y tiene la estructura correcta
2. Que las políticas de seguridad (RLS) están configuradas correctamente
3. Que tienes la clave de servicio configurada en las variables de entorno
4. Revisa la consola del navegador para más detalles del error

### No puedo iniciar sesión con el usuario administrador

Si no puedes iniciar sesión con tu usuario administrador después de configurar la tabla `profiles`, es porque el usuario administrador existente no tiene un perfil en la tabla `profiles`.

**Solución:**

1. Ejecuta el script `create-admin-profile.sql` en el SQL Editor de Supabase
2. Reemplaza `'admin@stellamaris.com'` con el email de tu administrador
3. El script creará automáticamente un perfil para el usuario administrador

**Alternativa temporal:**
El sistema ahora detecta automáticamente usuarios administradores por email (que contengan "admin"), por lo que deberías poder iniciar sesión incluso sin crear el perfil manualmente.

### Error de recursión infinita en políticas (RLS)

Si ves el error `infinite recursion detected in policy for relation "profiles"`, las políticas de seguridad están mal configuradas.

**Solución:**

1. Ejecuta el script `fix-profiles-policies.sql` en el SQL Editor de Supabase
2. Este script eliminará las políticas problemáticas y creará nuevas políticas correctas
3. Reinicia la aplicación después de ejecutar el script

**Nota:** El sistema ahora detecta automáticamente administradores por subrole en la tabla `employees`, por lo que deberías poder iniciar sesión incluso con problemas en las políticas de `profiles`.

### Verificar configuración

Para verificar que todo está configurado correctamente:

1. **Verificar tabla profiles:**
```sql
SELECT * FROM public.profiles LIMIT 5;
```

2. **Verificar usuario administrador:**
```sql
SELECT id, email FROM auth.users WHERE email = 'tu_email_admin@ejemplo.com';
```

3. **Verificar políticas RLS:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```
