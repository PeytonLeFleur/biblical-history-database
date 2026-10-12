import { describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

describe('api', () => {
  it('reports health without a database configured', async () => {
    const app = buildApp(loadConfig({}));
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', db: 'not_configured' });
    await app.close();
  });

  it('rejects invalid configuration', () => {
    expect(() => loadConfig({ API_PORT: 'abc' })).toThrow(/Invalid API configuration/);
  });
});
