import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
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

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gridSize: integer("grid_size").notNull(), // 4, 9, or 12
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull(),
  pageNumber: integer("page_number").notNull(),
  cards: jsonb("cards").$type<Array<{position: number; cardId: string} | null>>().notNull(),
});

// Define relations between albums and pages
export const albumsRelations = relations(albums, ({ many }) => ({
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  album: one(albums, {
    fields: [pages.albumId],
    references: [albums.id],
  }),
}));

export const insertAlbumSchema = createInsertSchema(albums);
export const insertPageSchema = createInsertSchema(pages);

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
