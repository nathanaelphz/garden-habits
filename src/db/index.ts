import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres.js connects on the first query, not here, so a build without a
// database still works; a missing DATABASE_URL fails loudly at that first query.
const url = process.env.DATABASE_URL;
if (!url && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error("DATABASE_URL is not set (see .env.example)");
}

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? postgres(url ?? "postgres://DATABASE_URL-is-not-set@127.0.0.1:1/missing", { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
