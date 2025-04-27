@echo off
echo Starting Pokemon Album Builder for Windows development
echo.

REM Check if we need to install pg package
if not exist node_modules\pg (
  echo Installing pg package for PostgreSQL...
  call npm install pg --save-dev
)

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp

REM Create a temp config file that uses regular pg instead of neon
echo Creating temporary db config...
echo // Temporary DB config for Windows > server\db.windows.js
echo import pg from 'pg'; >> server\db.windows.js
echo import { drizzle } from 'drizzle-orm/node-postgres'; >> server\db.windows.js
echo import * as schema from "@shared/schema"; >> server\db.windows.js
echo. >> server\db.windows.js
echo export const pool = new pg.Pool({ connectionString: '%DATABASE_URL%' }); >> server\db.windows.js
echo export const db = drizzle(pool, { schema }); >> server\db.windows.js
echo export const isDatabaseAvailable = true; >> server\db.windows.js

REM Backup the original db.ts
echo Backing up original db.ts...
copy /Y server\db.ts server\db.ts.bak

REM Copy our Windows-friendly version
echo Replacing with Windows-friendly db.ts...
copy /Y server\db.windows.js server\db.ts

REM Start the app
echo Starting the application...
call npm run dev

REM Cleanup
echo Restoring original db.ts...
copy /Y server\db.ts.bak server\db.ts
del server\db.ts.bak
del server\db.windows.js

echo Windows development session complete