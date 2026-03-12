import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, employees } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        let employeeName = email;
        let employeeLastName = '';
        if (user.employeeId) {
          const [emp] = await db
            .select({ name: employees.name, lastName: employees.lastName })
            .from(employees)
            .where(eq(employees.id, user.employeeId))
            .limit(1);
          if (emp) {
            employeeName = emp.name;
            employeeLastName = emp.lastName;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${employeeName} ${employeeLastName}`.trim(),
          subrole: user.subrole,
          employeeId: user.employeeId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.subrole = (user as any).subrole as string;
        token.employeeId = (user as any).employeeId as string | null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).subrole = token.subrole as string;
      (session.user as any).employeeId = token.employeeId as string | null;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
});
