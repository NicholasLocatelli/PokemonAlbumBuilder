import { pgTable, text, serial, integer, jsonb, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Card type from Pokemon TCG API
export type PokemonCard = {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal?: number;
    total?: number;
    releaseDate?: string;
    images?: {
      symbol?: string;
      logo?: string;
    };
  };
  rarity?: string;
  number?: string;
};

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // Will store hashed password
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// We'll add password reset tokens after the email field is added

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gridSize: integer("grid_size").notNull(), // 4, 9, or 12
  userId: integer("user_id").references(() => users.id), // Album can optionally belong to a user
  coverColor: text("cover_color").default("#2563eb"), // Default blue color for album cover
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => albums.id),
  pageNumber: integer("page_number").notNull(),
  cards: jsonb("cards").$type<Array<{position: number; cardId: string} | null>>().notNull(),
});

// Define relations between users and albums
export const usersRelations = relations(users, ({ many }) => ({
  albums: many(albums)
}));

// Define relations between albums and pages, and albums and users
export const albumsRelations = relations(albums, ({ many, one }) => ({
  pages: many(pages),
  user: one(users, {
    fields: [albums.userId],
    references: [users.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  album: one(albums, {
    fields: [pages.albumId],
    references: [albums.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertAlbumSchema = createInsertSchema(albums)
  .omit({ id: true, createdAt: true });

export const insertPageSchema = createInsertSchema(pages)
  .omit({ id: true });

// Will add this back when we implement password reset
// export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens)
//  .omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
// Will add these back when we implement password reset
// export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
// export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
