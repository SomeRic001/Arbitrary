
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as tiltSchema from './tilt-schema';

const connectionString = process.env.TILT_DATABASE_URL;

if (!connectionString) {
    throw new Error('TILT_DATABASE_URL is not set');
}

const tiltPool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
});

tiltPool.on('error', (err) => {
    console.error('Unexpected error on tilt DB idle client', err);
});

export const tiltDb = drizzle(tiltPool, { schema: tiltSchema });