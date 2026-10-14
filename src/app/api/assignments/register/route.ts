import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { assignments, clients, employees, tasks } from '@/lib/schema';

// Un empleado deja asentada una tarea que ya realizó por su cuenta (p. ej. bajó la lancha y además la limpió).
// Siempre queda a su nombre y como completada, con fecha de hoy.
export async function POST(req: Request) {
  const { employeeId, error } = await requireSession();
  if (error) return error;
  if (!employeeId) {
    return NextResponse.json({ error: 'Tu usuario no está vinculado a un empleado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const boatIds: string[] = Array.isArray(body.boatIds) ? body.boatIds.filter((b: unknown) => typeof b === 'string') : [];
    const note = typeof body.observations === 'string' ? body.observations.trim().slice(0, 1000) : '';
    if (typeof body.taskId !== 'string' || typeof body.clientId !== 'string' || boatIds.length === 0) {
      return NextResponse.json({ error: 'Faltan datos: tarea, cliente y embarcación' }, { status: 400 });
    }

    const [task] = await db.select().from(tasks).where(eq(tasks.id, body.taskId)).limit(1);
    if (!task) return NextResponse.json({ error: 'Tipo de tarea inexistente' }, { status: 404 });

    const [client] = await db.select().from(clients).where(eq(clients.id, body.clientId)).limit(1);
    if (!client) return NextResponse.json({ error: 'Cliente inexistente' }, { status: 404 });
    const clientBoatIds = new Set((client.boats ?? []).map(b => b.id));
    if (!boatIds.every(id => clientBoatIds.has(id))) {
      return NextResponse.json({ error: 'La embarcación no pertenece al cliente' }, { status: 400 });
    }

    if (task.requiresDriving) {
      const [emp] = await db.select({ canDrive: employees.canDrive }).from(employees).where(eq(employees.id, employeeId)).limit(1);
      if (!emp?.canDrive) {
        return NextResponse.json({ error: 'Esta tarea requiere permiso para manejar' }, { status: 403 });
      }
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (task.duration ?? 60) * 60000);
    const [created] = await db.insert(assignments).values({
      taskId: task.id,
      employeeId: [employeeId],
      startTime,
      endTime,
      status: 'completed',
      clientId: client.id,
      boatIds,
      observations: note ? `Registrada por el empleado. ${note}` : 'Registrada por el empleado.',
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/assignments/register]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
