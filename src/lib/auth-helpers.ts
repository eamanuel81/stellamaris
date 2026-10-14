import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function requireAdmin() {
  const session = await auth();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const subrole = (session.user as { subrole?: string }).subrole;
  if (subrole !== 'admin') {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}

// Sesión válida con su identidad (rol y empleado vinculado). No exige ser admin.
export async function requireSession() {
  const session = await auth();
  if (!session) {
    return { session: null, isAdmin: false, employeeId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const user = session.user as { subrole?: string; employeeId?: string | null };
  return {
    session,
    isAdmin: user.subrole === 'admin',
    employeeId: user.employeeId ?? null,
    error: null,
  };
}
