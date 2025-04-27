@echo off
echo Pokemon Album Builder - Local Database Setup

echo This script will create a local database named "binderapp" for your application.
echo It assumes you have PostgreSQL installed and accessible via the command line.
echo Make sure your PostgreSQL server is running before proceeding.

set /p PGUSER=Enter PostgreSQL username (default: postgres): 
if "%PGUSER%"=="" set PGUSER=postgres

set /p PGPASSWORD=Enter PostgreSQL password: 

echo Creating database "binderapp"...
psql -U %PGUSER% -c "CREATE DATABASE binderapp;"

if %ERRORLEVEL% NEQ 0 (
  echo Failed to create database. Please check your PostgreSQL installation and credentials.
  exit /b 1
)

echo Database "binderapp" created successfully!
echo.
echo To start the application with this database, run:
echo   start-local-db.bat
echo.
echo Press any key to exit...
pause >nul