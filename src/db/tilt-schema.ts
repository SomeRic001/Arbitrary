import { pgTable, serial, varchar, text, timestamp, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';

// ── Table for Tilt users ────────────────────────────────────────────────────
export const tiltUsersTable = pgTable('tilt_users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    role: varchar("role", { length: 50 }).notNull().default('outlet')
});

// ── Table for Tilt registrations ────────────────────────────────────────────
export const tiltRegistrationsTable = pgTable('tilt_registrations', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => tiltUsersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 50 }).notNull().unique(),
    address: text('address').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => [
    uniqueIndex('tilt_registrations_email_idx').on(table.email),
    uniqueIndex('tilt_registrations_phone_idx').on(table.phone),
]);