import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { assignments, notifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, employeeId, error } = await requireSession();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Un empleado solo puede cambiar el estado de las tareas que tiene asignadas
    if (!isAdmin) {
      const [current] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
      if (!current) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      const mine = employeeId && Array.isArray(current.employeeId) && current.employeeId.includes(employeeId);
      if (!mine) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
      }
      const [updated] = await db.update(assignments).set({ status: body.status }).where(eq(assignments.id, id)).returning();
      return NextResponse.json(updated);
    }

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
  const { isAdmin, error } = await requireSession();
  if (error) return error;
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
