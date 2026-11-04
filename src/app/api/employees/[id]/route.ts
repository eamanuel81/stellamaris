import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { employees, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Solo el admin puede crear, modificar o borrar
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { name, lastName, nickname, dni, phone, address, canDrive, avatarUrl, subrole, email } = body;

  const [previous] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!previous) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });

  const cleanEmail = typeof email === 'string' ? email.trim() : email;

  const [updated] = await db
    .update(employees)
    .set({ name, lastName, nickname, dni, phone, address, canDrive, avatarUrl, subrole, email: cleanEmail })
    .where(eq(employees.id, id))
    .returning();

  // Datos del usuario de acceso que se mantienen alineados con el empleado
  const userChanges: { passwordHash?: string; subrole?: string; email?: string } = {};
  if (subrole) userChanges.subrole = subrole;
  if (cleanEmail && cleanEmail !== previous.email) userChanges.email = cleanEmail;

  // Solo si cambió el nombre o el DNI se reinicia la contraseña (antes se reiniciaba en cualquier edición)
  if (name && dni && (name !== previous.name || dni !== previous.dni)) {
    const newPassword = `${name.charAt(0).toUpperCase()}${name.slice(1)}${dni}`;
    userChanges.passwordHash = await bcrypt.hash(newPassword, 10);
  }
  if (Object.keys(userChanges).length > 0) {
    await db.update(users).set(userChanges).where(eq(users.employeeId, id));
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Solo el admin puede crear, modificar o borrar
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(users).where(eq(users.employeeId, id));
  await db.delete(employees).where(eq(employees.id, id));

  return NextResponse.json({ ok: true });
}
