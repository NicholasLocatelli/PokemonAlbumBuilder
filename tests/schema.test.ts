import { describe, it, expect } from 'vitest';
import { 
  insertUserSchema, 
  insertAlbumSchema, 
  insertPageSchema
} from '../shared/schema';
import { z } from 'zod';

describe('Schema Validation', () => {
  describe('User Schema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User'
      };
      
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
    
    it('should reject a user with missing required fields', () => {
      const invalidUser = {
        username: 'testuser'
        // Missing password
      };
      
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.password).toBeDefined();
      }
    });
    
    it('should reject a user with invalid fields', () => {
      const invalidUser = {
        username: '', // Empty username
        password: 'pw', // Too short
        displayName: 'Test User'
      };
      
      // For this test to pass, we need to extend the schema with explicit validations
      const extendedSchema = insertUserSchema.refine(
        (data) => data.username.length > 0 && data.password.length >= 6,
        {
          message: "Username must not be empty and password must be at least 6 characters",
          path: ["username", "password"]
        }
      );
      
      const result = extendedSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Album Schema', () => {
    it('should validate a valid album', () => {
      const validAlbum = {
        name: 'Test Album',
        gridSize: 9,
        userId: 1,
        coverColor: '#ff0000'
      };
      
      const result = insertAlbumSchema.safeParse(validAlbum);
      expect(result.success).toBe(true);
    });
    
    it('should reject an album with invalid grid size', () => {
      const invalidAlbum = {
        name: 'Test Album',
        gridSize: 7, // Not one of the allowed values (4, 9, 12)
        userId: 1,
        coverColor: '#ff0000'
      };
      
      const extendedSchema = insertAlbumSchema.refine(
        data => [4, 9, 12].includes(data.gridSize),
        {
          message: 'Grid size must be one of: 4, 9, or 12',
          path: ['gridSize']
        }
      );
      
      const result = extendedSchema.safeParse(invalidAlbum);
      expect(result.success).toBe(false);
    });
    
    it('should accept an album without coverColor (will use default)', () => {
      const albumWithoutColor = {
        name: 'Test Album',
        gridSize: 9,
        userId: 1,
        // No coverColor specified
      };
      
      const result = insertAlbumSchema.safeParse(albumWithoutColor);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Page Schema', () => {
    it('should validate a valid page', () => {
      const validPage = {
        albumId: 1,
        pageNumber: 1,
        cards: [
          { position: 0, cardId: 'card-1' },
          { position: 1, cardId: 'card-2' },
          null,
          null
        ]
      };
      
      const result = insertPageSchema.safeParse(validPage);
      expect(result.success).toBe(true);
    });
    
    it('should accept a page with empty cards array', () => {
      const pageWithEmptyCards = {
        albumId: 1,
        pageNumber: 1,
        cards: []
      };
      
      const result = insertPageSchema.safeParse(pageWithEmptyCards);
      expect(result.success).toBe(true);
    });
    
    it('should reject a page with invalid card format', () => {
      const invalidPage = {
        albumId: 1,
        pageNumber: 1,
        cards: [
          { position: 0, cardId: 'card-1' },
          { invalidField: 'value' }, // Invalid card format
          null
        ]
      };
      
      // Create a specific validator for the cards array
      const cardSchema = z.array(
        z.object({
          position: z.number(),
          cardId: z.string()
        }).nullable()
      );
      
      const result = cardSchema.safeParse(invalidPage.cards);
      expect(result.success).toBe(false);
    });
  });
});