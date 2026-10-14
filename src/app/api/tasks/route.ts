import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  // Solo el admin puede crear, modificar o borrar
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const [task] = await db.insert(tasks).values(body).returning();
  return NextResponse.json(task, { status: 201 });
}
