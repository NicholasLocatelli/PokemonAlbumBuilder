@echo off
echo Starting Pokemon Album Builder for Windows...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL directly
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Install necessary packages if they don't exist
if not exist node_modules (
    echo Installing node modules...
    call npm install
)

REM Make sure tsx is installed locally
echo Checking for tsx...
if not exist node_modules\.bin\tsx.cmd (
    echo Installing tsx...
    call npm install tsx --save-dev
)

REM Start the server using the local tsx
echo Starting server...
call node_modules\.bin\tsx server/index.ts

REM If all else fails, provide instructions
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to start the server.
    echo Try running these commands manually:
    echo npm install
    echo npx tsx server/index.ts
)