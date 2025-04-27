@echo off
echo Starting Pokemon Album Builder for Windows (Simplified Version)...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL for local PostgreSQL
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Create a simpler solution for running in memory mode
echo Creating a simple in-memory version for local development...

REM Install necessary packages for development
echo Installing required packages...
call npm install --no-save

REM Modify storage.ts to always use in-memory storage for simplicity
echo Creating backup of storage.ts...
if not exist server\storage.ts.bak (
  copy /Y server\storage.ts server\storage.ts.bak
)

REM Start the development server
echo Starting development server...
call npm run dev

REM Restore storage.ts if needed
echo Checking if storage.ts needs to be restored...
if exist server\storage.ts.bak (
  copy /Y server\storage.ts.bak server\storage.ts
  echo Restored original storage.ts
)

echo Local development session complete.