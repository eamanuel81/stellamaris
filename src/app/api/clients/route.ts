import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { clients } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(clients).orderBy(asc(clients.lastName));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Verificar email duplicado
  if (body.email) {
    const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.email, body.email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese email' }, { status: 409 });
    }
  }

  const [client] = await db.insert(clients).values(body).returning();
  return NextResponse.json(client, { status: 201 });
}
