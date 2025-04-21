import { albums, pages, type Album, type InsertAlbum, type Page, type InsertPage, type PokemonCard } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Album operations
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbum(id: number): Promise<Album | undefined>;
  getAllAlbums(): Promise<Album[]>;
  updateAlbumGridSize(id: number, gridSize: number): Promise<Album>;
  
  // Page operations
  createPage(page: InsertPage): Promise<Page>;
  getPage(albumId: number, pageNumber: number): Promise<Page | undefined>;
  updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page>;
  
  // Pokemon TCG API operations
  searchCards(query: string, setId?: string): Promise<PokemonCard[]>;
  getCard(id: string): Promise<PokemonCard | undefined>;
  getSets(): Promise<Array<{id: string; name: string; series: string}>>;
}

export class MemStorage implements IStorage {
  private albums: Map<number, Album>;
  private pages: Map<number, Page>;
  private currentAlbumId: number;
  private currentPageId: number;
  private cardCache: Map<string, PokemonCard>;

  constructor() {
    this.albums = new Map();
    this.pages = new Map();
    this.cardCache = new Map();
    this.currentAlbumId = 1;
    this.currentPageId = 1;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const id = this.currentAlbumId++;
    const newAlbum = { ...album, id };
    this.albums.set(id, newAlbum);
    return newAlbum;
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }
  
  async getAllAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async updateAlbumGridSize(id: number, gridSize: number): Promise<Album> {
    const album = await this.getAlbum(id);
    if (!album) throw new Error("Album not found");
    
    const updatedAlbum = { ...album, gridSize };
    this.albums.set(id, updatedAlbum);
    return updatedAlbum;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const id = this.currentPageId++;
    const newPage = { ...page, id };
    this.pages.set(id, newPage);
    return newPage;
  }

  async getPage(albumId: number, pageNumber: number): Promise<Page | undefined> {
    return Array.from(this.pages.values()).find(
      (page) => page.albumId === albumId && page.pageNumber === pageNumber
    );
  }

  async updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page> {
    const page = this.pages.get(id);
    if (!page) throw new Error("Page not found");
    
    // Debug to see what's being sent
    console.log(`Updating page ${id} cards:`, JSON.stringify(cards));
    
    // Make sure to maintain all the cards
    const existingCards = page.cards.filter(card => card !== null);
    
    // Determine which cards to keep from existing cards (ones not being modified)
    const cardsToKeep = existingCards.filter(existingCard => {
      if (!existingCard) return false;
      
      // Keep cards whose positions aren't being updated in the new array
      return !cards.some(newCard => 
        newCard && newCard.position === existingCard.position
      );
    });
    
    // Combine the kept cards with the new ones
    const combinedCards = [...cardsToKeep, ...cards.filter(card => card !== null)];
    
    console.log(`Updated cards array:`, JSON.stringify(combinedCards));
    
    const updatedPage = { ...page, cards: combinedCards };
    this.pages.set(id, updatedPage);
    return updatedPage;
  }

  async searchCards(query: string, setId?: string): Promise<PokemonCard[]> {
    // Construct the API query parameters
    let apiQuery = '';
    
    // Check if query is numeric to enable searching by card number when a set is specified
    const isNumeric = /^\d+$/.test(query);
    
    if (setId && isNumeric) {
      // If we have a set ID and the query is a number, search by card number within that set
      apiQuery = `number:${query} set.id:${setId}`;
    } else {
      // Otherwise, use name search with wildcard
      apiQuery = `name:${query}*`;
      
      // Add set filter if provided
      if (setId) {
        apiQuery += ` set.id:${setId}`;
      }
    }
    
    console.log(`Searching cards with query: ${apiQuery}`);
    
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&orderBy=set.releaseDate,number&page=1&pageSize=20`,
      { headers }
    );
    
    const data = await response.json();

    // Ensure 'data' exists and is an array
    const cards = data?.data || [];
    if (!Array.isArray(cards)) {
      console.error("Unexpected API response format:", data);
      return []
    }
        
    // Cache the cards
    cards.forEach(card => this.cardCache.set(card.id, card));
    
    return cards;
  }
  
  // Method to get all available sets
  async getSets(): Promise<Array<{id: string; name: string; series: string}>> {
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets',
      { headers }
    );
    
    const data = await response.json();
    
    // Ensure 'data' exists and is an array
    const sets = data?.data || [];
    if (!Array.isArray(sets)) {
      console.error("Unexpected API response format for sets:", data);
      return [];
    }
    
    // Sort sets by release date (newest first)
    return sets.sort((a: any, b: any) => {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  }

  async getCard(id: string): Promise<PokemonCard | undefined> {
    if (this.cardCache.has(id)) {
      return this.cardCache.get(id);
    }

    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };

    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards/${id}`,
      { headers }
    );
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    const card = data.data as PokemonCard;
    this.cardCache.set(id, card);
    return card;
  }
}

export class DatabaseStorage implements IStorage {
  private cardCache: Map<string, PokemonCard>;

  constructor() {
    this.cardCache = new Map();
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [createdAlbum] = await db.insert(albums).values(album).returning();
    return createdAlbum;
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }
  
  async getAllAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async updateAlbumGridSize(id: number, gridSize: number): Promise<Album> {
    const [updatedAlbum] = await db
      .update(albums)
      .set({ gridSize })
      .where(eq(albums.id, id))
      .returning();
    
    if (!updatedAlbum) throw new Error("Album not found");
    return updatedAlbum;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const [createdPage] = await db.insert(pages).values(page).returning();
    return createdPage;
  }

  async getPage(albumId: number, pageNumber: number): Promise<Page | undefined> {
    const [page] = await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.albumId, albumId),
          eq(pages.pageNumber, pageNumber)
        )
      );
    return page;
  }

  async updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page> {
    // Debug to see what's being sent
    console.log(`Updating page ${id} cards:`, JSON.stringify(cards));
    
    // Get the existing page
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    if (!page) throw new Error("Page not found");
    
    // Filter out null values from the cards array
    const nonNullCards = cards.filter(card => card !== null) as Array<{position: number; cardId: string}>;
    
    // Update the page with the new cards
    const [updatedPage] = await db
      .update(pages)
      .set({ cards: nonNullCards })
      .where(eq(pages.id, id))
      .returning();
    
    return updatedPage;
  }

  async searchCards(query: string, setId?: string): Promise<PokemonCard[]> {
    // Construct the API query parameters
    let apiQuery = '';
    
    // Check if query is numeric to enable searching by card number when a set is specified
    const isNumeric = /^\d+$/.test(query);
    
    if (setId && isNumeric) {
      // If we have a set ID and the query is a number, search by card number within that set
      apiQuery = `number:${query} set.id:${setId}`;
    } else {
      // Otherwise, use name search with wildcard
      apiQuery = `name:${query}*`;
      
      // Add set filter if provided
      if (setId) {
        apiQuery += ` set.id:${setId}`;
      }
    }
    
    console.log(`Searching cards with query: ${apiQuery}`);
    
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&orderBy=set.releaseDate,number&page=1&pageSize=20`,
      { headers }
    );
    
    const data = await response.json();

    // Ensure 'data' exists and is an array
    const cards = data?.data || [];
    if (!Array.isArray(cards)) {
      console.error("Unexpected API response format:", data);
      return []
    }
        
    // Cache the cards
    cards.forEach(card => this.cardCache.set(card.id, card));
    
    return cards;
  }
  
  // Method to get all available sets
  async getSets(): Promise<Array<{id: string; name: string; series: string}>> {
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets',
      { headers }
    );
    
    const data = await response.json();
    
    // Ensure 'data' exists and is an array
    const sets = data?.data || [];
    if (!Array.isArray(sets)) {
      console.error("Unexpected API response format for sets:", data);
      return [];
    }
    
    // Sort sets by release date (newest first)
    return sets.sort((a: any, b: any) => {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  }

  async getCard(id: string): Promise<PokemonCard | undefined> {
    if (this.cardCache.has(id)) {
      return this.cardCache.get(id);
    }

    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };

    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards/${id}`,
      { headers }
    );
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    const card = data.data as PokemonCard;
    this.cardCache.set(id, card);
    return card;
  }
}

// Use DatabaseStorage instead of MemStorage since we have a database now
export const storage = new DatabaseStorage();