import { albums, pages, type Album, type InsertAlbum, type Page, type InsertPage, type PokemonCard } from "@shared/schema";

export interface IStorage {
  // Album operations
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbum(id: number): Promise<Album | undefined>;
  updateAlbumGridSize(id: number, gridSize: number): Promise<Album>;
  
  // Page operations
  createPage(page: InsertPage): Promise<Page>;
  getPage(albumId: number, pageNumber: number): Promise<Page | undefined>;
  updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page>;
  
  // Pokemon TCG API operations
  searchCards(query: string): Promise<PokemonCard[]>;
  getCard(id: string): Promise<PokemonCard | undefined>;
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

    const updatedPage = { ...page, cards };
    this.pages.set(id, updatedPage);
    return updatedPage;
  }

  async searchCards(query: string): Promise<PokemonCard[]> {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:${query}*`
    );
    const data = await response.json();
    const cards = data.data as PokemonCard[];
    
    // Cache the cards
    cards.forEach(card => this.cardCache.set(card.id, card));
    
    return cards;
  }

  async getCard(id: string): Promise<PokemonCard | undefined> {
    if (this.cardCache.has(id)) {
      return this.cardCache.get(id);
    }

    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${id}`);
    if (!response.ok) return undefined;
    
    const data = await response.json();
    const card = data.data as PokemonCard;
    this.cardCache.set(id, card);
    return card;
  }
}

export const storage = new MemStorage();