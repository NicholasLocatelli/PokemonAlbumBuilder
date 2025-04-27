@echo off
echo Pokemon Album Builder - Simple Database Setup
echo.

set /p PGUSER=Enter PostgreSQL username (default: postgres): 
if "%PGUSER%"=="" set PGUSER=postgres

set /p PGPASSWORD=Enter PostgreSQL password (default: admin): 
if "%PGPASSWORD%"=="" set PGPASSWORD=admin

set PGDATABASE=binderapp

echo Creating database if it doesn't exist...
psql -U %PGUSER% -c "CREATE DATABASE %PGDATABASE%;" postgres

echo.
echo Creating tables in %PGDATABASE% database...
psql -U %PGUSER% -d %PGDATABASE% -f db-schema.sql

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Error running the database script. Make sure PostgreSQL is running and your credentials are correct.
  goto end
)

echo.
echo Database setup complete! Tables have been created successfully.
echo.
echo You can now run windows-start.bat to start the application.

:end
echo.
pause