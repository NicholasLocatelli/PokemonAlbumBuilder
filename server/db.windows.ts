// Windows-compatible PostgreSQL connection
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

// Check if DATABASE_URL is available
console.log("DATABASE_URL:", process.env.DATABASE_URL || "not set");
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Initialize pool and db
export let pool: pg.Pool | null = null;
export let db: any = null;

if (isDatabaseAvailable) {
  try {
    console.log("Using Windows-compatible PostgreSQL connection");
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test connection
    pool.query('SELECT 1')
      .then(() => {
        console.log("Successfully connected to PostgreSQL database");
        if (pool) {
          db = drizzle(pool, { schema });
        }
      })
      .catch(err => {
        console.error("Failed to connect to PostgreSQL database:", err.message);
        console.log("Falling back to in-memory storage");
        pool = null;
        db = null;
      });
  } catch (err: any) {
    console.error("Error initializing PostgreSQL connection:", err.message);
    console.log("Falling back to in-memory storage");
    pool = null;
    db = null;
  }
}