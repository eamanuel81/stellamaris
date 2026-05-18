import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { assignments, notifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    // Extraer campos que no son columnas de la tabla antes de actualizar
    const { _notifyEmployees, id: _id, createdAt: _createdAt, ...updateData } = body;

    const [updated] = await db.update(assignments).set({
      ...updateData,
      startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
      endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
    }).where(eq(assignments.id, id)).returning();

    const employeeIds: string[] = Array.isArray(body.employeeId) ? body.employeeId.filter(Boolean) : [];
    if (employeeIds.length > 0 && _notifyEmployees) {
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
  } catch (err) {
    console.error('[PUT /api/assignments/:id]', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await db.delete(assignments).where(eq(assignments.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/assignments/:id]', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
