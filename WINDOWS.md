# Running on Windows with Local PostgreSQL

This guide provides instructions for running the Pokémon Album Builder application on Windows with a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL**: Install PostgreSQL on your Windows machine.
   - Download from: [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Recommended: Use the EnterpriseDB installer
   - During installation, set your password (default script uses 'admin')
   - Keep the default port (5432)

2. **Create Database**: Create a database named 'binderapp'
   - Using pgAdmin: Right-click on Databases → Create → Database → Name: binderapp
   - Using psql: `CREATE DATABASE binderapp;`

3. **Create Tables**: You must create the database tables before running the app
   - Run `windows-setup-db.bat` to create all necessary tables
   - This only needs to be done once after database creation

## Running the Application

### Method 1: Simple Windows Start

The easiest way to run the application on Windows:

1. Run `windows-start.bat`
   - This script temporarily modifies database configuration files
   - Uses the Windows-compatible PostgreSQL driver
   - Restores original files when done

### Method 2: Direct PostgreSQL Connection 

If you prefer not to modify files:

1. Run `start-local-db.bat`
   - This sets the DATABASE_URL environment variable to your local PostgreSQL
   - Attempts to use the current database configuration

## Troubleshooting

### "Pool missing for some reason" error
- This usually means the PostgreSQL driver couldn't connect to your database
- Make sure PostgreSQL is running (check Services on Windows)
- Verify the database 'binderapp' exists
- Check that the username/password in the batch file match your PostgreSQL setup

### "Failed to connect to database" error
- Check if PostgreSQL is running
- Verify network settings allow connections to localhost:5432
- Try connecting with pgAdmin or psql to confirm your credentials work

### "relation does not exist" error
- This means the database tables haven't been created yet
- Run `windows-setup-db.bat` to create all necessary tables
- This is a required step when using PostgreSQL locally

## Passwords and Security

- The default scripts use username 'postgres' and password 'admin'
- For development only - change these to match your local PostgreSQL setup
- Edit the batch files to update the credentials if needed