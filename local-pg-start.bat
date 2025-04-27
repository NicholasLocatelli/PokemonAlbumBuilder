@echo off
echo Starting Pokemon Album Builder with Local PostgreSQL...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL for local PostgreSQL
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Create a temporary server/db.ts file that uses the local version
echo Creating temporary db.ts file for local development...
copy /Y server\db.local.ts server\db.ts.local
copy /Y server\db.ts server\db.ts.backup
copy /Y server\db.local.ts server\db.ts

REM Install necessary packages if they don't exist
if not exist node_modules (
    echo Installing node modules...
    call npm install
)

REM Make sure tsx and pg are installed locally
echo Checking for required packages...
if not exist node_modules\.bin\tsx.cmd (
    echo Installing tsx...
    call npm install tsx --save-dev
)
if not exist node_modules\pg (
    echo Installing pg package for PostgreSQL...
    call npm install pg --save
)

REM Start the server using the local tsx
echo Starting server...
call node_modules\.bin\tsx server/index.ts

REM Restore the original db.ts file
echo Restoring original db.ts file...
copy /Y server\db.ts.backup server\db.ts
del server\db.ts.backup
del server\db.ts.local

echo Local development session complete.