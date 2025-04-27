@echo off
echo Starting Simplified Setup for Pokemon Album Builder...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Set DATABASE_URL directly (customize this to your database)
SET DATABASE_URL=postgresql://postgres:admin@localhost:5432/binderapp
echo Set DATABASE_URL to %DATABASE_URL%

REM Start the server without using vite directly
echo Starting server with Node.js...
npx nodemon server/index.ts