import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './config/env.js';

console.log(`Chon Cinehome Backend starting...`);
console.log(`Environment: ${env.NODE_ENV}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
