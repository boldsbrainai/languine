import { neon } from "@neondatabase/serverless";
import { type NeonHttpDatabase, drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { type NodePgDatabase, drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Schema = typeof schema;
type Db = NeonHttpDatabase<Schema> | NodePgDatabase<Schema>;

let _db: Db | null = null;
let _pool: Pool | null = null;

function isNeonDatabaseUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes("neon.tech");
  } catch {
    return false;
  }
}

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set a Postgres-compatible connection string and restart the app.",
    );
  }

  if (isNeonDatabaseUrl(url)) {
    const sql = neon(url);
    _db = drizzleNeon(sql, { schema });
    return _db;
  }

  _pool ??= new Pool({ connectionString: url });
  _db = drizzleNode(_pool, { schema });
  return _db;
}

/**
 * Drizzle DB client. Backed by a lazy Proxy so importing this module is safe
 * during Next.js build / page data collection (which runs without
 * `DATABASE_URL`). The connection is only created on first actual use.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
}) as Db;

export type Database = Db;
