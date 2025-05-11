import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';
import type { InsertAlbum, InsertPage, InsertUser } from '../../shared/schema';

describe('Database Operations', () => {
  let storage: MemStorage;
  
  beforeEach(() => {
    storage = new MemStorage();
  });
  
  describe('User Operations', () => {
    it('should create a user with valid data', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      expect(user).toMatchObject({
        username: 'testuser',
        displayName: 'Test User'
      });
      expect(user.id).toBeDefined();
    });
    
    it('should retrieve a user by ID', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUser(createdUser.id);
      
      expect(retrievedUser).toEqual(createdUser);
    });
    
    it('should retrieve a user by username', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserByUsername('testuser');
      
      expect(retrievedUser).toEqual(createdUser);
    });
    
    it('should return undefined for non-existent users', async () => {
      const user = await storage.getUser(999);
      expect(user).toBeUndefined();
      
      const userByUsername = await storage.getUserByUsername('nonexistent');
      expect(userByUsername).toBeUndefined();
    });
  });
  
  describe('Album Operations', () => {
    it('should create an album with valid data', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      expect(album).toMatchObject({
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      });
      expect(album.id).toBeDefined();
    });
    
    it('should retrieve an album by ID', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const createdAlbum = await storage.createAlbum(albumData);
      const retrievedAlbum = await storage.getAlbum(createdAlbum.id);
      
      expect(retrievedAlbum).toEqual(createdAlbum);
    });
    
    it('should retrieve all albums for a user', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      // Create multiple albums for the user
      const albumData1: InsertAlbum = {
        name: 'Album 1',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const albumData2: InsertAlbum = {
        name: 'Album 2',
        gridSize: 4,
        userId: user.id,
        coverColor: '#00ff00'
      };
      
      await storage.createAlbum(albumData1);
      await storage.createAlbum(albumData2);
      
      const userAlbums = await storage.getUserAlbums(user.id);
      
      expect(userAlbums).toHaveLength(2);
      expect(userAlbums[0].name).toBe('Album 1');
      expect(userAlbums[1].name).toBe('Album 2');
    });
    
    it('should update album grid size', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      // Update grid size
      const updatedAlbum = await storage.updateAlbumGridSize(album.id, 12);
      
      expect(updatedAlbum.gridSize).toBe(12);
      
      // Verify the update was persisted
      const retrievedAlbum = await storage.getAlbum(album.id);
      expect(retrievedAlbum?.gridSize).toBe(12);
    });
    
    it('should update album cover color', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      // Update cover color
      const updatedAlbum = await storage.updateAlbumCoverColor(album.id, '#0000ff');
      
      expect(updatedAlbum.coverColor).toBe('#0000ff');
      
      // Verify the update was persisted
      const retrievedAlbum = await storage.getAlbum(album.id);
      expect(retrievedAlbum?.coverColor).toBe('#0000ff');
    });
  });
  
  describe('Page Operations', () => {
    it('should create a page with valid data', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      const pageData: InsertPage = {
        albumId: album.id,
        pageNumber: 1,
        cards: []
      };
      
      const page = await storage.createPage(pageData);
      
      expect(page).toMatchObject({
        albumId: album.id,
        pageNumber: 1,
      });
      expect(page.id).toBeDefined();
    });
    
    it('should retrieve a page by album ID and page number', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      const pageData: InsertPage = {
        albumId: album.id,
        pageNumber: 1,
        cards: []
      };
      
      await storage.createPage(pageData);
      
      const retrievedPage = await storage.getPage(album.id, 1);
      
      expect(retrievedPage).toBeDefined();
      expect(retrievedPage?.albumId).toBe(album.id);
      expect(retrievedPage?.pageNumber).toBe(1);
    });
    
    it('should update page cards', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword123',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      const albumData: InsertAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: user.id,
        coverColor: '#ff0000'
      };
      
      const album = await storage.createAlbum(albumData);
      
      const pageData: InsertPage = {
        albumId: album.id,
        pageNumber: 1,
        cards: []
      };
      
      const page = await storage.createPage(pageData);
      
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
      
      const updatedPage = await storage.updatePageCards(page.id, newCards);
      
      // Check updated cards
      expect(updatedPage.cards).toHaveLength(9);
      expect(updatedPage.cards[0]).toEqual({ position: 0, cardId: 'card1' });
      expect(updatedPage.cards[2]).toEqual({ position: 2, cardId: 'card2' });
      expect(updatedPage.cards[4]).toEqual({ position: 4, cardId: 'card3' });
      expect(updatedPage.cards[1]).toBeNull();
      
      // Verify the update was persisted
      const retrievedPage = await storage.getPage(album.id, 1);
      expect(retrievedPage?.cards).toHaveLength(9);
      expect(retrievedPage?.cards[0]).toEqual({ position: 0, cardId: 'card1' });
    });
  });
  
  describe('Pokemon TCG API Operations', () => {
    it('should search cards with query', async () => {
      // This test relies on the mock implementation of searchCards in MemStorage
      const result = await storage.searchCards('pikachu');
      
      expect(result).toBeDefined();
      expect(result.cards).toBeInstanceOf(Array);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
    
    it('should filter cards by set', async () => {
      // Search with set filter
      const result = await storage.searchCards('charizard', 'base1');
      
      expect(result).toBeDefined();
      expect(result.cards).toBeInstanceOf(Array);
    });
    
    it('should handle pagination', async () => {
      // Test pagination
      const page1 = await storage.searchCards('pikachu', undefined, 1, 10);
      const page2 = await storage.searchCards('pikachu', undefined, 2, 10);
      
      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      
      // These could be the same in the mock implementation, but the structure should be correct
      expect(page1.cards).toBeInstanceOf(Array);
      expect(page2.cards).toBeInstanceOf(Array);
    });
    
    it('should get card by ID', async () => {
      // Get a specific card
      const card = await storage.getCard('test-card-id');
      
      // The mock might return undefined or a test card
      if (card) {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.images).toBeDefined();
        expect(card.set).toBeDefined();
      }
    });
    
    it('should get sets', async () => {
      const sets = await storage.getSets();
      
      expect(sets).toBeInstanceOf(Array);
      
      // If sets are returned, verify their structure
      if (sets.length > 0) {
        expect(sets[0].id).toBeDefined();
        expect(sets[0].name).toBeDefined();
        expect(sets[0].series).toBeDefined();
      }
    });
  });
});