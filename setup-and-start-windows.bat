@echo off
echo Setting up and starting Pokemon Album Builder for Windows...

REM Install required global packages
echo Installing required global packages...
call npm install -g ts-node typescript nodemon

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL directly (customize this to your database)
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Start the server directly with npm
echo Starting server...
call npm run dev

REM If the above fails, try this alternative
IF %ERRORLEVEL% NEQ 0 (
    echo First attempt failed, trying alternative approach...
    cd %~dp0
    call npx tsx server/index.ts
)

echo If both approaches failed, you may need to run:
echo npm install
echo to ensure all local dependencies are installed.