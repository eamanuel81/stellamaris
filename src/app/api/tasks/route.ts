import { NextResponse } from 'next/server';
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
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const [task] = await db.insert(tasks).values(body).returning();
  return NextResponse.json(task, { status: 201 });
}
