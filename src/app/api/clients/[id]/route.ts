import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { clients } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Solo el admin puede crear, modificar o borrar
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(clients).set(body).where(eq(clients.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Solo el admin puede crear, modificar o borrar
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}
