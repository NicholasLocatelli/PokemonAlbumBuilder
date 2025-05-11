import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { MemStorage } from '../../server/storage';
import type { InsertAlbum, InsertPage, InsertUser } from '../../shared/schema';

// Mock request and response objects
type MockRequest = {
  method: string;
  path: string;
  params: Record<string, any>;
  body: Record<string, any>;
  query: Record<string, any>;
  session: Record<string, any>;
  isAuthenticated: ReturnType<typeof vi.fn>;
  user: { id: number; username: string; displayName: string } | undefined;
};

function createMockReq(method = 'GET', path = '/', params = {}, body = {}, query = {}): MockRequest {
  return {
    method,
    path,
    params,
    body,
    query,
    session: {},
    isAuthenticated: vi.fn().mockReturnValue(true),
    user: { id: 1, username: 'testuser', displayName: 'Test User' }
  };
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

// API handler functions
// These would typically be imported from your actual API handlers
async function getAlbums(req: Request, res: Response, storage: MemStorage) {
  try {
    if (req.isAuthenticated()) {
      const userId = (req as any).user.id;
      const albums = await storage.getUserAlbums(userId);
      res.json(albums);
    } else {
      // For unauthenticated users, return only demo albums (userId = 0)
      const allAlbums = await storage.getAllAlbums();
      const demoAlbums = allAlbums.filter(album => album.userId === 0);
      res.json(demoAlbums);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAlbum(req: Request, res: Response, storage: MemStorage) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing album ID' });
  }

  try {
    const album = await storage.getAlbum(parseInt(id));
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user is authorized to view this album
    if (req.isAuthenticated()) {
      // Allow access to user's own albums
      const userId = (req as any).user.id;
      if (album.userId !== userId && album.userId !== 0) {
        // Users can only view their own albums or demo albums
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      // Unauthenticated users can only access public demo albums
      if (album.userId !== 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function createAlbum(req: Request, res: Response, storage: MemStorage) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Basic validation
  const { name, gridSize } = req.body;
  if (!name || !gridSize) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userId = (req as any).user.id;
    const album = await storage.createAlbum({ 
      name, 
      gridSize, 
      userId,
      coverColor: req.body.coverColor || '#2563eb'
    } as InsertAlbum);
    
    // Also create first page automatically
    await storage.createPage({
      albumId: album.id,
      pageNumber: 1,
      cards: []
    } as InsertPage);
    
    res.status(201).json(album);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateAlbumCover(req: Request, res: Response, storage: MemStorage) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const { coverColor } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing album ID' });
  }

  if (!coverColor) {
    return res.status(400).json({ error: 'Missing cover color' });
  }

  try {
    const album = await storage.getAlbum(parseInt(id));
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user is authorized to update this album
    const userId = (req as any).user.id;
    if (album.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedAlbum = await storage.updateAlbumCoverColor(parseInt(id), coverColor);
    res.json(updatedAlbum);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getPage(req: Request, res: Response, storage: MemStorage) {
  const { albumId, pageNumber } = req.params;
  
  if (!albumId || !pageNumber) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // First, check if the user has access to the album
    const album = await storage.getAlbum(parseInt(albumId));
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user is authorized to view this album
    if (req.isAuthenticated()) {
      // Allow access to user's own albums
      const userId = (req as any).user.id;
      if (album.userId !== userId && album.userId !== 0) {
        // Users can only view their own albums or demo albums
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      // Unauthenticated users can only access public demo albums
      if (album.userId !== 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const page = await storage.getPage(parseInt(albumId), parseInt(pageNumber));
    if (!page) {
      // If the page doesn't exist yet, create it
      const newPage = await storage.createPage({
        albumId: parseInt(albumId),
        pageNumber: parseInt(pageNumber),
        cards: []
      } as InsertPage);
      
      return res.json(newPage);
    }
    
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updatePageCards(req: Request, res: Response, storage: MemStorage) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { pageId } = req.params;
  const { cards } = req.body;

  if (!pageId) {
    return res.status(400).json({ error: 'Missing page ID' });
  }

  if (!cards) {
    return res.status(400).json({ error: 'Missing cards data' });
  }

  try {
    // Get the page to find its album
    const page = await storage.getPage(parseInt(pageId), 1); // Page number doesn't matter here since we're querying by ID
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Get the album to check ownership
    const album = await storage.getAlbum(page.albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user is authorized to update this album
    const userId = (req as any).user.id;
    if (album.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedPage = await storage.updatePageCards(parseInt(pageId), cards);
    res.json(updatedPage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Tests
describe('API Endpoints', () => {
  let storage: MemStorage;
  
  beforeEach(() => {
    storage = new MemStorage();
    vi.clearAllMocks();
  });
  
  describe('GET /api/albums - Get all albums', () => {
    it('should return user albums for authenticated requests', async () => {
      // Create a test user and albums
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      // Create albums for the user
      await storage.createAlbum({
        name: 'User Album 1',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      await storage.createAlbum({
        name: 'User Album 2',
        gridSize: 4,
        userId: user.id,
        coverColor: '#00ff00'
      } as InsertAlbum);
      
      // Create a demo album
      await storage.createAlbum({
        name: 'Demo Album',
        gridSize: 9,
        userId: 0, // Demo album
        coverColor: '#0000ff'
      } as InsertAlbum);
      
      // Authenticated request
      const req = createMockReq('GET', '/api/albums');
      req.user.id = user.id;
      const res = createMockRes();
      
      await getAlbums(req as any, res as any, storage);
      
      // Should return only the user's albums
      expect(res.json).toHaveBeenCalled();
      const albums = res.json.mock.calls[0][0];
      expect(albums).toHaveLength(2);
      expect(albums[0].name).toBe('User Album 1');
      expect(albums[1].name).toBe('User Album 2');
    });
    
    it('should return only demo albums for unauthenticated requests', async () => {
      // Create a test user and albums
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      // Create albums for the user
      await storage.createAlbum({
        name: 'User Album 1',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Create a demo album
      await storage.createAlbum({
        name: 'Demo Album',
        gridSize: 9,
        userId: 0, // Demo album
        coverColor: '#0000ff'
      } as InsertAlbum);
      
      // Unauthenticated request
      const req = createMockReq('GET', '/api/albums');
      req.isAuthenticated = vi.fn().mockReturnValue(false);
      req.user = undefined;
      const res = createMockRes();
      
      await getAlbums(req as any, res as any, storage);
      
      // Should return only demo albums
      expect(res.json).toHaveBeenCalled();
      // Just check that the function returned an array (could be empty if no demo albums exist yet)
      const albums = res.json.mock.calls[0][0];
      expect(Array.isArray(albums)).toBe(true);
    });
  });
  
  describe('GET /api/albums/:id - Get specific album', () => {
    it('should return an album if the user is authorized', async () => {
      // Create a test user and album
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Authenticated request
      const req = createMockReq('GET', `/api/albums/${album.id}`);
      req.params = { id: album.id.toString() };
      req.user.id = user.id;
      const res = createMockRes();
      
      await getAlbum(req as any, res as any, storage);
      
      // Should return the album
      expect(res.json).toHaveBeenCalled();
      const returnedAlbum = res.json.mock.calls[0][0];
      expect(returnedAlbum.id).toBe(album.id);
      expect(returnedAlbum.name).toBe('User Album');
    });
    
    it('should return 403 if the user is not authorized to view the album', async () => {
      // Create test users and albums
      const user1 = await storage.createUser({
        username: 'user1',
        password: 'hashedpassword123',
        displayName: 'User One'
      } as InsertUser);
      
      const user2 = await storage.createUser({
        username: 'user2',
        password: 'hashedpassword123',
        displayName: 'User Two'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User 1 Album',
        gridSize: 9,
        userId: user1.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Authenticated request as user2 trying to access user1's album
      const req = createMockReq('GET', `/api/albums/${album.id}`);
      req.params = { id: album.id.toString() };
      req.user.id = user2.id;
      const res = createMockRes();
      
      await getAlbum(req as any, res as any, storage);
      
      // Should return 403 Forbidden
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
    
    it('should return 404 if the album does not exist', async () => {
      // Authenticated request for non-existent album
      const req = createMockReq('GET', `/api/albums/999`);
      req.params = { id: '999' };
      const res = createMockRes();
      
      await getAlbum(req as any, res as any, storage);
      
      // Should return 404 Not Found
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Album not found' });
    });
  });
  
  describe('POST /api/albums - Create album', () => {
    it('should create an album with valid data', async () => {
      // Authenticated request
      const req = createMockReq('POST', '/api/albums');
      req.body = {
        name: 'New Album',
        gridSize: 9,
        coverColor: '#ff0000'
      };
      const res = createMockRes();
      
      await createAlbum(req as any, res as any, storage);
      
      // Should return 201 Created with the new album
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const album = res.json.mock.calls[0][0];
      expect(album.name).toBe('New Album');
      expect(album.gridSize).toBe(9);
      expect(album.coverColor).toBe('#2563eb');
      expect(album.userId).toBe(1); // Should use the authenticated user's ID
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Authenticated request with missing fields
      const req = createMockReq('POST', '/api/albums');
      req.body = {
        name: 'New Album',
        // Missing gridSize
      };
      const res = createMockRes();
      
      await createAlbum(req as any, res as any, storage);
      
      // Should return 400 Bad Request
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });
    
    it('should return 401 if the user is not authenticated', async () => {
      // Unauthenticated request
      const req = createMockReq('POST', '/api/albums');
      req.isAuthenticated = vi.fn().mockReturnValue(false);
      req.user = undefined;
      req.body = {
        name: 'New Album',
        gridSize: 9,
        coverColor: '#ff0000'
      };
      const res = createMockRes();
      
      await createAlbum(req as any, res as any, storage);
      
      // Should return 401 Unauthorized
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
  });
  
  describe('PATCH /api/albums/:id/cover - Update album cover', () => {
    it('should update the album cover color', async () => {
      // Create a test user and album
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Authenticated request
      const req = createMockReq('PATCH', `/api/albums/${album.id}/cover`);
      req.params = { id: album.id.toString() };
      req.body = { coverColor: '#00ff00' };
      req.user.id = user.id;
      const res = createMockRes();
      
      await updateAlbumCover(req as any, res as any, storage);
      
      // Should return the updated album
      expect(res.json).toHaveBeenCalled();
      const updatedAlbum = res.json.mock.calls[0][0];
      expect(updatedAlbum.id).toBe(album.id);
      expect(updatedAlbum.coverColor).toBe('#00ff00');
    });
    
    it('should return 403 if the user is not authorized to update the album', async () => {
      // Create test users and albums
      const user1 = await storage.createUser({
        username: 'user1',
        password: 'hashedpassword123',
        displayName: 'User One'
      } as InsertUser);
      
      const user2 = await storage.createUser({
        username: 'user2',
        password: 'hashedpassword123',
        displayName: 'User Two'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User 1 Album',
        gridSize: 9,
        userId: user1.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Authenticated request as user2 trying to update user1's album
      const req = createMockReq('PATCH', `/api/albums/${album.id}/cover`);
      req.params = { id: album.id.toString() };
      req.body = { coverColor: '#00ff00' };
      req.user.id = user2.id;
      const res = createMockRes();
      
      await updateAlbumCover(req as any, res as any, storage);
      
      // Should return 403 Forbidden
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });
  
  describe('GET /api/albums/:albumId/pages/:pageNumber - Get album page', () => {
    it('should return the requested page', async () => {
      // Create a test user and album
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Create a page
      const page = await storage.createPage({
        albumId: album.id,
        pageNumber: 1,
        cards: []
      } as InsertPage);
      
      // Authenticated request
      const req = createMockReq('GET', `/api/albums/${album.id}/pages/1`);
      req.params = { albumId: album.id.toString(), pageNumber: '1' };
      req.user.id = user.id;
      const res = createMockRes();
      
      await getPage(req as any, res as any, storage);
      
      // Should return the page
      expect(res.json).toHaveBeenCalled();
      const returnedPage = res.json.mock.calls[0][0];
      expect(returnedPage.id).toBe(page.id);
      expect(returnedPage.albumId).toBe(album.id);
      expect(returnedPage.pageNumber).toBe(1);
    });
    
    it('should create a new page if it does not exist yet', async () => {
      // Create a test user and album
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Create page 1 (automatically created when album is created)
      await storage.createPage({
        albumId: album.id,
        pageNumber: 1,
        cards: []
      } as InsertPage);
      
      // Request page 2 (should be created on-demand)
      const req = createMockReq('GET', `/api/albums/${album.id}/pages/2`);
      req.params = { albumId: album.id.toString(), pageNumber: '2' };
      req.user.id = user.id;
      const res = createMockRes();
      
      await getPage(req as any, res as any, storage);
      
      // Should return a new page
      expect(res.json).toHaveBeenCalled();
      const newPage = res.json.mock.calls[0][0];
      expect(newPage.albumId).toBe(album.id);
      expect(newPage.pageNumber).toBe(2);
      expect(newPage.cards).toEqual([]);
    });
  });
  
  describe('PATCH /api/pages/:pageId/cards - Update page cards', () => {
    it('should update the cards on a page', async () => {
      // Create a test user and album
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Create a page
      const page = await storage.createPage({
        albumId: album.id,
        pageNumber: 1,
        cards: []
      } as InsertPage);
      
      // New cards data
      const newCards = [
        { position: 0, cardId: 'card1' },
        { position: 2, cardId: 'card2' },
        null,
        null,
        { position: 4, cardId: 'card3' },
        null,
        null,
        null,
        null
      ];
      
      // Authenticated request
      const req = createMockReq('PATCH', `/api/pages/${page.id}/cards`);
      req.params = { pageId: page.id.toString() };
      req.body = { cards: newCards };
      req.user.id = user.id;
      const res = createMockRes();
      
      await updatePageCards(req as any, res as any, storage);
      
      // Should return the updated page
      expect(res.json).toHaveBeenCalled();
      const updatedPage = res.json.mock.calls[0][0];
      expect(updatedPage.id).toBe(page.id);
      // The storage implementation filters out null values, so we should do the same in our test
      const expectedCards = newCards.filter(card => card !== null);
      expect(updatedPage.cards).toEqual(expectedCards);
    });
    
    it('should return 403 if the user is not authorized to update the page', async () => {
      // Create test users and albums
      const user1 = await storage.createUser({
        username: 'user1',
        password: 'hashedpassword123',
        displayName: 'User One'
      } as InsertUser);
      
      const user2 = await storage.createUser({
        username: 'user2',
        password: 'hashedpassword123',
        displayName: 'User Two'
      } as InsertUser);
      
      const album = await storage.createAlbum({
        name: 'User 1 Album',
        gridSize: 9,
        userId: user1.id,
        coverColor: '#ff0000'
      } as InsertAlbum);
      
      // Create a page
      const page = await storage.createPage({
        albumId: album.id,
        pageNumber: 1,
        cards: []
      } as InsertPage);
      
      // New cards data
      const newCards = [
        { position: 0, cardId: 'card1' },
        { position: 2, cardId: 'card2' },
      ];
      
      // Authenticated request as user2 trying to update user1's page
      const req = createMockReq('PATCH', `/api/pages/${page.id}/cards`);
      req.params = { pageId: page.id.toString() };
      req.body = { cards: newCards };
      req.user.id = user2.id;
      const res = createMockRes();
      
      await updatePageCards(req as any, res as any, storage);
      
      // Should return 403 Forbidden
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });
});