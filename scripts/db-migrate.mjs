import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
try {
  await sql.unsafe(await readFile(resolve("db/001_quotes.sql"), "utf8"));
  console.log("GhostMode database migration complete.");
} finally {
  await sql.end();
}
