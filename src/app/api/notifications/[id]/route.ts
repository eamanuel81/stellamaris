import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (id === 'all') {
    // Marcar todas como leídas para el empleado actual
    const employeeId = (session.user as any).employeeId as string | null;
    if (employeeId) {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, employeeId));
    }
    return NextResponse.json({ ok: true });
  }

  const [updated] = await db.update(notifications).set(body).where(eq(notifications.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  if (id === 'all') {
    const employeeId = (session.user as any).employeeId as string | null;
    if (employeeId) {
      await db.delete(notifications).where(eq(notifications.userId, employeeId));
    }
    return NextResponse.json({ ok: true });
  }

  await db.delete(notifications).where(eq(notifications.id, id));
  return NextResponse.json({ ok: true });
}
