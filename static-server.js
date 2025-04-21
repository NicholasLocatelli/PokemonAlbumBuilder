import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve the features overview HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'features-overview.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Overview server running at http://0.0.0.0:${PORT}`);
});