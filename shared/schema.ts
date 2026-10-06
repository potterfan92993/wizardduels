import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// Game events (battles/duels)
export const gameEvents = pgTable("game_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caster_id: varchar("caster_id").notNull(),
  caster_name: varchar("caster_name").notNull(),
  target_id: varchar("target_id"),
  target_name: varchar("target_name"),
  caster_spell: varchar("caster_spell").notNull(),
  target_spell: varchar("target_spell"),
  winner: varchar("winner"),
  result: varchar("result"), // "VICTORY", "DEFEAT", "DRAW", "AUTO_PRACTICE"
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});

// Twitch OAuth tokens — stores access + refresh tokens for auto-refresh
export const twitchTokens = pgTable("twitch_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type GameEvent = typeof gameEvents.$inferSelect;
export type TwitchToken = typeof twitchTokens.$inferSelect;
