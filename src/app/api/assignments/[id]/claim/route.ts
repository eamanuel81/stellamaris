import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { requireSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { assignments, employees, tasks } from '@/lib/schema';

// Un empleado se asigna a sí mismo una tarea que todavía no tiene a nadie asignado.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { employeeId, error } = await requireSession();
  if (error) return error;
  if (!employeeId) {
    return NextResponse.json({ error: 'Tu usuario no está vinculado a un empleado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const [current] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    if (!current) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    if (current.status === 'completed' || current.status === 'cancelled') {
      return NextResponse.json({ error: 'La tarea ya no está disponible' }, { status: 409 });
    }

    // Las tareas que requieren manejar solo las puede tomar quien tiene permiso de manejo
    const [task] = await db.select().from(tasks).where(eq(tasks.id, current.taskId)).limit(1);
    if (task?.requiresDriving) {
      const [emp] = await db.select({ canDrive: employees.canDrive }).from(employees).where(eq(employees.id, employeeId)).limit(1);
      if (!emp?.canDrive) {
        return NextResponse.json({ error: 'Esta tarea requiere permiso para manejar' }, { status: 403 });
      }
    }

    // Update atómico: solo prospera si sigue sin asignar, así dos empleados no se la pisan
    const [updated] = await db
      .update(assignments)
      .set({ employeeId: [employeeId] })
      .where(and(
        eq(assignments.id, id),
        // Sin asignar = lista vacía o sin ningún empleado existente (p. ej. empleado borrado)
        sql`NOT EXISTS (SELECT 1 FROM ${employees} WHERE jsonb_exists(${assignments.employeeId}, ${employees.id}::text))`
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Otro empleado ya tomó esta tarea' }, { status: 409 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[POST /api/assignments/:id/claim]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
