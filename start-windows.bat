@echo off
echo Starting Pokemon Album Builder for Windows...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Load environment variables from .env file using our custom script
node load-env.js

REM Start the development server using Windows-specific Vite config
npx tsx server/index.ts --config vite.config.windows.ts