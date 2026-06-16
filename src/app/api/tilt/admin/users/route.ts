import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltUsersTable, tiltRegistrationsTable } from '@/src/db/tilt-schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const TILT_JWT_SECRET = new TextEncoder().encode(
    process.env.TILT_JWT_SECRET ?? 'tilt-fallback-secret-change-in-production'
);

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('tilt_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        let payload: { id: number; email: string; name: string; role: string };
        try {
            const { payload: p } = await jwtVerify(token, TILT_JWT_SECRET);
            payload = p as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
        }

        if (payload.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }

        const users = await tiltDb
            .select({
                id: tiltUsersTable.id,
                name: tiltUsersTable.name,
                email: tiltUsersTable.email,
                role: tiltUsersTable.role,
                createdAt: tiltUsersTable.createdAt,
                registrationName: tiltRegistrationsTable.name,
                registrationEmail: tiltRegistrationsTable.email,
                phone: tiltRegistrationsTable.phone,
                address: tiltRegistrationsTable.address,
                submittedAt: tiltRegistrationsTable.submittedAt,
            })
            .from(tiltUsersTable)
            .leftJoin(tiltRegistrationsTable, eq(tiltRegistrationsTable.userId, tiltUsersTable.id))
            .where(eq(tiltUsersTable.role, 'outlet'))
            .orderBy(tiltUsersTable.createdAt);

        return NextResponse.json({ users });
    } catch (err) {
        console.error('[tilt/admin/users]', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
