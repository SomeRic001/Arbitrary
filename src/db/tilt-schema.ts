import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// ── Table for tilt users ───────────────────────────────
export const tiltUsersTable = pgTable('tilt_users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    role: varchar('role',{length: 50}).default('outlet'),
});

// ── Table for tilt registration ──────────────
export const tiltRegistrationsTable = pgTable('tilt_registrations', {
    id: serial('id').primaryKey(),
    userId: serial('user_id').notNull().references(() => tiltUsersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: text('address').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});