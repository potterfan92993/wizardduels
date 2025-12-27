import type { Express } from "express";
import type { Server } from "http";
import { db } from "./db";
import { gameEvents, leaderboard } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { crypto } from "crypto";
import { Express, Request, Response } from "express";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ LEADERBOARD OVERLAY ROUTE ============
  // Returns top 10 players for stream display
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const data = await db
        .select({
          username: leaderboard.username,
          wins: leaderboard.wins,
          losses: leaderboard.losses,
          casts: leaderboard.casts,
        })
        .from(leaderboard)
        .orderBy(desc(leaderboard.wins))
        .limit(10);

      res.json(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ============ RECORD SPELL CAST ROUTE ============
  // Called after a duel happens - updates leaderboard
  app.post("/api/events/record", async (req, res) => {
    try {
      const {
        caster_id,
        caster_name,
        target_id,
        target_name,
        caster_spell,
        target_spell,
        winner,
        result,
        message,
      } = req.body;

      // Record the game event
      const eventResult = await db
        .insert(gameEvents)
        .values({
          caster_id,
          caster_name,
          target_id,
          target_name,
          caster_spell,
          target_spell,
          winner,
          result,
          message,
        })
        .returning();

      // Update leaderboard for caster
      const casterLeaderboardEntry = await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.user_id, caster_id));

      if (casterLeaderboardEntry.length > 0) {
        const isWin = winner === caster_id;
        await db
          .update(leaderboard)
          .set({
            wins: isWin
              ? casterLeaderboardEntry[0].wins + 1
              : casterLeaderboardEntry[0].wins,
            losses: !isWin
              ? casterLeaderboardEntry[0].losses + 1
              : casterLeaderboardEntry[0].losses,
            casts: casterLeaderboardEntry[0].casts + 1,
            updated_at: new Date(),
          })
          .where(eq(leaderboard.user_id, caster_id));
      } else {
        // Create new leaderboard entry
        const isWin = winner === caster_id;
        await db.insert(leaderboard).values({
          user_id: caster_id,
          username: caster_name,
          wins: isWin ? 1 : 0,
          losses: !isWin ? 1 : 0,
          casts: 1,
        });
      }

      // Update leaderboard for target (if exists)
      if (target_id) {
        const targetLeaderboardEntry = await db
          .select()
          .from(leaderboard)
          .where(eq(leaderboard.user_id, target_id));

        if (targetLeaderboardEntry.length > 0) {
          const isWin = winner === target_id;
          await db
            .update(leaderboard)
            .set({
              wins: isWin
                ? targetLeaderboardEntry[0].wins + 1
                : targetLeaderboardEntry[0].wins,
              losses: !isWin
                ? targetLeaderboardEntry[0].losses + 1
                : targetLeaderboardEntry[0].losses,
              casts: targetLeaderboardEntry[0].casts + 1,
              updated_at: new Date(),
            })
            .where(eq(leaderboard.user_id, target_id));
        } else {
          const isWin = winner === target_id;
          await db.insert(leaderboard).values({
            user_id: target_id,
            username: target_name,
            wins: isWin ? 1 : 0,
            losses: !isWin ? 1 : 0,
            casts: 1,
          });
        }
      }

      res.json({ success: true, event: eventResult[0] });
    } catch (err) {
      console.error("Failed to record event:", err);
      res.status(500).json({ error: "Failed to record event" });
    }
  });

  // ============ LATEST EVENT ROUTE ============
  // Returns most recent duel for alert popup
  app.get("/api/events/latest", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(gameEvents)
        .orderBy(desc(gameEvents.created_at))
        .limit(1);

      res.json(result[0] || {});
    } catch (err) {
      console.error("Failed to fetch latest event:", err);
      res.status(500).json({ error: "Failed to fetch latest event" });
    }
  });

  // ============ HEALTH CHECK ============
  app.get("/api/health", (req, res) => {
    res.json({ status: "Backend is running!" });
  });

  return httpServer;
}
