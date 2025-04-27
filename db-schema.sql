-- Pokemon Album Builder - Database Schema
-- Run this file to create all necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "displayName" TEXT
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "gridSize" INTEGER NOT NULL DEFAULT 9,
    "userId" INTEGER REFERENCES users(id)
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    "albumId" INTEGER NOT NULL REFERENCES albums(id),
    "pageNumber" INTEGER NOT NULL,
    cards JSONB,
    UNIQUE("albumId", "pageNumber")
);

-- Session table (for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_album_userId" ON albums ("userId");
CREATE INDEX IF NOT EXISTS "idx_page_albumId" ON pages ("albumId");