import { Pool as NeonServerlessPool, neonConfig } from '@neondatabase/serverless';
import * as pg from 'pg'; // Standard pg for local PostgreSQL
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("Loaded .env file from:", envPath);
} else {
  console.log(".env file not found at:", envPath, "- Using environment variables if available");
}

// Detect environment
const isReplitEnvironment = process.env.REPL_ID || process.env.REPL_OWNER;
console.log("Environment:", isReplitEnvironment ? "Replit" : "Local");

// For Replit's Neon DB connection
if (isReplitEnvironment) {
  neonConfig.webSocketConstructor = ws;
}

// Check if DATABASE_URL is available 
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Log connection status
if (isDatabaseAvailable && process.env.DATABASE_URL) {
  // Safely log just that we have a connection string without exposing credentials
  console.log("DATABASE_URL is set and will be used for PostgreSQL connection");
} else {
  console.warn("DATABASE_URL not set. Using in-memory storage instead.");
}

// Only create pool and db if DATABASE_URL is available
export let pool: any = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    if (isReplitEnvironment) {
      // Replit environment - use Neon Serverless
      pool = new NeonServerlessPool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      console.log("Neon PostgreSQL connection pool created successfully (Replit environment)");
    } else {
      // Local environment - use standard pg
      pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzlePg(pool, { schema });
      console.log("Standard PostgreSQL connection pool created successfully (local environment)");
    }
  }
} catch (error) {
  console.error("Error connecting to PostgreSQL:", error);
  console.warn("Falling back to in-memory storage due to connection error");
}
