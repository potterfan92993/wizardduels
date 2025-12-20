import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Your existing users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// NEW: Game events (battles/duels)
export const gameEvents = pgTable("game_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caster_id: varchar("caster_id").notNull(),
  caster_name: varchar("caster_name").notNull(),
  target_id: varchar("target_id"),
  target_name: varchar("target_name"),
  caster_spell: varchar("caster_spell").notNull(),
  target_spell: varchar("target_spell"),
  winner: varchar("winner"),
  result: varchar("result"), // "WIN", "LOSE", "DRAW"
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});

// NEW: Leaderboard (cached stats for fast overlay queries)
export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().unique(),
  username: varchar("username").notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  casts: integer("casts").default(0),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Existing schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New schemas
export type GameEvent = typeof gameEvents.$inferSelect;
export type LeaderboardEntry = typeof leaderboard.$inferSelect;
