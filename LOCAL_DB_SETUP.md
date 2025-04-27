# Setting Up Local PostgreSQL for Windows

This guide will help you set up and run the Pokemon Album Builder with a local PostgreSQL database on Windows.

## Prerequisites

1. **Install PostgreSQL** from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Default username: postgres
   - Default password: (set during installation)
   - Default port: 5432

## Option 1: Using pgAdmin (Recommended)

pgAdmin is a graphical tool that comes with PostgreSQL:

1. **Open pgAdmin**
   - Look for pgAdmin in your Start menu
   - It should open a browser window with the pgAdmin interface

2. **Create a Database**
   - Expand "Servers" > "PostgreSQL xx" (enter your password if prompted)
   - Right-click on "Databases" and select "Create" > "Database..."
   - Name it `binderapp` and click "Save"

3. **Create Tables**
   - Right-click on the new "binderapp" database and select "Query Tool"
   - Copy the content from `db-schema.sql` file (located in the project root)
   - Paste it into the Query Tool
   - Click the "Execute/Refresh" button (▶️)
   - You should see "Query returned successfully" at the bottom

## Option 2: Using Command Line (If psql is in PATH)

1. **Open Command Prompt**
2. **Run setup-db.bat**
   - This will prompt for username (default: postgres) and password
   - It will create the database and tables automatically

## Running with Local Database

After setting up the database:

1. **Edit start-local-db.bat**
   - Update the connection string if necessary:
   ```bat
   SET DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/binderapp
   ```
   - Replace YOUR_PASSWORD with your actual PostgreSQL password

2. **Run start-local-db.bat**
   - This script will:
     - Set the necessary environment variables
     - Temporarily use local PostgreSQL-compatible code
     - Start the application
     - Restore original files when done

## Troubleshooting

### "Pool missing for some reason" or Database Connection Errors
- Verify PostgreSQL is running (Services app > PostgreSQL)
- Check that your password is correct in the connection string
- Ensure the database 'binderapp' exists
- Make sure the tables were created successfully

### "psql is not recognized" Error
- PostgreSQL's command-line tools are not in your PATH
- Use Option 1 (pgAdmin) instead
- Or add PostgreSQL's bin directory to your PATH:
  - Typically: `C:\Program Files\PostgreSQL\15\bin` (version may vary)
  - Then restart your command prompt