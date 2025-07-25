import { pgTable, text, serial, integer, jsonb, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Card type from Pokemon TCG API
export type PokemonCard = {
  id: string;
  name: string;
  artist?: string; // Artist/illustrator of the card
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
  hp?: string; // HP value for Pokemon cards
};

// Enhanced user table with complete account management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(), // Hashed with bcrypt
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  theme: varchar("theme", { length: 10 }).default("system"), // light, dark, system
  language: varchar("language", { length: 10 }).default("en"), // en, it, etc
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
}));

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
}));

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
}));

// Social login connections (Google, etc.)
export const socialConnections = pgTable("social_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull(), // google, facebook, etc
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerIdx: index("social_connections_provider_idx").on(table.provider, table.providerId),
}));

// User activity log for audit trail
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // login, logout, profile_update, password_change, etc
  details: jsonb("details").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_activity_log_user_id_idx").on(table.userId),
  actionIdx: index("user_activity_log_action_idx").on(table.action),
}));

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

// Define relations between users and their related tables
export const usersRelations = relations(users, ({ many }) => ({
  albums: many(albums),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  socialConnections: many(socialConnections),
  activityLog: many(userActivityLog),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const socialConnectionsRelations = relations(socialConnections, ({ one }) => ({
  user: one(users, {
    fields: [socialConnections.userId],
    references: [users.id],
  }),
}));

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLog.userId],
    references: [users.id],
  }),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, failedLoginAttempts: true, lockedUntil: true, lastLoginAt: true });

export const updateUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, password: true, emailVerified: true, failedLoginAttempts: true, lockedUntil: true, lastLoginAt: true })
  .partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const emailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  confirmEmail: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens)
  .omit({ id: true, createdAt: true });

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens)
  .omit({ id: true, createdAt: true });

export const insertSocialConnectionSchema = createInsertSchema(socialConnections)
  .omit({ id: true, createdAt: true });

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog)
  .omit({ id: true, createdAt: true });

export const insertAlbumSchema = createInsertSchema(albums)
  .omit({ id: true, createdAt: true });

export const insertPageSchema = createInsertSchema(pages)
  .omit({ id: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type EmailChange = z.infer<typeof emailChangeSchema>;

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = z.infer<typeof insertSocialConnectionSchema>;

export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
