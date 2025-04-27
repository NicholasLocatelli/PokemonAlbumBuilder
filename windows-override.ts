// Windows-only PostgreSQL connection file
// This completely removes any Neon database dependency for Windows

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./shared/schema";

// Export the same interface as the original db.ts
export const isDatabaseAvailable = !!process.env.DATABASE_URL;
export let pool: pg.Pool | null = null;
export let db: any = null;

// Connect to local PostgreSQL database
if (isDatabaseAvailable) {
  try {
    console.log("Using Windows local PostgreSQL connection");
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    
    // Create drizzle instance
    if (pool) {
      db = drizzle(pool, { schema });
      console.log("Successfully initialized local PostgreSQL with Drizzle ORM");
    }
  } catch (err: any) {
    console.error("Error initializing local PostgreSQL:", err.message);
    pool = null;
    db = null;
  }
}