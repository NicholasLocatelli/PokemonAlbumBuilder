@echo off
echo Starting Pokemon Album Builder with Local PostgreSQL
echo =================================================
echo.

REM Ask for PostgreSQL password
set /p PGPASSWORD="Enter your PostgreSQL password: "

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/binderapp

REM Set additional PostgreSQL environment variables
SET PGUSER=postgres
SET PGHOST=localhost
SET PGDATABASE=binderapp
SET PGPORT=5432

echo.
echo Using DATABASE_URL: postgresql://postgres:***@localhost:5432/binderapp
echo Make sure you've created the database and tables using pgAdmin!
echo (See LOCAL_DB_SETUP.md for instructions)
echo.

REM Start the application
echo Starting the application...
echo.
npm run dev

echo Windows development session complete