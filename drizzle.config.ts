import type { Config } from 'drizzle-kit';

const schema = process.env.DATABASE_SCHEMA ?? 'guarderia';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/stellamaris',
  },
  schemaFilter: [schema],
} satisfies Config;
