@echo off
echo Simple Pokemon Album Builder Local Runner

REM Set environment variables
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Modify storage.ts to always use in-memory
echo Creating a simple override to always use in-memory storage...
if not exist server\storage.ts.original (
  copy /Y server\storage.ts server\storage.ts.original
)

echo. > server\storage.ts.temp
echo // TEMPORARY FILE FOR LOCAL DEVELOPMENT >> server\storage.ts.temp
echo // Original file is saved as storage.ts.original >> server\storage.ts.temp
echo import { MemStorage, IStorage } from './storage.ts.original'; >> server\storage.ts.temp
echo export { MemStorage, IStorage }; >> server\storage.ts.temp
echo export const storage = new MemStorage(); >> server\storage.ts.temp
echo console.log("Using in-memory storage for local development"); >> server\storage.ts.temp

copy /Y server\storage.ts.temp server\storage.ts
del server\storage.ts.temp

REM Start the application
echo Running application...
call npm run dev

REM Restore original storage.ts
echo Restoring original storage.ts
copy /Y server\storage.ts.original server\storage.ts
echo Cleanup complete