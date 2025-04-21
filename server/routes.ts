import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlbumSchema, insertPageSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  setupAuth(app);
  // Album routes
  app.post("/api/albums", async (req, res) => {
    if (!req.isAuthenticated()) {
      // Allow anonymous album creation for backward compatibility
      const albumData = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(albumData);
      res.json(album);
    } else {
      // Authenticated album creation
      const albumData = insertAlbumSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const album = await storage.createAlbum(albumData);
      res.json(album);
    }
  });
  
  app.get("/api/albums/all", async (req, res) => {
    const albums = await storage.getAllAlbums();
    res.json(albums);
  });
  
  // Get albums belonging to the logged-in user
  app.get("/api/user/albums", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const albums = await storage.getUserAlbums(req.user.id);
    res.json(albums);
  });

  app.get("/api/albums/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const album = await storage.getAlbum(id);
    if (!album) return res.status(404).json({ message: "Album not found" });
    res.json(album);
  });

  app.patch("/api/albums/:id/grid-size", async (req, res) => {
    const id = parseInt(req.params.id);
    const { gridSize } = z.object({ gridSize: z.number() }).parse(req.body);
    const album = await storage.updateAlbumGridSize(id, gridSize);
    res.json(album);
  });

  // Page routes
  app.post("/api/pages", async (req, res) => {
    const pageData = insertPageSchema.parse(req.body);
    const page = await storage.createPage(pageData);
    res.json(page);
  });

  app.get("/api/albums/:albumId/pages/:pageNumber", async (req, res) => {
    const albumId = parseInt(req.params.albumId);
    const pageNumber = parseInt(req.params.pageNumber);
    const page = await storage.getPage(albumId, pageNumber);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.patch("/api/pages/:id/cards", async (req, res) => {
    const id = parseInt(req.params.id);
    const { cards } = z.object({
      cards: z.array(z.object({
        position: z.number(),
        cardId: z.string()
      }).nullable())
    }).parse(req.body);
    const page = await storage.updatePageCards(id, cards);
    res.json(page);
  });

  // Pokemon card routes
  app.get("/api/cards/search", async (req, res) => {
    const { query, setId } = z.object({ 
      query: z.string(), 
      setId: z.string().optional() 
    }).parse(req.query);
    
    const cards = await storage.searchCards(query, setId);
    res.json(cards);
  });

  app.get("/api/cards/:id", async (req, res) => {
    const { id } = req.params;
    const card = await storage.getCard(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });
  
  // Get all card sets
  app.get("/api/sets", async (req, res) => {
    const sets = await storage.getSets();
    res.json(sets);
  });
  
  // Special route to show features without going through Vite
  app.get("/features", async (req, res) => {
    // Get host info
    const host = req.headers.host || 'localhost:5000';
    
    // Get all albums for live stats
    const albums = await storage.getAllAlbums();
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pokémon Card Album Features</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
          }
          h1, h2, h3 {
            color: #4f46e5;
          }
          .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 2rem;
          }
          .feature {
            background-color: #f9fafb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .feature h3 {
            margin-top: 0;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
          }
          .check {
            color: #16a34a;
            font-weight: bold;
          }
          .code {
            background-color: #f1f5f9;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-family: monospace;
            font-size: 0.9rem;
            overflow-x: auto;
          }
          .stats {
            background-color: #eff6ff;
            padding: 1rem;
            border-radius: 0.25rem;
            margin-top: 2rem;
          }
          .stats h3 {
            margin-top: 0;
          }
          .card-preview {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
            display: none;
          }
          .card-image {
            max-width: 100%;
            height: auto;
            border-radius: 0.25rem;
          }
          .card-details {
            margin-top: 0.5rem;
          }
          .button {
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.25rem;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            display: inline-block;
            text-decoration: none;
          }
          .button:hover {
            background-color: #4338ca;
          }
          .interactive {
            background-color: #f0f9ff;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-top: 2rem;
          }
          .tab-buttons {
            display: flex;
            gap: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }
          .tab-button {
            background-color: transparent;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem 0.25rem 0 0;
            cursor: pointer;
            font-weight: 500;
          }
          .tab-button.active {
            background-color: #4f46e5;
            color: white;
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }
          input, select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.25rem;
            font-family: inherit;
            font-size: inherit;
          }
          .results {
            margin-top: 1rem;
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.25rem;
            max-height: 300px;
            overflow-y: auto;
          }
          .grid-preview {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-top: 1rem;
          }
          .grid-item {
            background-color: #f9fafb;
            border: 1px dashed #d1d5db;
            border-radius: 0.25rem;
            padding: 1rem;
            aspect-ratio: 2/3;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: #6b7280;
          }
          
          /* Dark/Light mode switch */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1f2937;
              color: #e5e7eb;
            }
            .feature {
              background-color: #374151;
            }
            .code {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1, h2, h3 {
              color: #818cf8;
            }
            .stats {
              background-color: #1e3a8a;
            }
            .interactive {
              background-color: #172554;
            }
            .results, .grid-item {
              background-color: #374151;
            }
            .card-preview {
              border-color: #4b5563;
            }
            input, select {
              background-color: #374151;
              border-color: #4b5563;
              color: #e5e7eb;
            }
            .tab-buttons {
              border-color: #4b5563;
            }
          }
        </style>
      </head>
      <body>
        <h1>Pokémon Card Album - Interactive Demo</h1>
        
        <p>
          This interactive demo provides access to all the features we've implemented in the Pokémon Card Album application.
          The backend is fully functional with PostgreSQL database integration, and this page allows you to test
          the API endpoints directly without going through the Vite frontend.
        </p>
        
        <div class="container">
          <div class="feature">
            <h3><span class="check">✓</span> Set Filtering</h3>
            <p>Users can filter cards by their Pokémon card sets, making it easier to find specific cards.</p>
            <p>Implementation includes:</p>
            <ul>
              <li>API endpoint to fetch all card sets</li>
              <li>Dropdown UI for set selection</li>
              <li>Integration with the Pokémon TCG API</li>
            </ul>
            <div class="code">GET /api/sets</div>
          </div>
          
          <div class="feature">
            <h3><span class="check">✓</span> Drag and Drop Repositioning</h3>
            <p>Cards can now be dragged from one position to another within the album, enabling flexible organization.</p>
            <p>Implementation includes:</p>
            <ul>
              <li>React DnD for drag and drop functionality</li>
              <li>Custom drag sources and drop targets</li>
              <li>Card position tracking in database</li>
            </ul>
            <div class="code">PATCH /api/pages/:id/cards</div>
          </div>
          
          <div class="feature">
            <h3><span class="check">✓</span> Enhanced Card Display</h3>
            <p>Cards now display additional metadata including set symbols, card numbers, and rarity indicators.</p>
            <p>Implementation includes:</p>
            <ul>
              <li>Extended card type definitions</li>
              <li>Improved UI components for card display</li>
              <li>Responsive layout adjustments</li>
            </ul>
          </div>
          
          <div class="feature">
            <h3><span class="check">✓</span> Visual Drag Feedback</h3>
            <p>Users now get visual feedback during drag operations with borders and opacity changes.</p>
            <p>Implementation includes:</p>
            <ul>
              <li>CSS transitions for smooth animations</li>
              <li>Dynamic class application based on drag state</li>
              <li>Improved UX for drag operations</li>
            </ul>
          </div>
        </div>
        
        <div class="stats">
          <h3>Database Statistics</h3>
          <p>The application is now using PostgreSQL for data persistence:</p>
          <ul>
            <li><strong>Albums:</strong> Store album metadata and grid size configuration (${albums.length} albums currently)</li>
            <li><strong>Pages:</strong> Store cards placed on each album page</li>
            <li><strong>Relations:</strong> Albums have many pages, and pages belong to albums</li>
          </ul>
          <p>
            All data is now persisted to the database, so your card placements will be saved
            even if you close the browser or restart the server.
          </p>
        </div>
        
        <div class="interactive">
          <h3>Interactive API Demo</h3>
          
          <div class="tab-buttons">
            <button class="tab-button active" onclick="showTab('albums')">Albums</button>
            <button class="tab-button" onclick="showTab('cards')">Card Search</button>
            <button class="tab-button" onclick="showTab('sets')">Sets</button>
            <button class="tab-button" onclick="showTab('layout')">Layout Preview</button>
          </div>
          
          <div id="albums" class="tab-content active">
            <h4>Album Management</h4>
            
            <div class="form-group">
              <label for="album-name">Album Name:</label>
              <input type="text" id="album-name" placeholder="My Collection">
            </div>
            
            <div class="form-group">
              <label for="grid-size">Grid Size:</label>
              <select id="grid-size">
                <option value="4">2x2 (4 cards)</option>
                <option value="9" selected>3x3 (9 cards)</option>
                <option value="12">3x4 (12 cards)</option>
              </select>
            </div>
            
            <button class="button" onclick="createAlbum()">Create Album</button>
            <button class="button" style="background-color: #4b5563;" onclick="getAlbums()">Get All Albums</button>
            
            <div id="album-results" class="results" style="display: none;"></div>
          </div>
          
          <div id="cards" class="tab-content">
            <h4>Card Search</h4>
            
            <div class="form-group">
              <label for="search-query">Search Query:</label>
              <input type="text" id="search-query" placeholder="pikachu">
            </div>
            
            <div class="form-group">
              <label for="set-filter">Filter by Set (Optional):</label>
              <select id="set-filter">
                <option value="">All Sets</option>
                <!-- Will be populated by JS -->
              </select>
            </div>
            
            <button class="button" onclick="searchCards()">Search Cards</button>
            
            <div id="card-results" class="results" style="display: none;"></div>
            <div id="card-preview" class="card-preview">
              <img id="card-image" class="card-image" src="" alt="Card Preview">
              <div id="card-details" class="card-details"></div>
            </div>
          </div>
          
          <div id="sets" class="tab-content">
            <h4>Card Sets</h4>
            
            <button class="button" onclick="getSets()">Load All Sets</button>
            
            <div id="sets-results" class="results" style="display: none;"></div>
          </div>
          
          <div id="layout" class="tab-content">
            <h4>Album Layout Preview</h4>
            
            <div class="form-group">
              <label for="preview-grid-size">Grid Size:</label>
              <select id="preview-grid-size" onchange="updateGridPreview()">
                <option value="4">2x2 (4 cards)</option>
                <option value="9" selected>3x3 (9 cards)</option>
                <option value="12">3x4 (12 cards)</option>
              </select>
            </div>
            
            <div id="grid-preview" class="grid-preview">
              <!-- Will be populated by JS -->
            </div>
          </div>
        </div>
        
        <script>
          const API_BASE = 'http://${host}';
          let currentCardData = null;
          
          function showTab(tabId) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(el => {
              el.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(el => {
              el.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabId).classList.add('active');
            
            // Add active class to clicked button
            document.querySelector(\`.tab-button[onclick="showTab('\${tabId}')"]\`).classList.add('active');
            
            // Initialize tab if needed
            if (tabId === 'sets') {
              loadSets();
            } else if (tabId === 'layout') {
              updateGridPreview();
            }
          }
          
          function createAlbum() {
            const name = document.getElementById('album-name').value || 'My Collection';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            
            fetch(\`\${API_BASE}/api/albums\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, gridSize })
            })
            .then(response => response.json())
            .then(data => {
              const resultsDiv = document.getElementById('album-results');
              resultsDiv.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
              resultsDiv.style.display = 'block';
              
              // Create a page for this album automatically
              createPage(data.id);
            })
            .catch(error => {
              console.error('Error creating album:', error);
              document.getElementById('album-results').innerHTML = \`<div style="color: #ef4444;">Error: \${error.message}</div>\`;
              document.getElementById('album-results').style.display = 'block';
            });
          }
          
          function createPage(albumId) {
            fetch(\`\${API_BASE}/api/pages\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ albumId, pageNumber: 1, cards: [] })
            })
            .then(response => response.json())
            .then(data => {
              const resultsDiv = document.getElementById('album-results');
              resultsDiv.innerHTML += \`<pre>Page created: \${JSON.stringify(data, null, 2)}</pre>\`;
            })
            .catch(error => {
              console.error('Error creating page:', error);
              document.getElementById('album-results').innerHTML += \`<div style="color: #ef4444;">Error creating page: \${error.message}</div>\`;
            });
          }
          
          function getAlbums() {
            fetch(\`\${API_BASE}/api/albums/all\`)
            .then(response => response.json())
            .then(data => {
              const resultsDiv = document.getElementById('album-results');
              resultsDiv.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
              resultsDiv.style.display = 'block';
            })
            .catch(error => {
              console.error('Error fetching albums:', error);
              document.getElementById('album-results').innerHTML = \`<div style="color: #ef4444;">Error: \${error.message}</div>\`;
              document.getElementById('album-results').style.display = 'block';
            });
          }
          
          function searchCards() {
            const query = document.getElementById('search-query').value || 'pikachu';
            const setId = document.getElementById('set-filter').value;
            
            let url = \`\${API_BASE}/api/cards/search?query=\${encodeURIComponent(query)}\`;
            if (setId) {
              url += \`&setId=\${encodeURIComponent(setId)}\`;
            }
            
            fetch(url)
            .then(response => response.json())
            .then(data => {
              const resultsDiv = document.getElementById('card-results');
              
              if (data.length === 0) {
                resultsDiv.innerHTML = '<p>No cards found matching your query.</p>';
              } else {
                let html = '<ul style="list-style-type: none; padding: 0;">';
                data.forEach(card => {
                  html += \`
                    <li style="margin-bottom: 0.5rem; cursor: pointer;" onclick="showCardPreview('\${card.id}')">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <img src="\${card.images.small}" alt="\${card.name}" style="width: 40px; height: auto; border-radius: 0.25rem;">
                        <span>\${card.name} - \${card.set.name} (\${card.number || 'N/A'})</span>
                      </div>
                    </li>
                  \`;
                });
                html += '</ul>';
                resultsDiv.innerHTML = html;
              }
              
              resultsDiv.style.display = 'block';
            })
            .catch(error => {
              console.error('Error searching cards:', error);
              document.getElementById('card-results').innerHTML = \`<div style="color: #ef4444;">Error: \${error.message}</div>\`;
              document.getElementById('card-results').style.display = 'block';
            });
          }
          
          function showCardPreview(cardId) {
            fetch(\`\${API_BASE}/api/cards/\${cardId}\`)
            .then(response => response.json())
            .then(card => {
              currentCardData = card;
              
              document.getElementById('card-image').src = card.images.large;
              
              let detailsHtml = \`
                <h4>\${card.name}</h4>
                <p><strong>Set:</strong> \${card.set.name} (\${card.set.series})</p>
                <p><strong>Number:</strong> \${card.number || 'N/A'}</p>
                <p><strong>Rarity:</strong> \${card.rarity || 'N/A'}</p>
              \`;
              
              document.getElementById('card-details').innerHTML = detailsHtml;
              document.getElementById('card-preview').style.display = 'block';
            })
            .catch(error => {
              console.error('Error fetching card details:', error);
            });
          }
          
          function loadSets() {
            // Also populate the set filter dropdown
            const setFilter = document.getElementById('set-filter');
            if (setFilter.options.length <= 1) {
              getSets(true);
            }
          }
          
          function getSets(populateDropdown = false) {
            fetch(\`\${API_BASE}/api/sets\`)
            .then(response => response.json())
            .then(data => {
              if (populateDropdown) {
                const setFilter = document.getElementById('set-filter');
                
                // Clear existing options except the first one
                while (setFilter.options.length > 1) {
                  setFilter.remove(1);
                }
                
                // Add new options
                data.forEach(set => {
                  const option = document.createElement('option');
                  option.value = set.id;
                  option.text = \`\${set.name} (\${set.series})\`;
                  setFilter.appendChild(option);
                });
              } else {
                const resultsDiv = document.getElementById('sets-results');
                
                let html = '<ul style="list-style-type: none; padding: 0;">';
                data.forEach(set => {
                  html += \`
                    <li style="margin-bottom: 0.5rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>\${set.name} - \${set.series}</span>
                      </div>
                    </li>
                  \`;
                });
                html += '</ul>';
                
                resultsDiv.innerHTML = html;
                resultsDiv.style.display = 'block';
              }
            })
            .catch(error => {
              console.error('Error fetching sets:', error);
              if (!populateDropdown) {
                document.getElementById('sets-results').innerHTML = \`<div style="color: #ef4444;">Error: \${error.message}</div>\`;
                document.getElementById('sets-results').style.display = 'block';
              }
            });
          }
          
          function updateGridPreview() {
            const gridSize = parseInt(document.getElementById('preview-grid-size').value);
            const gridPreview = document.getElementById('grid-preview');
            
            // Clear existing grid
            gridPreview.innerHTML = '';
            
            // Update grid style based on size
            if (gridSize === 4) {
              gridPreview.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else if (gridSize === 9) {
              gridPreview.style.gridTemplateColumns = 'repeat(3, 1fr)';
            } else if (gridSize === 12) {
              gridPreview.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }
            
            // Add grid items
            for (let i = 0; i < gridSize; i++) {
              const gridItem = document.createElement('div');
              gridItem.className = 'grid-item';
              gridItem.textContent = \`Position \${i + 1}\`;
              gridPreview.appendChild(gridItem);
            }
          }
          
          // Initialize
          loadSets();
          updateGridPreview();
        </script>
      </body>
      </html>
    `);
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
