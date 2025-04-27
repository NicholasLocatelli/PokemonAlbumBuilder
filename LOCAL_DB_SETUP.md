# Pokemon Album Builder - Local Database Setup

This document provides instructions for setting up and running the Pokemon Album Builder application with a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL**: Make sure you have PostgreSQL installed on your computer.
   - You can download it from [postgresql.org](https://www.postgresql.org/download/)
   - For Windows users, the [EnterpriseDB installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) is recommended.

2. **Node.js**: The application requires Node.js to run.
   - Download from [nodejs.org](https://nodejs.org/)

## Database Setup

### Option 1: Using the Helper Script

1. Run `create-local-db.bat` and follow the prompts to create the "binderapp" database.
2. The script will ask for your PostgreSQL username and password.

### Option 2: Manual Setup

If you prefer to set up the database manually:

1. Open a command prompt or PostgreSQL tool like pgAdmin.
2. Connect to your PostgreSQL server.
3. Create a new database named "binderapp":
   ```sql
   CREATE DATABASE binderapp;
   ```

## Running the Application

### With Local Database

1. Run `start-local-db.bat` to start the application with the local PostgreSQL database.
2. The script sets the necessary environment variables and starts the development server.
3. The application will be available at http://localhost:5000

### Important Notes

- The local database will be completely separate from the Replit database.
- Any data you create locally (users, albums, etc.) will only exist in your local database.
- The application will automatically create the necessary tables in your local database on first run.

## Troubleshooting

If you encounter connection issues:

1. Verify that PostgreSQL is running
2. Check that the database "binderapp" exists
3. Verify the connection details in `start-local-db.bat`:
   - Default username: postgres
   - Default password: admin
   - Default port: 5432
   - Default database name: binderapp

If you need to modify the connection details, edit the `DATABASE_URL` in `start-local-db.bat`.