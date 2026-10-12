import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.ts';

export const DEFAULT_DATABASE_URL = 'postgres://atlas:atlas@localhost:5433/atlas';

export function connect(url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  const sql = postgres(url, { max: 5, onnotice: () => {} });
  return { sql, db: drizzle(sql, { schema }) };
}
