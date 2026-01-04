
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Scores table for historical games
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Current Game Session for the score tracker
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  players: jsonb("players").notNull().default([]), // [{id, name, score, color}]
  currentPlayerId: text("current_player_id"),
  settings: jsonb("settings").notNull().default({ penaltyValue: 100 }),
  history: jsonb("history").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScoreSchema = createInsertSchema(scores).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
