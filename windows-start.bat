@echo off
echo Starting Pokemon Album Builder for Windows
echo.

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp

echo Using DATABASE_URL: %DATABASE_URL%
echo.
echo Make sure you've run setup-db.bat first to create the database and tables!
echo.

REM Start the app with local PostgreSQL
echo Starting the application...
call npm run dev

echo Windows development session complete