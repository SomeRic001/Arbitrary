<<<<<<< Updated upstream
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// ── Table for tilt users ───────────────────────────────
=======
import { pgTable, serial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// ── Table for Tilt users ────────────────────────────────────────────────────
>>>>>>> Stashed changes
export const tiltUsersTable = pgTable('tilt_users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false), // ← NEW
    createdAt: timestamp('created_at').defaultNow().notNull(),
    role: varchar('role',{length: 50}).default('outlet'),
});

<<<<<<< Updated upstream
// ── Table for tilt registration ──────────────
=======
// ── Table for Tilt OTP verification ────────────────────────────────────────
// Holds a pending OTP for a (name, email, password) before the user is created.
// Only the most recent OTP per email is valid; older rows are cleaned on insert.
export const tiltOtpTable = pgTable('tilt_otp', {            // ← NEW TABLE
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    // Salted bcrypt hash of the 6-digit OTP (never store plaintext)
    otpHash: text('otp_hash').notNull(),
    // Encrypted pending user data; decoded only on successful verification
    pendingName: varchar('pending_name', { length: 255 }).notNull(),
    pendingPasswordHash: text('pending_password_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Table for Tilt registrations ────────────────────────────────────────────
>>>>>>> Stashed changes
export const tiltRegistrationsTable = pgTable('tilt_registrations', {
    id: serial('id').primaryKey(),
    userId: serial('user_id').notNull().references(() => tiltUsersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: text('address').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});