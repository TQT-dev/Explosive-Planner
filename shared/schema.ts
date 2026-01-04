
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game sessions to track the current card drawn
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  currentCard: text("current_card"), // e.g., 'pirate', 'coin', 'diamond', '2skulls', etc.
  isDoubleScore: boolean("is_double_score").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScoreSchema = createInsertSchema(scores).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
