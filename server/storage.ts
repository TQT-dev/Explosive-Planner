
import { db } from "./db";
import { 
  players, history, gameSettings,
  type Player, type InsertPlayer, 
  type HistoryItem, type InsertHistory,
  type GameSettings 
} from "@shared/schema";
import { eq, asc, desc, not, sql } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: number): Promise<void>;
  
  // Settings
  getSettings(): Promise<GameSettings>;
  updateSettings(updates: Partial<GameSettings>): Promise<GameSettings>;
  
  // History
  getHistory(): Promise<HistoryItem[]>;
  addHistory(item: InsertHistory): Promise<HistoryItem>;
  getLastHistory(): Promise<HistoryItem | undefined>;
  deleteHistory(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players).orderBy(asc(players.order));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const [player] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    return player;
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async getSettings(): Promise<GameSettings> {
    const [settings] = await db.select().from(gameSettings);
    if (!settings) {
      const [newSettings] = await db.insert(gameSettings).values({ penaltyValue: 100 }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSettings(updates: Partial<GameSettings>): Promise<GameSettings> {
    const current = await this.getSettings();
    const [settings] = await db.update(gameSettings).set(updates).where(eq(gameSettings.id, current.id)).returning();
    return settings;
  }

  async getHistory(): Promise<HistoryItem[]> {
    return await db.select().from(history).orderBy(desc(history.timestamp)).limit(20);
  }

  async addHistory(item: InsertHistory): Promise<HistoryItem> {
    const [historyItem] = await db.insert(history).values(item).returning();
    return historyItem;
  }

  async getLastHistory(): Promise<HistoryItem | undefined> {
    const [item] = await db.select().from(history).orderBy(desc(history.timestamp)).limit(1);
    return item;
  }

  async deleteHistory(id: number): Promise<void> {
    await db.delete(history).where(eq(history.id, id));
  }
}

export const storage = new DatabaseStorage();
