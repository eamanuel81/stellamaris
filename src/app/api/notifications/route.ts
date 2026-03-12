import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employeeId = (session.user as any).employeeId as string | null;
  if (!employeeId) return NextResponse.json([]);

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, employeeId))
    .orderBy(desc(notifications.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const [notif] = await db.insert(notifications).values(body).returning();
  return NextResponse.json(notif, { status: 201 });
}
