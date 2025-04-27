# Setting Up Local PostgreSQL for Windows

This guide will help you set up and run the Pokemon Album Builder with a local PostgreSQL database on Windows.

## Prerequisites

1. **Install PostgreSQL** from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Default username: postgres
   - Default password: (set during installation)
   - Default port: 5432

2. **Install Required NPM Package**
   - Run this command in your project directory:
   ```
   npm install pg
   ```

## Option 1: Using pgAdmin (Recommended)

pgAdmin is a graphical tool that comes with PostgreSQL:

1. **Open pgAdmin**
   - Look for pgAdmin in your Start menu
   - It should open a browser window with the pgAdmin interface

2. **Create a Database**
   - Expand "Servers" > "PostgreSQL xx" (enter your password if prompted)
   - Right-click on "Databases" and select "Create" > "Database..."
   - Name it `binderapp` and click "Save"

3. **Create Tables**
   - Right-click on the new "binderapp" database and select "Query Tool"
   - Copy the content from `db-schema.sql` file (located in the project root)
   - Paste it into the Query Tool
   - Click the "Execute/Refresh" button (▶️)
   - You should see "Query returned successfully" at the bottom

## Option 2: Using Command Line (If psql is in PATH)

If you prefer command line and have psql in your PATH:

1. **Open Command Prompt**
2. **Run setup-db.bat**
   - This will prompt for username (default: postgres) and password
   - It will create the database and tables automatically

## Simple Method for Running with Local Database

After setting up the database:

1. **Run simple-local-pg.bat**
   - Enter your PostgreSQL password when prompted
   - This just sets the necessary environment variables and runs npm run dev
   - No file modifications needed

## Manual Method (One-Time File Edit)

If the simple method doesn't work:

1. **Modify server/db.ts** - Add ONE LINE after line 6:
   ```typescript
   import { Pool, neonConfig } from '@neondatabase/serverless';
   import { drizzle } from 'drizzle-orm/neon-serverless';
   import ws from "ws";
   import * as schema from "@shared/schema";
   
   // ADD THIS LINE:
   const isLocalPostgres = process.env.DATABASE_URL?.includes('localhost');
   
   // Configure Neon database with WebSocket support
   neonConfig.webSocketConstructor = ws;
   ```

2. **Use simple-local-pg.bat** to run the application

## Troubleshooting

### "Pool missing for some reason" or Database Connection Errors
- Verify PostgreSQL is running (Services app > PostgreSQL)
- Check that your password is correct in the connection string
- Ensure the database 'binderapp' exists
- Make sure the tables were created successfully

### "psql is not recognized" Error
- PostgreSQL's command-line tools are not in your PATH
- Use Option 1 (pgAdmin) instead
- Or add PostgreSQL's bin directory to your PATH:
  - Typically: `C:\Program Files\PostgreSQL\15\bin` (version may vary)
  - Then restart your command prompt