import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton pattern — do not create a new postgres() client per request.
// `prepare: false` is required for Supabase Transaction pooler compatibility.
// DATABASE_URL is required at runtime but NOT at build time (Next.js collects
// page data during build, which imports this module). The non-null assertion
// is safe because postgres() defers the actual connection until a query runs.
const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

const connection =
  globalForDb.connection ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.connection = connection;
}

export const db = drizzle(connection, { schema });
