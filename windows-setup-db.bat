@echo off
echo Pokemon Album Builder - Database Setup for Windows
echo.
echo This script will create all necessary database tables in your local PostgreSQL

REM Set environment variables
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp

echo Setting up database at %DATABASE_URL%
echo.

REM Check if npx is available
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: npx not found. Make sure Node.js is installed correctly.
  exit /b 1
)

REM Install drizzle-kit if not already installed
echo Installing required tools...
call npm install drizzle-kit -D

echo.
echo Running database migrations...
echo.

REM Run drizzle-kit to generate and apply the schema
call npx drizzle-kit push:pg --schema=./shared/schema.ts --out=./drizzle --driver=pg --connectionString=%DATABASE_URL%

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Error: Failed to create database tables. Check that PostgreSQL is running and the connection details are correct.
  exit /b 1
)

echo.
echo Database setup complete! All tables have been created.
echo.
echo You can now run windows-start.bat to start the application with your local database.
echo.
pause