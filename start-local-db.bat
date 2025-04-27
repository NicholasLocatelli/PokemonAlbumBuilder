@echo off
echo Starting Pokemon Album Builder with Local PostgreSQL Database

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
SET USE_LOCAL_DB=true

echo DATABASE_URL set to %DATABASE_URL%
echo Using local PostgreSQL driver

REM Backup original files
echo Backing up original files...
if not exist server\db.ts.bak copy server\db.ts server\db.ts.bak
if not exist server\storage.ts.bak copy server\storage.ts server\storage.ts.bak

REM Copy Windows versions in place
echo Copying Windows-friendly versions...
copy /Y server\db.local.ts server\db.ts
copy /Y server\storage.ts.windows server\storage.ts

REM Start the app with npm run dev
echo Starting the application...
echo.
npm run dev

REM Restore original files
echo Restoring original files...
if exist server\db.ts.bak copy /Y server\db.ts.bak server\db.ts
if exist server\storage.ts.bak copy /Y server\storage.ts.bak server\storage.ts

echo Windows development session complete