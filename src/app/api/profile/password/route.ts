import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!session || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
