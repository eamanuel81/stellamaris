import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/employees',
  '/tasks',
  '/clients',
  '/schedule',
  '/today-tasks',
  '/my-tasks',
  '/my-calendar',
  '/settings',
  '/help',
];

export default auth((req) => {
  const isProtected = protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r));
  if (isProtected && !req.auth) {
    const loginUrl = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
