# Setting up PostgreSQL using pgAdmin

Since psql isn't in your PATH, you can use pgAdmin (the graphical PostgreSQL tool) to set up your database:

## Create the Database

1. Open pgAdmin (should be installed with PostgreSQL)
2. In the browser tree, expand "Servers"
3. Expand your PostgreSQL server (usually labeled PostgreSQL xx)
4. Right-click on "Databases" and select "Create" > "Database..."
5. Enter "binderapp" as the database name and click "Save"

## Create the Tables

1. Right-click on the new "binderapp" database and select "Query Tool"
2. Copy all the SQL from the `db-schema.sql` file 
3. Paste it into the Query Tool
4. Click the "Execute/Refresh" button (looks like a play button)

The tables will be created and you're ready to use the database.

## Run the Application

Now you can run `windows-start.bat` to start the application with your local database.

## Troubleshooting

If you prefer to add psql to your PATH:

1. Find your PostgreSQL bin directory (usually C:\Program Files\PostgreSQL\XX\bin)
2. Add this directory to your system PATH
3. Restart your command prompt
4. Try running setup-db.bat again