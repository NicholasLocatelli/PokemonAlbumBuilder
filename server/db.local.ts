import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if DATABASE_URL is available and log it for debugging
console.log("DATABASE_URL:", process.env.DATABASE_URL);
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Only create pool and db if DATABASE_URL is available
export let pool: Pool | null = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    // Use regular PostgreSQL Pool for local development
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Add SSL settings if needed
      // ssl: { rejectUnauthorized: false }
    });
    
    // Test the connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Error connecting to database:', err);
      } else {
        console.log('PostgreSQL connected successfully:', res.rows[0]);
      }
    });
    
    db = drizzle(pool, { schema });
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