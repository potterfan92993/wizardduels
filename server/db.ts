import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = new pg.Client({
  connectionString: connectionString,
});

export const db = drizzle(client);

// Connect to database
client.connect().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});
