import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available and log it for debugging
console.log("DATABASE_URL:", process.env.DATABASE_URL);
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Only create pool and db if DATABASE_URL is available
export let pool: Pool | null = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Successfully connected to PostgreSQL database");
  } else {
    console.warn("DATABASE_URL not set. Using in-memory storage instead.");
  }
} catch (error) {
  console.error("Failed to connect to database:", error);
  console.warn("Falling back to in-memory storage due to database connection error");
  pool = null;
  db = null;
}
