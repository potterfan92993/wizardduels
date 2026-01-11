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


// New schemas
export type GameEvent = typeof gameEvents.$inferSelect;

