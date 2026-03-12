import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { assignments, notifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(assignments).set(body).where(eq(assignments.id, id)).returning();

  // Notificar a empleados nuevos (si se modificó la asignación de empleados)
  const employeeIds: string[] = Array.isArray(body.employeeId) ? body.employeeId : [];
  if (employeeIds.length > 0 && body._notifyEmployees) {
    const notifValues = employeeIds.map((empId) => ({
      userId: empId,
      title: 'Tarea modificada',
      message: `Una tarea asignada fue actualizada`,
      type: 'task_modified',
      assignmentId: id,
    }));
    await db.insert(notifications).values(notifValues);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(assignments).where(eq(assignments.id, id));
  return NextResponse.json({ ok: true });
}
