import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-helpers';
import { validatePassword } from '@/lib/password';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { newPassword } = await req.json();

  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'La nueva contraseña es obligatoria' }, { status: 400 });
  }

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.employeeId, id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: 'No existe usuario de acceso para este empleado' }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.employeeId, id));

  return NextResponse.json({ ok: true });
}
