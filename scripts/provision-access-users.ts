import { config } from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

config({ path: path.resolve(process.cwd(), '.env') });

type ProvisionUser = {
  name: string;
  lastName: string;
  email: string;
  subrole: 'admin' | 'encargado' | 'empleado';
  password: string;
};

const requiredUsers: ProvisionUser[] = [
  {
    name: 'Admin',
    lastName: 'Sistema',
    email: process.env.ADMIN_EMAIL ?? 'admin@nauticastellamaris.com.ar',
    subrole: 'admin',
    password: process.env.ADMIN_PASSWORD ?? '',
  },
  {
    name: 'Encargado',
    lastName: 'General',
    email: process.env.ENCARGADO_EMAIL ?? 'encargado@nauticastellamaris.com.ar',
    subrole: 'encargado',
    password: process.env.ENCARGADO_PASSWORD ?? '',
  },
  {
    name: 'Empleado',
    lastName: 'General',
    email: process.env.EMPLEADO_EMAIL ?? 'empleado@nauticastellamaris.com.ar',
    subrole: 'empleado',
    password: process.env.EMPLEADO_PASSWORD ?? '',
  },
];

async function ensureEmployee(user: ProvisionUser): Promise<string> {
  const { db } = await import('../src/lib/db');
  const { employees } = await import('../src/lib/schema');
  const [existingEmployee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, user.email))
    .limit(1);

  if (existingEmployee) {
    await db
      .update(employees)
      .set({
        name: user.name,
        lastName: user.lastName,
        subrole: user.subrole,
      })
      .where(eq(employees.id, existingEmployee.id));
    return existingEmployee.id;
  }

  const [createdEmployee] = await db
    .insert(employees)
    .values({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      subrole: user.subrole,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
    })
    .returning({ id: employees.id });

  return createdEmployee.id;
}

async function ensureUser(user: ProvisionUser, employeeId: string) {
  const { db } = await import('../src/lib/db');
  const { users } = await import('../src/lib/schema');
  const passwordHash = await bcrypt.hash(user.password, 10);
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1);

  if (existingUser) {
    await db
      .update(users)
      .set({
        passwordHash,
        subrole: user.subrole,
        employeeId,
      })
      .where(eq(users.id, existingUser.id));
    return 'updated';
  }

  await db.insert(users).values({
    email: user.email,
    passwordHash,
    subrole: user.subrole,
    employeeId,
  });
  return 'created';
}

async function main() {
  const missing = requiredUsers
    .filter((u) => !u.password)
    .map((u) => `${u.subrole.toUpperCase()}_PASSWORD`);

  if (missing.length > 0) {
    console.error(`Faltan variables requeridas: ${missing.join(', ')}`);
    process.exit(1);
  }

  for (const user of requiredUsers) {
    const employeeId = await ensureEmployee(user);
    const status = await ensureUser(user, employeeId);
    console.log(`${user.subrole}: ${user.email} (${status})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
