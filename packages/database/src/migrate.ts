import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { connect } from './client.ts';

const { sql, db } = connect();
// Extensions are created outside Drizzle migrations (drizzle-kit does not manage them).
await sql`create extension if not exists postgis`;
await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') });
console.log('Migrations applied.');
await sql.end();
