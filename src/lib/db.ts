import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const dbSchema = process.env.DATABASE_SCHEMA ?? 'guarderia';

const sql = postgres(connectionString, {
  connection: {
    search_path: dbSchema,
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });
