import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database with WebSocket support
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available and log it for debugging
console.log("DATABASE_URL:", process.env.DATABASE_URL);
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Only create pool and db if DATABASE_URL is available
export let pool: Pool | null = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    // Check if we're using a local PostgreSQL connection
    const isLocalPostgres = process.env.DATABASE_URL?.includes('localhost') || 
                           process.env.DATABASE_URL?.includes('127.0.0.1');
    
    if (isLocalPostgres) {
      console.log("Using local PostgreSQL connection");
      // For Windows/local PostgreSQL, use normal Pool
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      console.log("Successfully connected to local PostgreSQL database");
    } else {
      // Use Neon Serverless for Replit environment
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      console.log("Successfully connected to Neon PostgreSQL database");
    }
  } else {
    console.warn("DATABASE_URL not set. Using in-memory storage instead.");
  }
} catch (error) {
  console.error("Failed to connect to database:", error);
  console.warn("Falling back to in-memory storage due to database connection error");
  pool = null;
  db = null;
}
