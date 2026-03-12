import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Solo disponible en desarrollo
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const adminEmail = 'admin@nauticastellamaris.com.ar';
  const adminPassword = 'UgJ6CgW!c5X#';

  // Verificar si ya existe
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Admin ya existe', id: existing.id });
  }

  // Crear empleado admin
  const [emp] = await db
    .insert(employees)
    .values({
      name: 'Admin',
      lastName: 'Sistema',
      email: adminEmail,
      subrole: 'admin',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    })
    .returning();

  // Crear usuario admin
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [user] = await db
    .insert(users)
    .values({ email: adminEmail, passwordHash, subrole: 'admin', employeeId: emp.id })
    .returning();

  return NextResponse.json({ ok: true, message: 'Admin creado', userId: user.id, employeeId: emp.id });
}
