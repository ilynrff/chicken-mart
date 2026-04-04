import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

declare global {
  var __chickenMartPool: Pool | undefined;
}

const pool = globalThis.__chickenMartPool ?? new Pool({ connectionString: env.databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalThis.__chickenMartPool = pool;
}

export { pool };
export const db = drizzle(pool, { schema });
export type Database = typeof db;
