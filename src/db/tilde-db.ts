
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as tildeSchema from './tilde-schema';

const connectionString = process.env.TILDE_DATABASE_URL;

if (!connectionString) {
    throw new Error('TILDE_DATABASE_URL is not set');
}

const tildePool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
});

tildePool.on('error', (err) => {
    console.error('Unexpected error on Tilde DB idle client', err);
});

export const tildeDb = drizzle(tildePool, { schema: tildeSchema });