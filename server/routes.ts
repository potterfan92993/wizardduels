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

async function getAppAccessToken() {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await response.json();
  return data.access_token;
}

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

      let targetId = null;

            // NEW: Lookup the Target's ID from Twitch
            try {
              const userLookup = await fetch(`https://api.twitch.tv/helix/users?login=${targetName.replace('@', '')}`, {
                headers: {
                  'Client-Id': process.env.TWITCH_CLIENT_ID,
                  'Authorization': `Bearer q7bg7363r2ifavvam6l1dttu8wlykw` // You'll need an app token here
                }
              });
              const lookupData = await userLookup.json();
              if (lookupData.data && lookupData.data.length > 0) {
                targetId = lookupData.data[0].id;
              }
            } catch (e) {
              console.error("Twitch User Lookup failed", e);
            }

      // AUTO-ROLL: Pick random spells
      const casterSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
      const targetSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];

      // Determine Winner
      const outcome = resolveDuel(casterSpell, targetSpell);
      let winnerName = outcome === "WIN" ? casterName : (outcome === "LOSE" ? targetName : "Draw");
      let resultStatus = outcome === "WIN" ? "VICTORY" : (outcome === "LOSE" ? "DEFEAT" : "DRAW");

      // Record Duel to Database
      try {
        // 1. Record the Duel Log (Working)
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

        // 2. UPDATE LEADERBOARD (Corrected with user_id)
        if (winnerName !== "Draw") {
          // Determine if the winner is the caster or the target to get the right ID
          const winnerId = (winnerName === casterName) ? casterId : null; 
        
          // NOTE: If the winner is 'The Host' or someone without an ID, we might skip
          if (winnerId) {
            await db.insert(leaderboard)
              .values({ 
                user_id: winnerId,    // This was the missing piece!
                username: winnerName, 
                wins: 1 
              })
              .onConflictDoUpdate({
                target: [leaderboard.user_id], // Use user_id as the unique check
                set: { 
                  username: winnerName,        // Update name in case they changed it
                  wins: sql`${leaderboard.wins} + 1`,
                  updated_at: new Date()
                },
              });
          }
        }

        // 3. SEND TO TWITCH CHAT (The Bot Voice)
        if (process.env.CHAT_TOKEN) {
          try {
            await fetch('https://api.twitch.tv/helix/chat/messages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.CHAT_TOKEN}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                broadcaster_id: process.env.BROADCASTER_ID,
                sender_id: process.env.BROADCASTER_ID, // Bots can be the streamer
                message: `🧙‍♂️ ${casterName} vs ${targetName}! ${winnerName === "Draw" ? "It's a Draw!" : winnerName + " WINS!"} ✨`
              })
            });
          } catch (chatErr) {
            console.error("Chat message failed:", chatErr);
          }
        }

        console.log(`Duel Recorded and Leaderboard Updated: ${casterName} vs ${targetName}`);
      } catch (err) {
        console.error("Failed to process duel results:", err);
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
