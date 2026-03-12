import {
  pgSchema,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import type { TaskExtra, Boat, ResponsibleParty } from './data';

const schemaName = process.env.DATABASE_SCHEMA ?? 'guarderia';
export const dbSchema = pgSchema(schemaName);

// ── users (auth) ──────────────────────────────────────────────────────────────
export const users = dbSchema.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  subrole: varchar('subrole', { length: 20 }).notNull().default('empleado'),
  employeeId: uuid('employee_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── employees ─────────────────────────────────────────────────────────────────
export const employees = dbSchema.table('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  dni: varchar('dni', { length: 20 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  canDrive: boolean('can_drive').default(false),
  email: varchar('email', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  subrole: varchar('subrole', { length: 20 }).default('empleado'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── tasks ─────────────────────────────────────────────────────────────────────
export const tasks = dbSchema.table('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  duration: integer('duration').notNull().default(60),
  requiresDriving: boolean('requires_driving').default(false),
  type: varchar('type', { length: 100 }),
  qualifiedEmployeeIds: jsonb('qualified_employee_ids').$type<string[]>(),
  extras: jsonb('extras').$type<TaskExtra[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── assignments ───────────────────────────────────────────────────────────────
export const assignments = dbSchema.table('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull(),
  employeeId: jsonb('employee_id').$type<string[]>().notNull().default([]),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  clientId: uuid('client_id'),
  boatIds: jsonb('boat_ids').$type<string[]>(),
  selectedExtras: jsonb('selected_extras').$type<{ extraId: string; quantity: number }[]>(),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── clients ───────────────────────────────────────────────────────────────────
export const clients = dbSchema.table('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dni: varchar('dni', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  internalNote: text('internal_note'),
  boats: jsonb('boats').$type<Boat[]>().default([]),
  responsibles: jsonb('responsibles').$type<ResponsibleParty[]>().default([]),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── notifications ─────────────────────────────────────────────────────────────
export const notifications = dbSchema.table('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  title: varchar('title', { length: 255 }),
  message: text('message'),
  type: varchar('type', { length: 50 }),
  isRead: boolean('is_read').default(false),
  assignmentId: uuid('assignment_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── user_preferences ──────────────────────────────────────────────────────────
export const userPreferences = dbSchema.table('user_preferences', {
  userId: uuid('user_id').primaryKey(),
  notificationPreferences: jsonb('notification_preferences'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
