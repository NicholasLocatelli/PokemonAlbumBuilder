@echo off
echo Building and running Pokemon Album Builder (JavaScript mode)...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL directly
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM First compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
call npx tsc

REM Check if compilation succeeded
IF %ERRORLEVEL% NEQ 0 (
  echo TypeScript compilation failed. Please fix any TypeScript errors.
  exit /b 1
)

echo TypeScript compilation successful.

REM Start the server using compiled JavaScript
echo Starting server with compiled JavaScript...
node dist/server/index.js

echo If this approach fails, you may need to:
echo 1. Run 'npm install' to ensure all dependencies are installed
echo 2. Check your tsconfig.json to make sure it's set up for compilation to 'dist' folder