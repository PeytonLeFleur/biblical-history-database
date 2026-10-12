import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

// Requires the migrated, seeded and research-imported dev database.
const app = buildApp(loadConfig({ DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://atlas:atlas@localhost:5433/atlas' }));
afterAll(() => app.close());

describe('read-only API', () => {
  it('reports health with the database', async () => {
    expect((await app.inject('/health')).json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('reports research status', async () => {
    const r = (await app.inject('/research/status')).json();
    expect(r.coverage.verses).toBe(31102);
  });

  it('lists only published, non-fixture events', async () => {
    const events = (await app.inject('/events')).json() as Array<{ publication_level: string }>;
    for (const e of events) expect(e.publication_level).not.toBe('unpublished');
  });

  it('returns 404 / 400 for unknown records', async () => {
    expect((await app.inject('/events/evt_missing')).statusCode).toBe(404);
    expect((await app.inject('/entities/xyz_1')).statusCode).toBe(400);
    expect((await app.inject('/sources/src_missing')).statusCode).toBe(404);
  });
});
