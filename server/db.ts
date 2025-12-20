import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

console.log("DATABASE_URL env:", connectionString ? "✓ SET" : "✗ NOT SET");

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = new pg.Client({
  connectionString: connectionString,
});

let isConnected = false;

// Only connect when first query is made
const db = drizzle(client);

export { db };

// Test connection on startup (but don't block)
(async () => {
  try {
    await client.connect();
    isConnected = true;
    console.log("✓ Connected to Supabase");
  } catch (err) {
    console.error("⚠️ Database connection failed:", err);
    console.error("Routes will fail until database is reachable");
  }
})();
