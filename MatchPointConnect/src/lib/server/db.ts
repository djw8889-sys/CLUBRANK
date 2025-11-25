import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

export function getDb() {
  if (globalForDb.db) return globalForDb.db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠️ DATABASE_URL not configured; Drizzle client not initialized");
    return null;
  }

  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({ connectionString: url });
  }

  globalForDb.db = drizzle(globalForDb.pool);
  return globalForDb.db;
}
