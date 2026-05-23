/**
 * Programmatic drizzle migration runner.
 *
 * Runs SQL migrations from ./drizzle against `DATABASE_URL`. Used as part of
 * `bun run build` so that a fresh Vercel deployment automatically applies the
 * schema on first boot.
 *
 * Safe to run repeatedly (drizzle tracks applied migrations in its own meta
 * table), and a no-op when `DATABASE_URL` is not set (e.g. CI typecheck).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("[languine] DATABASE_URL is not set; skipping migrations.");
  process.exit(0);
}

if (process.env.SKIP_MIGRATIONS === "1") {
  console.log("[languine] SKIP_MIGRATIONS=1; skipping migrations.");
  process.exit(0);
}

function isNeonDatabaseUrl(value: string): boolean {
  try {
    return new URL(value).hostname.toLowerCase().includes("neon.tech");
  } catch {
    return false;
  }
}

async function main() {
  console.log("[languine] Applying migrations...");

  if (isNeonDatabaseUrl(url!)) {
    const sql = neon(url!);
    const db = drizzleNeon(sql);
    await migrateNeon(db, { migrationsFolder: "./drizzle" });
    console.log("[languine] Migrations applied.");
    return;
  }

  const pool = new Pool({ connectionString: url! });

  try {
    const db = drizzleNode(pool);
    await migrateNode(db, { migrationsFolder: "./drizzle" });
  } finally {
    await pool.end();
  }

  console.log("[languine] Migrations applied.");
}

main().catch((error) => {
  console.error("[languine] Migration failed:", error);
  process.exit(1);
});
