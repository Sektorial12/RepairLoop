import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config.js";
import * as schema from "./schema.js";

export const pool = env.DATABASE_URL
  ? new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;

export type DatabaseStatus = "up" | "down" | "not_configured";

export async function checkDb(): Promise<DatabaseStatus> {
  if (!pool) return "not_configured";
  try {
    await pool.query("select 1");
    return "up";
  } catch {
    return "down";
  }
}

export async function closeDb(): Promise<void> {
  if (pool) await pool.end();
}
