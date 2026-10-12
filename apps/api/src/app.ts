import Fastify from 'fastify';
import postgres from 'postgres';
import type { Config } from './config.ts';

export function buildApp(config: Config) {
  const app = Fastify({ logger: false });
  const sql = config.DATABASE_URL ? postgres(config.DATABASE_URL, { max: 5, connect_timeout: 3 }) : null;

  app.get('/health', async () => {
    let db: 'ok' | 'unavailable' | 'not_configured' = 'not_configured';
    if (sql) {
      try {
        await sql`select 1`;
        db = 'ok';
      } catch {
        db = 'unavailable';
      }
    }
    return { status: 'ok', db };
  });

  app.addHook('onClose', async () => {
    await sql?.end({ timeout: 2 });
  });

  return app;
}
