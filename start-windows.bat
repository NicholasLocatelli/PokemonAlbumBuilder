@echo off
echo Starting Pokemon Album Builder for Windows...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Load environment variables directly from the .env file
echo Loading environment variables from .env file...
for /f "tokens=*" %%a in ('type .env') do (
    echo Setting: %%a
    set %%a
)

REM Start the development server with our Windows Vite config
echo Starting server...
npx tsx --config vite.config.windows.ts server/index.ts