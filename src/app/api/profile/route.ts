import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { employees, userPreferences } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employeeId = (session.user as any).employeeId as string | null;
  if (!employeeId) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, employeeId))
    .limit(1);

  return NextResponse.json({ employee: emp, preferences: prefs?.notificationPreferences ?? null });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employeeId = (session.user as any).employeeId as string | null;
  if (!employeeId) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const body = await req.json();

  if (body.notificationPreferences !== undefined) {
    // Actualizar preferencias
    await db
      .insert(userPreferences)
      .values({ userId: employeeId, notificationPreferences: body.notificationPreferences })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { notificationPreferences: body.notificationPreferences, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  }

  // Actualizar perfil de empleado
  const [updated] = await db.update(employees).set(body).where(eq(employees.id, employeeId)).returning();
  return NextResponse.json(updated);
}
