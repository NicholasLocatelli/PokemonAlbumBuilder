import { 
  albums, 
  pages, 
  users, 
  emailVerificationTokens,
  passwordResetTokens,
  socialConnections,
  userActivityLog,
  type Album, 
  type InsertAlbum, 
  type Page, 
  type InsertPage, 
  type PokemonCard, 
  type User, 
  type InsertUser,
  type UpdateUser,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type SocialConnection,
  type InsertSocialConnection,
  type UserActivityLog,
  type InsertUserActivityLog
} from "@shared/schema";
import { db, pool, isDatabaseAvailable } from "./db";
import { eq, and, gt, lt, desc } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { createSafeSessionStore } from "./session-fix";

/**
 * Maps sort options to Pokemon TCG API orderBy parameters
 */
function getSortOrderBy(sortBy: string): string {
  const sortMappings: Record<string, string> = {
    'releaseDate': 'set.releaseDate,number',
    'releaseDateDesc': '-set.releaseDate,number'
  };
  
  return sortMappings[sortBy] || 'set.releaseDate,number';
}



/**
 * Creates an advanced API query string for the Pokémon TCG API
 * This handles special cases like regional variants (Galarian, Alolan, etc.)
 * and set-specific card numbers (PAL001, SV2-023, etc.)
 */
function createAdvancedApiQuery(query: string, setId?: string): string {
  // Check if query looks like a set-specific card number (e.g., PAL001, pal-001)
  // Matches patterns like: PAL001, pal-001, PAL-001, SV2-023, etc.
  const setSpecificRegex = /^([a-zA-Z]+)[-]?(\d+)$/;
  const setSpecificMatch = query.match(setSpecificRegex);
  
  if (setSpecificMatch) {
    // Extract the potential set code and number
    const [_, potentialSetPrefix, cardNumber] = setSpecificMatch;
    
    if (setId) {
      // If a set is already selected, just search by number in that set
      return `number:${cardNumber} set.id:${setId}`;
    } else {
      // Search by card number across all sets
      return `number:${cardNumber}`;
    }
  } 
  // Check if query is numeric for set-specific number search
  else if (setId && /^\d+$/.test(query)) {
    // If we have a set ID and the query is a number, search by card number within that set
    return `number:${query} set.id:${setId}`;
  } 
  // Handle searches for Pokémon variants like "Galarian Ponyta"
  else if (query.toLowerCase().includes('galarian') || 
           query.toLowerCase().includes('alolan') || 
           query.toLowerCase().includes('hisuian') ||
           query.toLowerCase().includes('paldean')) {
    // For regional variants, split query and search for each term
    const terms = query.split(' ').filter(term => term.length > 0);
    let apiQuery = terms.map(term => `name:${term}`).join(' ');
    
    // Add set filter if provided
    if (setId) {
      apiQuery += ` set.id:${setId}`;
    }
    
    return apiQuery;
  } 
  else {
    // For regular searches, use name search with wildcard
    let apiQuery = `name:${query}*`;

    // Add set filter if provided
    if (setId) {
      apiQuery += ` set.id:${setId}`;
    }
    
    return apiQuery;
  }
}

export interface IStorage {
  // Enhanced user operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  incrementFailedLoginAttempts(id: number): Promise<void>;
  resetFailedLoginAttempts(id: number): Promise<void>;
  lockUser(id: number, lockUntil: Date): Promise<void>;
  updateLastLogin(id: number): Promise<void>;
  deactivateUser(id: number): Promise<void>;
  deleteUser(id: number): Promise<void>;

  // Email verification operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(id: number): Promise<void>;
  deleteExpiredEmailVerificationTokens(): Promise<void>;

  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(id: number): Promise<void>;
  deletePasswordResetToken(id: number): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // Social connection operations
  createSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection>;
  getSocialConnections(userId: number): Promise<SocialConnection[]>;
  getSocialConnectionByProvider(userId: number, provider: string): Promise<SocialConnection | undefined>;
  deleteSocialConnection(id: number): Promise<void>;

  // Activity log operations
  logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivityLog(userId: number, limit?: number): Promise<UserActivityLog[]>;
  
  // Album operations
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbum(id: number): Promise<Album | undefined>;
  getAllAlbums(): Promise<Album[]>;
  getUserAlbums(userId: number): Promise<Album[]>;
  updateAlbumGridSize(id: number, gridSize: number): Promise<Album>;
  updateAlbumCoverColor(id: number, coverColor: string): Promise<Album>;
  
  // Page operations
  createPage(page: InsertPage): Promise<Page>;
  getPage(albumId: number, pageNumber: number): Promise<Page | undefined>;
  updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page>;
  
  // Pokemon TCG API operations
  searchCards(query: string, setId?: string, page?: number, pageSize?: number, sortBy?: string): Promise<{cards: PokemonCard[], totalCount: number}>;
  getCard(id: string): Promise<PokemonCard | undefined>;
  getSets(): Promise<Array<{id: string; name: string; series: string}>>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private albums: Map<number, Album>;
  private pages: Map<number, Page>;
  private users: Map<number, User>;
  private emailVerificationTokens: Map<number, EmailVerificationToken>;
  private passwordResetTokens: Map<number, PasswordResetToken>;
  private socialConnections: Map<number, SocialConnection>;
  private userActivityLogs: Map<number, UserActivityLog>;
  private currentAlbumId: number;
  private currentPageId: number;
  private currentUserId: number;
  private currentTokenId: number;
  private cardCache: Map<string, PokemonCard>;
  public sessionStore: session.Store;
  
  constructor() {
    this.albums = new Map();
    this.pages = new Map();
    this.users = new Map();
    this.emailVerificationTokens = new Map();
    this.passwordResetTokens = new Map();
    this.socialConnections = new Map();
    this.userActivityLogs = new Map();
    this.cardCache = new Map();
    this.currentAlbumId = 1;
    this.currentPageId = 1;
    this.currentUserId = 1;
    
    // Create a simple in-memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add a default test album
    const testAlbum: Album = {
      id: this.currentAlbumId++,
      name: "Test Album",
      gridSize: 9,
      userId: null,
      coverColor: "#2563eb",
      createdAt: new Date()
    };
    this.albums.set(testAlbum.id, testAlbum);
    
    // Add a default test page
    const testPage: Page = {
      id: this.currentPageId++,
      albumId: testAlbum.id,
      pageNumber: 1,
      cards: []
    };
    this.pages.set(testPage.id, testPage);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(user.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    
    const newUser: User = {
      id: this.currentUserId++,
      username: user.username,
      password: user.password,
      displayName: user.displayName || null,
      avatarUrl: null,
      createdAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserAlbums(userId: number): Promise<Album[]> {
    return Array.from(this.albums.values()).filter(album => album.userId === userId);
  }
  
  async createAlbum(album: InsertAlbum): Promise<Album> {
    const id = this.currentAlbumId++;
    const newAlbum: Album = { 
      id,
      name: album.name,
      gridSize: album.gridSize,
      userId: album.userId || null,
      coverColor: album.coverColor || "#2563eb",
      createdAt: new Date() 
    };
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
  
  async updateAlbumCoverColor(id: number, coverColor: string): Promise<Album> {
    const album = await this.getAlbum(id);
    if (!album) throw new Error("Album not found");
    
    const updatedAlbum = { ...album, coverColor };
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
    const existingCards = page.cards.filter((card: {position: number; cardId: string} | null) => card !== null);
    
    // Determine which cards to keep from existing cards (ones not being modified)
    const cardsToKeep = existingCards.filter((existingCard: {position: number; cardId: string}) => {
      if (!existingCard) return false;
      
      // Keep cards whose positions aren't being updated in the new array
      return !cards.some(newCard => 
        newCard && newCard.position === existingCard.position
      );
    });
    
    // Combine the kept cards with the new ones
    const combinedCards = [...cardsToKeep, ...cards.filter((card: {position: number; cardId: string} | null) => card !== null)];
    
    console.log(`Updated cards array:`, JSON.stringify(combinedCards));
    
    const updatedPage = { ...page, cards: combinedCards };
    this.pages.set(id, updatedPage);
    return updatedPage;
  }

  async searchCards(query: string, setId?: string, page: number = 1, pageSize: number = 20, sortBy: string = "releaseDate"): Promise<{cards: PokemonCard[], totalCount: number}> {
    // Use the advanced query builder to construct the API query
    const apiQuery = createAdvancedApiQuery(query, setId);
    
    const orderBy = getSortOrderBy(sortBy);
    console.log(`Searching cards with query: ${apiQuery}, page: ${page}, pageSize: ${pageSize}, sortBy: ${sortBy} (orderBy: ${orderBy})`);
    
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&orderBy=${orderBy}&page=${page}&pageSize=${pageSize}`,
      { headers }
    );
    
    const data = await response.json();
    
    // Ensure 'data' exists and is an array
    const cards = data?.data || [];
    if (!Array.isArray(cards)) {
      console.error("Unexpected API response format:", data);
      return { cards: [], totalCount: 0 };
    }
    
    // Cache the cards
    cards.forEach(card => this.cardCache.set(card.id, card));
    
    // Apply additional client-side sorting for better reliability on specific fields
    return {
      cards,
      totalCount: data.totalCount || cards.length
    };
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
  public sessionStore: session.Store;
  
  constructor() {
    this.cardCache = new Map();
    
    // Check if user wants to force memory sessions to avoid PostgreSQL session errors
    const forceMemorySessions = process.env.USE_MEMORY_SESSIONS === 'true';
    const isReplitEnvironment = process.env.REPL_ID || process.env.REPL_OWNER;
    
    if (forceMemorySessions || isReplitEnvironment) {
      // Use memory sessions (recommended to avoid "IDX_session_expire esiste già" errors)
      this.sessionStore = createSafeSessionStore();
      console.log("Using memory-only session store (PostgreSQL used only for data)");
      if (forceMemorySessions) {
        console.log("Memory sessions forced via USE_MEMORY_SESSIONS=true");
      }
    } else {
      // Try PostgreSQL sessions (user's choice, may cause errors in some environments)
      try {
        const PgSessionStore = connectPgSimple(session);
        this.sessionStore = new PgSessionStore({
          pool: pool as any,
          tableName: 'user_sessions',
          createTableIfMissing: true,
          schemaName: 'public'
        });
        console.log("Using PostgreSQL session store (may cause errors in some environments)");
      } catch (error) {
        console.warn("PostgreSQL session store failed, falling back to memory:", error);
        this.sessionStore = createSafeSessionStore();
      }
    }
  }
  
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    if (!db || !pool) {
      throw new Error("Pool missing for some reason");
    }
    
    try {
      const [createdUser] = await db.insert(users).values(user).returning();
      return createdUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Database error occurred while creating user");
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserAlbums(userId: number): Promise<Album[]> {
    if (!db) return [];
    try {
      return await db.select().from(albums).where(eq(albums.userId, userId));
    } catch (error) {
      // Handle the case where cover_color column doesn't exist
      if (error instanceof Error && error.message.includes('cover_color')) {
        console.warn('Warning: cover_color column not found in database. Please run npm run db:push to update schema.');
        // Fallback to a query that only selects columns that are known to exist
        const rawResults = await db.execute(
          `SELECT id, name, grid_size, user_id, created_at FROM albums WHERE user_id = $1`,
          [userId]
        );
        
        // Map the results to match the expected Album type
        return rawResults.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          gridSize: row.grid_size,
          userId: row.user_id,
          coverColor: '#2563eb', // Provide the default value
          createdAt: row.created_at
        }));
      }
      throw error;
    }
  }
  
  async createAlbum(album: InsertAlbum): Promise<Album> {
    if (!db) throw new Error("Database not available");
    const [createdAlbum] = await db.insert(albums).values(album).returning();
    return createdAlbum;
  }
  
  async getAlbum(id: number): Promise<Album | undefined> {
    if (!db) return undefined;
    try {
      const [album] = await db.select().from(albums).where(eq(albums.id, id));
      return album;
    } catch (error) {
      // Handle the case where cover_color column doesn't exist
      if (error instanceof Error && error.message.includes('cover_color')) {
        console.warn('Warning: cover_color column not found in database. Please run npm run db:push to update schema.');
        // Fallback to a query that only selects columns that are known to exist
        const rawResults = await db.execute(
          `SELECT id, name, grid_size, user_id, created_at FROM albums WHERE id = $1`,
          [id]
        );
        
        if (rawResults.rows.length === 0) return undefined;
        
        // Map the result to match the expected Album type
        const row: any = rawResults.rows[0];
        return {
          id: row.id,
          name: row.name,
          gridSize: row.grid_size,
          userId: row.user_id, 
          coverColor: '#2563eb', // Provide the default value
          createdAt: row.created_at,
        };
      }
      throw error;
    }
  }
  
  async getAllAlbums(): Promise<Album[]> {
    if (!db) return [];
    try {
      return await db.select().from(albums);
    } catch (error) {
      // Handle the case where cover_color column doesn't exist
      if (error instanceof Error && error.message.includes('cover_color')) {
        console.warn('Warning: cover_color column not found in database. Please run npm run db:push to update schema.');
        // Fallback to a query that only selects columns that are known to exist
        const rawResults = await db.execute(
          `SELECT id, name, grid_size, user_id, created_at FROM albums`
        );
        
        // Map the results to match the expected Album type
        return rawResults.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          gridSize: row.grid_size,
          userId: row.user_id,
          coverColor: '#2563eb', // Provide the default value
          createdAt: row.created_at
        }));
      }
      throw error;
    }
  }
  
  async updateAlbumGridSize(id: number, gridSize: number): Promise<Album> {
    if (!db) throw new Error("Database not available");
    const [updatedAlbum] = await db
      .update(albums)
      .set({ gridSize })
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum;
  }
  
  async updateAlbumCoverColor(id: number, coverColor: string): Promise<Album> {
    if (!db) throw new Error("Database not available");
    try {
      const [updatedAlbum] = await db
        .update(albums)
        .set({ coverColor })
        .where(eq(albums.id, id))
        .returning();
      return updatedAlbum;
    } catch (error) {
      // Handle the case where cover_color column doesn't exist
      if (error instanceof Error && error.message.includes('cover_color')) {
        console.warn('Warning: cover_color column not found in database. Please run npm run db:push to update schema.');
        
        // Get the current album data
        const [currentAlbum] = await db
          .select()
          .from(albums)
          .where(eq(albums.id, id));
          
        if (!currentAlbum) throw new Error("Album not found");
        
        // Return the album with the new cover color added (but not saved in DB)
        return {
          ...currentAlbum,
          coverColor
        };
      }
      throw error;
    }
  }
  
  async createPage(page: InsertPage): Promise<Page> {
    if (!db) throw new Error("Database not available");
    const [createdPage] = await db.insert(pages).values(page).returning();
    return createdPage;
  }
  
  async getPage(albumId: number, pageNumber: number): Promise<Page | undefined> {
    if (!db) return undefined;
    const [page] = await db
      .select()
      .from(pages)
      .where(and(
        eq(pages.albumId, albumId),
        eq(pages.pageNumber, pageNumber)
      ));
    return page;
  }
  
  async updatePageCards(id: number, cards: Array<{position: number; cardId: string} | null>): Promise<Page> {
    if (!db) throw new Error("Database not available");
    
    // Get the current page
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    if (!page) throw new Error("Page not found");
    
    // Filter out nulls (since they represent empty slots) and positions that aren't being updated
    const nonNullCards = cards.filter(card => card !== null);
    
    // Calculate updated cards array
    // If the database already has cards, we need to merge them
    let updatedCards = page.cards || [];
    
    // Filter out existing cards at positions that are being updated
    updatedCards = updatedCards.filter((existingCard: {position: number; cardId: string} | null) => {
      if (!existingCard) return false;
      
      return !nonNullCards.some(newCard => 
        newCard && newCard.position === existingCard.position
      );
    });
    
    // Add the new cards
    updatedCards = [...updatedCards, ...nonNullCards];
    
    // Update the database
    const [updatedPage] = await db
      .update(pages)
      .set({ cards: updatedCards })
      .where(eq(pages.id, id))
      .returning();
      
    return updatedPage;
  }

  async searchCards(query: string, setId?: string, page: number = 1, pageSize: number = 20, sortBy: string = "releaseDate"): Promise<{cards: PokemonCard[], totalCount: number}> {
    // Use the advanced query builder to construct the API query
    const apiQuery = createAdvancedApiQuery(query, setId);
    const orderBy = getSortOrderBy(sortBy);
    console.log(`Searching cards with query: ${apiQuery}, page: ${page}, pageSize: ${pageSize}, sortBy: ${sortBy} (orderBy: ${orderBy})`);
    
    // Set up the headers with the API key
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&orderBy=${orderBy}&page=${page}&pageSize=${pageSize}`,
      { headers }
    );
    
    const data = await response.json();
    
    // Ensure 'data' exists and is an array
    const cards = data?.data || [];
    if (!Array.isArray(cards)) {
      console.error("Unexpected API response format:", data);
      return { cards: [], totalCount: 0 };
    }
    
    // Cache the cards
    cards.forEach(card => this.cardCache.set(card.id, card));
    
    // Apply additional client-side sorting for better reliability on specific fields
    return {
      cards,
      totalCount: data.totalCount || cards.length
    };
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

// Use DatabaseStorage if DATABASE_URL is available, otherwise use MemStorage
let storageImplementation: IStorage;

try {
  if (isDatabaseAvailable) {
    storageImplementation = new DatabaseStorage();
    console.log("Using PostgreSQL database storage");
  } else {
    storageImplementation = new MemStorage();
    console.log("Using in-memory storage");
  }
} catch (error) {
  console.warn("Error initializing storage, falling back to in-memory storage:", error);
  storageImplementation = new MemStorage();
}

export const storage = storageImplementation;