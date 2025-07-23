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
 */
function createAdvancedApiQuery(query: string, setId?: string): string {
  const setSpecificRegex = /^([a-zA-Z]+)[-]?(\d+)$/;
  const setSpecificMatch = query.match(setSpecificRegex);
  
  if (setSpecificMatch) {
    const [_, potentialSetPrefix, cardNumber] = setSpecificMatch;
    
    if (setId) {
      return `number:${cardNumber} set.id:${setId}`;
    } else {
      return `number:${cardNumber}`;
    }
  } 
  else if (setId && /^\d+$/.test(query)) {
    return `number:${query} set.id:${setId}`;
  } 
  else if (query.toLowerCase().includes('galarian') || 
           query.toLowerCase().includes('alolan') || 
           query.toLowerCase().includes('hisuian') ||
           query.toLowerCase().includes('paldean')) {
    const terms = query.split(' ').filter(term => term.length > 0);
    let apiQuery = terms.map(term => `name:${term}`).join(' ');
    
    if (setId) {
      apiQuery += ` set.id:${setId}`;
    }
    
    return apiQuery;
  } 
  else {
    let apiQuery = `name:${query}*`;

    if (setId) {
      apiQuery += ` set.id:${setId}`;
    }
    
    return apiQuery;
  }
}

export interface IEnhancedStorage {
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

export class EnhancedDatabaseStorage implements IEnhancedStorage {
  private cardCache: Map<string, PokemonCard>;
  public sessionStore: session.Store;
  
  constructor() {
    this.cardCache = new Map();
    
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Enhanced user methods
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async incrementFailedLoginAttempts(id: number): Promise<void> {
    // Get current attempts count
    const [user] = await db.select({ attempts: users.failedLoginAttempts }).from(users).where(eq(users.id, id));
    const newCount = (user?.attempts || 0) + 1;
    
    await db
      .update(users)
      .set({ 
        failedLoginAttempts: newCount,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async resetFailedLoginAttempts(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async lockUser(id: number, lockUntil: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        lockedUntil: lockUntil,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async deactivateUser(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    // Delete related records first
    await db.delete(userActivityLog).where(eq(userActivityLog.userId, id));
    await db.delete(socialConnections).where(eq(socialConnections.userId, id));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, id));
    
    // Delete user albums and pages
    const userAlbums = await db.select({ id: albums.id }).from(albums).where(eq(albums.userId, id));
    for (const album of userAlbums) {
      await db.delete(pages).where(eq(pages.albumId, album.id));
    }
    await db.delete(albums).where(eq(albums.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Email verification methods
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [newToken] = await db.insert(emailVerificationTokens).values(token).returning();
    return newToken;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return verificationToken;
  }

  async deleteEmailVerificationToken(id: number): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
  }

  async deleteExpiredEmailVerificationTokens(): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(lt(emailVerificationTokens.expiresAt, new Date()));
  }

  // Password reset methods
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(id: number): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
  }

  async deletePasswordResetToken(id: number): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  // Social connection methods
  async createSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection> {
    const [newConnection] = await db.insert(socialConnections).values(connection).returning();
    return newConnection;
  }

  async getSocialConnections(userId: number): Promise<SocialConnection[]> {
    return await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.userId, userId));
  }

  async getSocialConnectionByProvider(userId: number, provider: string): Promise<SocialConnection | undefined> {
    const [connection] = await db
      .select()
      .from(socialConnections)
      .where(and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.provider, provider)
      ));
    return connection;
  }

  async deleteSocialConnection(id: number): Promise<void> {
    await db.delete(socialConnections).where(eq(socialConnections.id, id));
  }

  // Activity log methods
  async logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog> {
    const [newActivity] = await db.insert(userActivityLog).values(activity).returning();
    return newActivity;
  }

  async getUserActivityLog(userId: number, limit: number = 20): Promise<UserActivityLog[]> {
    return await db
      .select()
      .from(userActivityLog)
      .where(eq(userActivityLog.userId, userId))
      .orderBy(desc(userActivityLog.createdAt))
      .limit(limit);
  }

  // Album operations
  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db.insert(albums).values(album).returning();
    return newAlbum;
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async getAllAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getUserAlbums(userId: number): Promise<Album[]> {
    return await db.select().from(albums).where(eq(albums.userId, userId));
  }

  async updateAlbumGridSize(id: number, gridSize: number): Promise<Album> {
    const [updatedAlbum] = await db
      .update(albums)
      .set({ gridSize })
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum;
  }

  async updateAlbumCoverColor(id: number, coverColor: string): Promise<Album> {
    const [updatedAlbum] = await db
      .update(albums)
      .set({ coverColor })
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum;
  }

  // Page operations
  async createPage(page: InsertPage): Promise<Page> {
    const [newPage] = await db.insert(pages).values(page).returning();
    return newPage;
  }

  async getPage(albumId: number, pageNumber: number): Promise<Page | undefined> {
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
    const [updatedPage] = await db
      .update(pages)
      .set({ cards })
      .where(eq(pages.id, id))
      .returning();
    return updatedPage;
  }

  // Pokemon TCG API operations
  async searchCards(
    query: string, 
    setId?: string, 
    page: number = 1, 
    pageSize: number = 20, 
    sortBy: string = 'releaseDate'
  ): Promise<{ cards: PokemonCard[]; totalCount: number }> {
    const apiQuery = createAdvancedApiQuery(query, setId);
    const orderBy = getSortOrderBy(sortBy);
    
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&orderBy=${orderBy}&page=${page}&pageSize=${pageSize}`,
      { headers }
    );
    
    const data = await response.json();
    const cards = data?.data || [];
    
    // Cache the cards
    cards.forEach((card: PokemonCard) => this.cardCache.set(card.id, card));
    
    return {
      cards,
      totalCount: data.totalCount || cards.length
    };
  }

  async getCard(id: string): Promise<PokemonCard | undefined> {
    if (this.cardCache.has(id)) {
      return this.cardCache.get(id);
    }
    
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

  async getSets(): Promise<Array<{id: string; name: string; series: string}>> {
    const headers = {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
    };
    
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets',
      { headers }
    );
    
    const data = await response.json();
    const sets = data?.data || [];
    
    // Sort sets by release date (newest first)
    return sets.sort((a: any, b: any) => {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  }
}

// Create enhanced storage instance
export const enhancedStorage = new EnhancedDatabaseStorage();