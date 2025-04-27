// Local PostgreSQL database connection for Windows
// This file replaces the Neon serverless connection with a direct PostgreSQL connection
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Logger for better debugging
function log(message: string, ...args: any[]) {
  console.log(`[LOCAL DB] ${message}`, ...args);
}

// Check if DATABASE_URL is available
log("DATABASE_URL:", process.env.DATABASE_URL);
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Set up database connection variables
export let pool: Pool | null = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    // Create the PostgreSQL connection pool
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL 
    });
    
    // Test the connection first
    log("Testing database connection...");
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        log("Database connection test failed:", err.message);
      } else {
        log("Database connection successful!", res.rows[0]);
      }
    });
    
    // Set up Drizzle ORM with our schema
    db = drizzle(pool, { schema });
    log("Database setup complete with Drizzle ORM");
  } else {
    log("Warning: DATABASE_URL not set - using in-memory storage");
  }
} catch (error) {
  log("Error setting up database:", error);
  pool = null;
  db = null;
}

// This function helps validate the connection is still alive
export async function testConnection() {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (err) {
    log("Connection test failed:", err);
    return false;
  }
}