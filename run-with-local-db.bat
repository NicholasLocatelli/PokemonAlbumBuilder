@echo off
echo Pokemon Album Builder with Local PostgreSQL
echo ===========================================
echo.

REM Ask for PostgreSQL password
set /p PGPASSWORD="Enter your PostgreSQL password: "

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/binderapp
SET USE_LOCAL_DB=true

echo.
echo Using DATABASE_URL: postgresql://postgres:***@localhost:5432/binderapp
echo.

REM Install pg package if needed
if not exist node_modules\pg (
  echo Installing pg package for PostgreSQL...
  call npm install pg
)

REM Create a Windows-compatible database connection file
echo Creating Windows-compatible database file...
echo // Windows-compatible PostgreSQL connection > server\db.windows.js
echo const pg = require('pg'); >> server\db.windows.js
echo const { drizzle } = require('drizzle-orm/node-postgres'); >> server\db.windows.js
echo const schema = require('../shared/schema'); >> server\db.windows.js
echo. >> server\db.windows.js
echo const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); >> server\db.windows.js
echo const db = drizzle(pool, { schema }); >> server\db.windows.js
echo. >> server\db.windows.js
echo module.exports = { pool, db, isDatabaseAvailable: true }; >> server\db.windows.js

REM Backup original db.ts
copy server\db.ts server\db.ts.backup

REM Use our Windows-compatible version
copy server\db.windows.js server\db.js

REM Start the application with node directly
echo Starting application...
echo.
node -r server/db.windows.js server/index.js

REM Cleanup
echo.
echo Cleaning up temporary files...
del server\db.windows.js
copy /Y server\db.ts.backup server\db.ts
del server\db.ts.backup

echo.
echo Application ended.
pause