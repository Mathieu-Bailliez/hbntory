import { Pool } from "pg";

const connectionString = process.env.MCP_DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable MCP_DATABASE_URL est manquante.");
}

export const db = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  max: 5,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await db.connect();

  try {
    await client.query("SELECT 1");
    console.error("Connexion PostgreSQL réussie.");
  } finally {
    client.release();
  }
}
