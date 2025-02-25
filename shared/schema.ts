import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
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
    name: string;
    series: string;
  };
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

export const insertAlbumSchema = createInsertSchema(albums);
export const insertPageSchema = createInsertSchema(pages);

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
