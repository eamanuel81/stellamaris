/**
 * Actualiza la contraseña (bcrypt) del usuario admin en la base configurada en .env.
 *
 * Uso (desde la raíz del proyecto):
 *   npx tsx scripts/set-admin-password.ts
 *
 * Requiere en .env: DATABASE_URL, DATABASE_SCHEMA (opcional), y para este script:
 *   ADMIN_EMAIL=admin@nauticastellamaris.com.ar
 *   NEW_ADMIN_PASSWORD='tu_nueva_clave'
 *
 * Contra producción: exportá temporalmente DATABASE_URL de Railway (no lo commitees).
 */
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const newPassword = process.env.NEW_ADMIN_PASSWORD;
  if (!email || !newPassword) {
    console.error('Definí ADMIN_EMAIL y NEW_ADMIN_PASSWORD en el entorno o en .env');
    process.exit(1);
  }

  const { db } = await import('../src/lib/db');
  const { users } = await import('../src/lib/schema');
  const { eq } = await import('drizzle-orm');
  const bcrypt = await import('bcryptjs');

  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!row) {
    console.error(`No existe usuario con email: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.email, email));
  console.log(`Contraseña actualizada para ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
