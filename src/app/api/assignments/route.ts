import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { assignments, notifications } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(assignments).orderBy(desc(assignments.startTime));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const [assignment] = await db.insert(assignments).values({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    }).returning();

    const employeeIds: string[] = Array.isArray(body.employeeId) ? body.employeeId.filter(Boolean) : [];
    if (employeeIds.length > 0) {
      const notifValues = employeeIds.map((empId) => ({
        userId: empId,
        title: 'Nueva tarea asignada',
        message: `Se te asignó una nueva tarea para ${new Date(body.startTime).toLocaleDateString('es-AR')}`,
        type: 'task_assigned',
        assignmentId: assignment.id,
      }));
      await db.insert(notifications).values(notifValues);
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error('[POST /api/assignments]', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
