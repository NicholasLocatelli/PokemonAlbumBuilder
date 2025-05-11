import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { MemStorage } from '../../server/storage';
import type { InsertAlbum, InsertPage } from '../../shared/schema';

// Mock request and response objects
type MockRequest = {
  params: Record<string, any>;
  body: Record<string, any>;
  query: Record<string, any>;
  session: Record<string, any>;
  isAuthenticated: ReturnType<typeof vi.fn>;
  user: { id: number; username: string; displayName: string } | undefined;
};

function createMockReq(params = {}, body = {}, query = {}): MockRequest {
  return {
    params,
    body,
    query,
    session: {},
    isAuthenticated: vi.fn().mockReturnValue(false),
    user: undefined
  };
}

function createMockAuthReq(userId = 1, username = 'testuser'): MockRequest {
  return {
    params: {},
    body: {},
    query: {},
    session: {},
    isAuthenticated: vi.fn().mockReturnValue(true),
    user: { id: userId, username, displayName: username }
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

// Sample API handlers to test
async function createAlbum(req: MockRequest | Request, res: Response, storage: MemStorage) {
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
      // Allow access to user's own albums or demo albums
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

describe('API Security Tests', () => {
  let storage: MemStorage;
  
  beforeEach(() => {
    storage = new MemStorage();
    vi.clearAllMocks();
  });
  
  // Test suite for authentication protection
  describe('Authentication Protection', () => {
    it('should prevent unauthenticated users from creating albums', async () => {
      const req = createMockReq({}, { name: 'Test Album', gridSize: 9 });
      const res = createMockRes();
      
      await createAlbum(req, res, storage);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
    
    it('should allow authenticated users to create albums', async () => {
      const req = createMockAuthReq(1, 'testuser');
      req.body = { name: 'Test Album', gridSize: 9 };
      const res = createMockRes();
      
      await createAlbum(req, res, storage);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should protect albums from unauthorized access', async () => {
      // Create a test album for user 1
      const album = await storage.createAlbum({ 
        name: 'Private Album', 
        gridSize: 9, 
        userId: 1,
        coverColor: '#2563eb'
      } as InsertAlbum);
      
      // Try to access with user 2
      const req = createMockAuthReq(2, 'otheruser');
      req.params = { id: album.id.toString() };
      const res = createMockRes();
      
      await getAlbum(req, res, storage);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
    
    it('should allow access to user\'s own albums', async () => {
      // Create a test album for user 1
      const album = await storage.createAlbum({ 
        name: 'My Album', 
        gridSize: 9, 
        userId: 1,
        coverColor: '#2563eb'
      } as InsertAlbum);
      
      // Access with correct user
      const req = createMockAuthReq(1, 'testuser');
      req.params = { id: album.id.toString() };
      const res = createMockRes();
      
      await getAlbum(req, res, storage);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Album',
        userId: 1
      }));
    });
    
    it('should allow unauthenticated access only to public albums', async () => {
      // Create a public demo album (userId = 0)
      const publicAlbum = await storage.createAlbum({ 
        name: 'Public Demo', 
        gridSize: 9, 
        userId: 0,
        coverColor: '#2563eb'
      } as InsertAlbum);
      
      // Create a private album
      const privateAlbum = await storage.createAlbum({ 
        name: 'Private Album', 
        gridSize: 9, 
        userId: 1,
        coverColor: '#2563eb'
      } as InsertAlbum);
      
      // Test public album access with unauthenticated request
      const publicReq = createMockReq({ id: publicAlbum.id.toString() });
      const publicRes = createMockRes();
      
      await getAlbum(publicReq, publicRes, storage);
      
      expect(publicRes.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Public Demo',
        userId: 0
      }));
      
      // Test private album access with unauthenticated request
      const privateReq = createMockReq({ id: privateAlbum.id.toString() });
      const privateRes = createMockRes();
      
      await getAlbum(privateReq, privateRes, storage);
      
      expect(privateRes.status).toHaveBeenCalledWith(403);
      expect(privateRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });
  
  // Test suite for input validation
  describe('Input Validation', () => {
    it('should validate required fields when creating albums', async () => {
      // Missing required fields
      const req = createMockAuthReq();
      req.body = { name: 'Test Album' }; // Missing gridSize
      const res = createMockRes();
      
      await createAlbum(req, res, storage);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });
    
    it('should handle non-existent albums gracefully', async () => {
      const req = createMockAuthReq();
      req.params = { id: '9999' }; // Non-existent album
      const res = createMockRes();
      
      await getAlbum(req, res, storage);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Album not found' });
    });
  });
});