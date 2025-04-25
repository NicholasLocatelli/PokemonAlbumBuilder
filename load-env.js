// Simple script to load .env file
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve('.env');
  console.log('Looking for .env file at:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('.env file found, loading variables...');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
        console.log(`Loaded environment variable: ${key.trim()}`);
      }
    });
    
    console.log('Environment variables loaded successfully.');
  } else {
    console.log('No .env file found. Using system environment variables only.');
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}