import { z } from 'zod';

const ConfigSchema = z.object({
  DATABASE_URL: z.url().optional(),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_HOST: z.string().default('127.0.0.1'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid API configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
