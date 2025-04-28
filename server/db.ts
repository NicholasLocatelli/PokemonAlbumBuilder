import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
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

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available 
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Log connection status
if (isDatabaseAvailable) {
  console.log("DATABASE_URL is set:", process.env.DATABASE_URL.substring(0, process.env.DATABASE_URL.indexOf(':') + 3) + '***');
} else {
  console.warn("DATABASE_URL not set. Using in-memory storage instead.");
}

// Only create pool and db if DATABASE_URL is available
export let pool: Pool | null = null;
export let db: any = null;

try {
  if (isDatabaseAvailable) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("PostgreSQL connection pool created successfully");
  }
} catch (error) {
  console.error("Error connecting to PostgreSQL:", error);
  console.warn("Falling back to in-memory storage due to connection error");
}
