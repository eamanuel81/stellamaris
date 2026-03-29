# Despliegue en Railway — Stella Maris Manager

Pasos para desplegar esta app Next.js en [Railway](https://railway.app).

## 1. Subir el código

- Crea un repositorio en GitHub con el código del proyecto (si aún no está).
- No subas la carpeta `.next` ni `.env` (deben estar en `.gitignore`).

## 2. Crear el proyecto en Railway

1. Entra en [railway.app](https://railway.app) e inicia sesión.
2. **New Project** → **Deploy from GitHub repo**.
3. Conecta tu cuenta de GitHub y elige el repositorio de Stella Maris.
4. Railway detectará automáticamente **Next.js** y usará:
   - **Build:** `npm run build`
   - **Start:** `npm start` (usa la variable `PORT` que Railway asigna).

## 3. Base de datos PostgreSQL en Railway

1. En el mismo proyecto Railway: **New** → **Database** → **PostgreSQL**.
2. Railway creará un Postgres y expondrá la URL en una variable (p. ej. `DATABASE_URL`).
3. En el servicio de tu app, en **Variables**, enlaza la variable del plugin de Postgres o copia la **Connection URL** del servicio Postgres.

Si tu esquema no es `public`, crea el esquema en la base de datos antes de las migraciones:

```sql
CREATE SCHEMA IF NOT EXISTS guarderia;
```

Luego aplica las migraciones de Drizzle (desde tu máquina o con un job en Railway) apuntando a la misma `DATABASE_URL`.

## 4. Variables de entorno obligatorias

En el servicio de la app (no en la base de datos), en **Variables** / **Environment**, añade:

| Variable | Descripción | Ejemplo |
|----------|-------------|--------|
| `DATABASE_URL` | URL de conexión PostgreSQL (Railway la puede inyectar si enlazas el plugin) | `postgresql://user:pass@host:port/railway` |
| `DATABASE_SCHEMA` | Esquema de la base de datos | `guarderia` |
| `NEXTAUTH_SECRET` | Secreto para firmar sesiones (generar uno seguro) | Ver abajo |
| `NEXTAUTH_URL` | URL pública de la app (sin barra final) | `https://tu-app.up.railway.app` |
| `AUTH_SECRET` | (Auth.js v5) Mismo valor que `NEXTAUTH_SECRET` si ves error de configuración en `/api/auth/*` | Igual que arriba |
| `AUTH_URL` | (Auth.js v5) Misma URL que `NEXTAUTH_URL` si hace falta | Igual que arriba |

Si `/api/auth/providers` o `/api/auth/session` responden *"problem with the server configuration"*, falta el secreto o la URL pública: revisá `NEXTAUTH_SECRET` / `AUTH_SECRET` y `NEXTAUTH_URL` / `AUTH_URL` en Railway. El código incluye `trustHost: true` para el proxy de Railway.

### Generar `NEXTAUTH_SECRET`

En tu máquina:

```bash
openssl rand -hex 32
```

O en PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Pega el resultado en `NEXTAUTH_SECRET`.

### Dominio público

1. En el servicio de la app: **Settings** → **Networking** → **Generate domain**.
2. Copia la URL (ej. `https://stella-maris-production.up.railway.app`) y asígnala a **`NEXTAUTH_URL`**.

## 5. Desplegar

- Cada **push** a la rama conectada (p. ej. `main`) dispara un nuevo despliegue.
- O desde el panel: **Deploy** → **Redeploy** para el último commit.

## 6. Comprobar que funciona

1. Abre la URL pública del servicio.
2. Deberías ver la pantalla de login.
3. Si hay errores, revisa **Deployments** → **View logs** del último despliegue.

## Resumen de variables

```
DATABASE_URL=postgresql://...   # Desde el plugin Postgres de Railway
DATABASE_SCHEMA=guarderia
NEXTAUTH_SECRET=<generado con openssl o PowerShell>
NEXTAUTH_URL=https://tu-dominio.up.railway.app
```

No hace falta definir `PORT`; Railway la inyecta automáticamente.
