// ES module compatible environment loader
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Export for use in other modules
export const loadEnv = () => {
  console.log('Environment variables loaded');
};

// Default export
export default {};