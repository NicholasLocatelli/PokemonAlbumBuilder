@echo off
echo Cleaning Vite cache and starting Pokemon Album Builder for Windows...

REM Set NODE_ENV to development
SET NODE_ENV=development

REM Clean Vite cache directories
echo Cleaning Vite cache directories...
IF EXIST node_modules\.vite (
    rmdir /S /Q node_modules\.vite
    echo Removed node_modules\.vite
)
IF EXIST .vite-cache (
    rmdir /S /Q .vite-cache
    echo Removed .vite-cache
)

REM Load environment variables directly from the .env file
echo Loading environment variables from .env file...
for /f "tokens=*" %%a in ('type .env') do (
    echo Setting: %%a
    set %%a
)

REM Start the development server with direct command to avoid TSX issues
echo Starting server...
node --loader ts-node/esm server/index.ts