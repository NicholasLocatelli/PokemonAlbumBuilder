import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlbumSchema, insertPageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Album routes
  app.post("/api/albums", async (req, res) => {
    const albumData = insertAlbumSchema.parse(req.body);
    const album = await storage.createAlbum(albumData);
    res.json(album);
  });
  
  app.get("/api/albums/all", async (req, res) => {
    const albums = await storage.getAllAlbums();
    res.json(albums);
  });

  app.get("/api/albums/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const album = await storage.getAlbum(id);
    if (!album) return res.status(404).json({ message: "Album not found" });
    res.json(album);
  });

  app.patch("/api/albums/:id/grid-size", async (req, res) => {
    const id = parseInt(req.params.id);
    const { gridSize } = z.object({ gridSize: z.number() }).parse(req.body);
    const album = await storage.updateAlbumGridSize(id, gridSize);
    res.json(album);
  });

  // Page routes
  app.post("/api/pages", async (req, res) => {
    const pageData = insertPageSchema.parse(req.body);
    const page = await storage.createPage(pageData);
    res.json(page);
  });

  app.get("/api/albums/:albumId/pages/:pageNumber", async (req, res) => {
    const albumId = parseInt(req.params.albumId);
    const pageNumber = parseInt(req.params.pageNumber);
    const page = await storage.getPage(albumId, pageNumber);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.patch("/api/pages/:id/cards", async (req, res) => {
    const id = parseInt(req.params.id);
    const { cards } = z.object({
      cards: z.array(z.object({
        position: z.number(),
        cardId: z.string()
      }).nullable())
    }).parse(req.body);
    const page = await storage.updatePageCards(id, cards);
    res.json(page);
  });

  // Pokemon card routes
  app.get("/api/cards/search", async (req, res) => {
    const { query } = z.object({ query: z.string() }).parse(req.query);
    const cards = await storage.searchCards(query);
    res.json(cards);
  });

  app.get("/api/cards/:id", async (req, res) => {
    const { id } = req.params;
    const card = await storage.getCard(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  const httpServer = createServer(app);
  return httpServer;
}
