import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { employees, users } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(employees).orderBy(asc(employees.name));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, name, lastName, dni, nickname, phone, address, canDrive, avatarUrl, subrole } = body;

  // Crear empleado
  const [emp] = await db
    .insert(employees)
    .values({ name, lastName, nickname, dni, phone, address, canDrive, email, avatarUrl, subrole })
    .returning();

  // Crear usuario de acceso
  const password = `${name.charAt(0).toUpperCase()}${name.slice(1)}${dni ?? ''}`;
  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .insert(users)
    .values({ email, passwordHash, subrole: subrole ?? 'empleado', employeeId: emp.id })
    .onConflictDoNothing();

  return NextResponse.json(emp, { status: 201 });
}
