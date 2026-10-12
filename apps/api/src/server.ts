import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const app = buildApp(config);
await app.listen({ port: config.API_PORT, host: config.API_HOST });
console.log(`API listening on http://${config.API_HOST}:${config.API_PORT}`);
