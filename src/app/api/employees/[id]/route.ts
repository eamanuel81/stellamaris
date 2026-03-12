import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { employees, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, lastName, nickname, dni, phone, address, canDrive, avatarUrl, subrole, email } = body;

  const [updated] = await db
    .update(employees)
    .set({ name, lastName, nickname, dni, phone, address, canDrive, avatarUrl, subrole, email })
    .where(eq(employees.id, id))
    .returning();

  // Si cambia nombre o DNI, resetear contraseña
  if (name && dni) {
    const newPassword = `${name.charAt(0).toUpperCase()}${name.slice(1)}${dni}`;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash, subrole: subrole ?? 'empleado' }).where(eq(users.employeeId, id));
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(users).where(eq(users.employeeId, id));
  await db.delete(employees).where(eq(employees.id, id));

  return NextResponse.json({ ok: true });
}
