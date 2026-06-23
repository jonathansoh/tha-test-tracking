/**
 * Runs a SQL migration file against the database using a direct Postgres
 * connection. Used to apply the schema to a Supabase project that is not
 * reachable via the connected MCP tooling.
 *
 *   DATABASE_URL="postgresql://..." npm run db:migrate
 *   DATABASE_URL="postgresql://..." npm run db:migrate -- supabase/migrations/0001_init.sql
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";

async function main() {
  const file = process.argv[2] ?? "supabase/migrations/0001_init.sql";
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing DATABASE_URL environment variable.");
    process.exit(1);
  }

  const sql = readFileSync(file, "utf8");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`✓ Applied ${file}`);
  } catch (err) {
    console.error("Migration failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
