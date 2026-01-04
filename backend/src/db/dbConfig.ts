import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";

function createProdClient() {
  const env = process.env;
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      "Missing database env vars: TURSO_DATABASE_URL and/or TURSO_AUTH_TOKEN",
    );
  }

  return createClient({ url, authToken });
}

export const dbClient =
  process.env.NODE_ENV === "test" ? createClient({ url: ":memory:" }) : createProdClient();

export const db = drizzle(dbClient);

export function createDb(client: Client): LibSQLDatabase {
  return drizzle(client);
}

export async function runMigrations(database: LibSQLDatabase = db) {
  const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");

  try {
    await migrate(database, {
      migrationsFolder,
      migrationsTable: "__drizzle_migrations",
    });
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

