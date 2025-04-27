@echo off
echo Starting Pokemon Album Builder with Local PostgreSQL
echo =================================================
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

REM Backup original files
echo Backing up original db.ts...
copy /Y server\db.ts server\db.ts.bak

REM Copy Windows-specific db.ts
echo Using Windows-compatible database driver...
copy /Y server\db.windows.ts server\db.ts 

REM Start the application
echo Starting the application...
echo.
npm run dev

REM Restore original file when done
echo Restoring original db.ts...
copy /Y server\db.ts.bak server\db.ts
del server\db.ts.bak

echo Windows development session complete