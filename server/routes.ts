import type { Express, Request } from "express";
import type { Server } from "http";
import { db } from "./db";
import { gameEvents, leaderboard } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { SPELLS, resolveDuel } from "../shared/game-logic";

// Security Guard: Verifies the message is actually from Twitch
const verifyTwitchSignature = (req: Request) => {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const signature = req.headers["twitch-eventsub-message-signature"];

  if (!secret || !messageId || !timestamp || !signature) return false;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update((messageId as string) + (timestamp as string) + JSON.stringify(req.body))
    .digest("hex");

  return `sha256=${hmac}` === signature;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ TWITCH WEBHOOK (AUTO-ROLL DUELS) ============
  app.post("/api/twitch/webhook", async (req, res) => {
    if (!verifyTwitchSignature(req)) {
      return res.status(403).send("Forbidden");
    }

    const messageType = req.headers["twitch-eventsub-message-type"];

    // Handle Twitch Verification Challenge
    if (messageType === "webhook_callback_verification") {
      return res.status(200).send(req.body.challenge);
    }

    // Handle Actual Redemption
    if (messageType === "notification") {
      const event = req.body.event;

      if (event.reward?.title === "Wizard Duel!") {
        const casterName = event.user_name;
        const casterId = event.user_id;
        const targetName = event.user_input || "The Host";

        // AUTO-ROLL: Pick random spells for both
        const casterSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
        const targetSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];

        // Determine Winner
        const outcome = resolveDuel(casterSpell, targetSpell);
        let winnerName = outcome === "WIN" ? casterName : (outcome === "LOSE" ? targetName : "Draw");
        let resultStatus = outcome === "WIN" ? "VICTORY" : (outcome === "LOSE" ? "DEFEAT" : "DRAW");

        // Record Duel to Database
        try {
          await db.insert(gameEvents).values({
            caster_id: casterId,
            caster_name: casterName,
            target_name: targetName,
            caster_spell: casterSpell.name,
            target_spell: targetSpell.name,
            winner: winnerName,
            result: resultStatus,
            message: `${casterName} used ${casterSpell.name} vs ${targetName}'s ${targetSpell.name}!`,
          });
          console.log(`Duel Recorded: ${casterName} vs ${targetName}`);
        } catch (err) {
          console.error("Failed to auto-record Twitch duel:", err);
        }
      }
    }
    return res.status(204).send();
  });

  // ============ LEADERBOARD OVERLAY ROUTE ============
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
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ============ LATEST EVENT ROUTE ============
  app.get("/api/events/latest", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(gameEvents)
        .orderBy(desc(gameEvents.created_at))
        .limit(1);
      res.json(result[0] || {});
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch latest event" });
    }
  });

  // ============ HEALTH CHECK ============
  app.get("/api/health", (req, res) => {
    res.json({ status: "Backend is running!" });
  });

  return httpServer;
}
