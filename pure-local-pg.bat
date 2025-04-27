@echo off
echo =========================================
echo PURE LOCAL PostgreSQL (Windows Compatible)
echo =========================================
echo.

REM Ask for PostgreSQL password
set /p PGPASSWORD="Enter your PostgreSQL password: "

REM Set environment variables for local PostgreSQL
SET NODE_ENV=development
SET DATABASE_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/binderapp

REM Set standard PostgreSQL environment variables
SET PGUSER=postgres
SET PGHOST=localhost
SET PGDATABASE=binderapp
SET PGPORT=5432

echo.
echo Using DATABASE_URL: postgresql://postgres:***@localhost:5432/binderapp
echo.

REM Check for pg package
if not exist node_modules\pg (
  echo Installing pg package for PostgreSQL...
  call npm install pg
)

REM Create a temp TypeScript file that overrides the import
echo // Temporary override for Windows> windows-import-override.js
echo const fs = require('fs'); >> windows-import-override.js
echo const path = require('path'); >> windows-import-override.js
echo const dbPath = path.join(__dirname, 'server', 'db.ts'); >> windows-import-override.js
echo const windowsDbPath = path.join(__dirname, 'windows-override.ts'); >> windows-import-override.js
echo. >> windows-import-override.js
echo // Read the original db.ts file >> windows-import-override.js
echo const originalContent = fs.readFileSync(dbPath, 'utf8'); >> windows-import-override.js
echo fs.writeFileSync(dbPath + '.bak', originalContent, 'utf8'); >> windows-import-override.js
echo console.log('Backed up original db.ts'); >> windows-import-override.js
echo. >> windows-import-override.js
echo // Read the Windows override file >> windows-import-override.js
echo const windowsContent = fs.readFileSync(windowsDbPath, 'utf8'); >> windows-import-override.js
echo fs.writeFileSync(dbPath, windowsContent, 'utf8'); >> windows-import-override.js
echo console.log('Applied Windows database override'); >> windows-import-override.js

REM Apply the override
echo Temporarily replacing db.ts with Windows-compatible version...
node windows-import-override.js

REM Start the application
echo Starting the application...
echo.
call npm run dev

REM Restore original db.ts
echo Restoring original db.ts...
copy /Y server\db.ts.bak server\db.ts
del server\db.ts.bak
del windows-import-override.js

echo Windows development session complete