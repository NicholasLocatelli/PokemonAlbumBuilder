@echo off
echo Starting Pokemon Album Builder with Local PostgreSQL Database

REM Set environment variables
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp

echo DATABASE_URL set to: %DATABASE_URL%
echo Make sure your local PostgreSQL server is running!
echo Make sure you've created a database named "binderapp"!

REM Install required packages if not already installed
echo Checking for required packages...
call npm install pg drizzle-orm --no-save

REM Start the server
echo Starting application...
call npm run dev

echo Application stopped.