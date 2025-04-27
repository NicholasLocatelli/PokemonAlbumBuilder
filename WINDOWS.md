# Running on Windows with Local PostgreSQL

This guide provides instructions for running the Pokémon Album Builder application on Windows with a local PostgreSQL database.

## Setup Steps

1. **Install PostgreSQL**: Install PostgreSQL on your Windows machine.
   - Download from: [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Recommended: Use the EnterpriseDB installer
   - During installation, set your password (default script uses 'admin')
   - Keep the default port (5432)
   - Make sure to add PostgreSQL bin directory to your PATH during installation

2. **Create Database & Tables**: Choose one of these methods:

   **Method A**: Using setup-db.bat (if psql is in your PATH)
   - Run `setup-db.bat` to create the database and all necessary tables
   - Enter your PostgreSQL username and password when prompted

   **Method B**: Using pgAdmin (if psql is not in your PATH)
   - Follow the instructions in `setup-pgadmin.md` to create the database and tables
   - This uses the graphical pgAdmin tool instead of command-line tools

## Running the Application

After completing the setup steps:

1. Run `windows-start.bat`
   - This sets the DATABASE_URL to your local PostgreSQL
   - Starts the application with npm run dev

That's it! The application will start and connect to your local PostgreSQL database.

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
- Use either Method A (setup-db.bat) or Method B (pgAdmin) to create the tables
- This is a required step when using PostgreSQL locally

### "psql is not recognized as a command" error
- This means PostgreSQL's psql command is not in your PATH
- Use Method B (pgAdmin) described in setup-pgadmin.md instead
- Or add PostgreSQL's bin directory to your PATH (typically C:\Program Files\PostgreSQL\XX\bin)

## Passwords and Security

- The default scripts use username 'postgres' and password 'admin'
- For development only - change these to match your local PostgreSQL setup
- Edit the batch files to update the credentials if needed