import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import * as schema from '../db/schema/index.js';

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
});
export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
