@echo off
echo Starting Pokemon Album Builder for Windows
echo ========================================
echo.

REM Ask for PostgreSQL password
set /p PGPASSWORD="Enter your PostgreSQL password: "

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/binderapp

echo Using DATABASE_URL: postgresql://postgres:***@localhost:5432/binderapp
echo.
echo Make sure you've created the database and tables using pgAdmin!
echo (See LOCAL_DB_SETUP.md for instructions)
echo.

REM Install pg package if needed
if not exist node_modules\pg (
  echo Installing pg package for PostgreSQL...
  call npm install pg
)

REM Start with npm run dev 
echo Starting the application...
echo.
set PGUSER=postgres
set PGHOST=localhost
set PGDATABASE=binderapp
set PGPORT=5432
npm run dev

echo Windows development session complete