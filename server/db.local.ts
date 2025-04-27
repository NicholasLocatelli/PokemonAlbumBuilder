// Local PostgreSQL connection for Windows development
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Check if DATABASE_URL is available
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Initialize pool and db only if DATABASE_URL is available
export let pool: pg.Pool | null = null;
export let db: any = null;

if (isDatabaseAvailable) {
  try {
    console.log("Using local PostgreSQL connection");
    pool = new pg.Pool({ 
      connectionString: process.env.DATABASE_URL 
    });
    
    // Test connection
    pool.query('SELECT 1').then(() => {
      console.log("Successfully connected to local PostgreSQL database");
      // Only initialize drizzle with a valid pool
      if (pool) {
        db = drizzle(pool, { schema });
      }
    }).catch(err => {
      console.error("Failed to connect to local PostgreSQL database:", err.message);
      console.log("Falling back to in-memory storage");
      pool = null;
      db = null;
    });
  } catch (err: any) {
    console.error("Error initializing local PostgreSQL connection:", err.message);
    console.log("Falling back to in-memory storage");
    pool = null;
    db = null;
  }
}