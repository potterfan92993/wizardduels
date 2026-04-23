import type { Express, Request } from "express";
import type { Server } from "http";
import { WebSocketServer } from "ws";
import { db } from "./db";
import { gameEvents } from "../shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { SPELLS, resolveDuel } from "../shared/game-logic";
import { log } from "./index";

// ============ WEBSOCKET SETUP ============
const clients = new Set<any>();

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// ============ TWITCH HELPERS ============

// Gets a fresh app access token using Client Credentials
async function getAppAccessToken(): Promise<string> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Twitch Auth Failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Automatically registers the EventSub subscription on startup
// Checks if it already exists first to avoid duplicates
async function ensureEventSubSubscription() {
  try {
    log("Checking Twitch EventSub subscription...", "twitch");

    const token = await getAppAccessToken();

    const headers = {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Check if subscription already exists and is enabled
    const checkRes = await fetch(
      "https://api.twitch.tv/helix/eventsub/subscriptions?status=enabled",
      { headers }
    );
    const checkData = await checkRes.json();

    const existing = checkData.data?.find(
      (sub: any) =>
        sub.type === "channel.channel_points_custom_reward_redemption.add" &&
        sub.condition?.broadcaster_user_id === process.env.BROADCASTER_ID &&
        sub.transport?.callback ===
          `${process.env.RENDER_EXTERNAL_URL}/api/twitch/webhook`
    );

    if (existing) {
      log(`EventSub already active (id: ${existing.id})`, "twitch");
      return;
    }

    // Subscription not found — create it
    log("Registering new EventSub subscription...", "twitch");

    const createRes = await fetch(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "channel.channel_points_custom_reward_redemption.add",
          version: "1",
          condition: {
            broadcaster_user_id: process.env.BROADCASTER_ID,
          },
          transport: {
            method: "webhook",
            callback: `${process.env.RENDER_EXTERNAL_URL}/api/twitch/webhook`,
            secret: process.env.TWITCH_WEBHOOK_SECRET,
          },
        }),
      }
    );

    const createData = await createRes.json();

    if (!createRes.ok) {
      log(`EventSub registration failed: ${JSON.stringify(createData)}`, "twitch");
    } else {
      log(`EventSub registered successfully (id: ${createData.data?.[0]?.id})`, "twitch");
    }
  } catch (err) {
    log(`EventSub setup error: ${err}`, "twitch");
  }
}

// Verifies the message is actually from Twitch
const verifyTwitchSignature = (req: Request): boolean => {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const signature = req.headers["twitch-eventsub-message-signature"];

  if (!secret || !messageId || !timestamp || !signature) return false;

  // Use raw body bytes, not re-serialized JSON
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(
      (messageId as string) +
        (timestamp as string) +
        (req.rawBody as Buffer).toString()
    )
    .digest("hex");

  return `sha256=${hmac}` === signature;
};

// ============ DUEL PROCESSOR (runs in background) ============
// Separated so we can respond to Twitch immediately and avoid retries
async function processDuel(event: any) {
  const casterName: string = event.user_name;
  const casterId: string = event.user_id;

  // Extract and clean target name
  const rawInput: string = event.user_input || "";
  const targetName: string =
    rawInput.replace(/@/g, "").trim().split(/\s+/)[0] || "The Host";

  // Roll random spells for both sides
  const casterSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
  const targetSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];

  // Always resolve a real duel outcome
  const outcome = resolveDuel(casterSpell, targetSpell);

  const winnerName: string =
    outcome === "WIN"
      ? casterName
      : outcome === "LOSE"
      ? targetName
      : "Draw";

  const resultStatus: string =
    outcome === "WIN"
      ? "VICTORY"
      : outcome === "LOSE"
      ? "DEFEAT"
      : "DRAW";

  const duelMessage = `${casterName} used ${casterSpell.name} vs ${targetName}'s ${targetSpell.name}!`;

  // Record duel to database
  await db.insert(gameEvents).values({
    caster_id: casterId,
    caster_name: casterName,
    target_id: null,
    target_name: targetName,
    caster_spell: casterSpell.name,
    target_spell: targetSpell.name,
    winner: winnerName,
    result: resultStatus,
    message: duelMessage,
  });

  // Broadcast to WebSocket clients (overlay + dashboard)
  broadcast({
    type: "DUEL_RESULT",
    casterName,
    targetName,
    casterSpell: casterSpell.name,
    casterSpellType: casterSpell.type,
    casterSpellColor: casterSpell.color,
    targetSpell: targetSpell.name,
    targetSpellType: targetSpell.type,
    winner: winnerName,
    result: resultStatus,
    message: duelMessage,
  });

  // ============ SEND 3 SEQUENTIAL CHAT MESSAGES ============
  if (process.env.CHAT_TOKEN) {
    const sendChatMessage = async (message: string) => {
      await fetch("https://api.twitch.tv/helix/chat/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CHAT_TOKEN}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          broadcaster_id: process.env.BROADCASTER_ID,
          sender_id: process.env.BROADCASTER_ID,
          message,
        }),
      });
    };

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Message 1 — The challenge
    await sendChatMessage(
      `⚔️ ${casterName} has challenged ${targetName} to a Wizard Duel!`
    );

    await delay(1500);

    // Message 2 — The spells
    await sendChatMessage(
      `🪄 ${casterName} cast ${casterSpell.name} and ${targetName} cast ${targetSpell.name}!`
    );

    await delay(1500);

    // Message 3 — The result
    if (winnerName === "Draw") {
      await sendChatMessage(
        `🤝 The duel ended in a Draw! Neither wizard prevails!`
      );
    } else {
      await sendChatMessage(
        `🏆 ${winnerName} wins the duel! ✨`
      );
    }
  }

  log(`Duel recorded: ${casterName} vs ${targetName} → ${winnerName} wins`, "twitch");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ WEBSOCKET SERVER ============
  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  // ============ AUTO-REGISTER EVENTSUB ON STARTUP ============
  setTimeout(ensureEventSubSubscription, 3000);

  // ============ TWITCH WEBHOOK ============
  app.post("/api/twitch/webhook", async (req, res) => {
    if (!verifyTwitchSignature(req)) {
      return res.status(403).send("Forbidden");
    }

    const messageType = req.headers["twitch-eventsub-message-type"];

    // Handle Twitch verification challenge
    if (messageType === "webhook_callback_verification") {
      log("Twitch webhook verified successfully", "twitch");
      return res.status(200).send(req.body.challenge);
    }

    // FIX: Respond to Twitch IMMEDIATELY to prevent retries
    // All duel processing happens in the background after this
    res.status(204).send();

    // Process the duel in the background
    if (messageType === "notification") {
      const event = req.body.event;
      if (event.reward?.title === "Wizard Duel!") {
        processDuel(event).catch((err) =>
          console.error("Duel processing error:", err)
        );
      }
    }
  });

  // ============ LEADERBOARD (top 10 winners) ============
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const result = await db
        .select({
          username: gameEvents.caster_name,
          wins: sql<number>`count(*)`.mapWith(Number),
        })
        .from(gameEvents)
        .where(eq(gameEvents.winner, gameEvents.caster_name))
        .groupBy(gameEvents.caster_name)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      res.json(result);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ============ RECENT EVENTS (last 10 duels) ============
  app.get("/api/events/recent", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(gameEvents)
        .orderBy(desc(gameEvents.created_at))
        .limit(10);
      res.json(result);
    } catch (err) {
      console.error("Recent events fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch recent events" });
    }
  });

  // ============ LATEST EVENT ============
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
