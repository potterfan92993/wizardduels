import { db } from "./db";
import { twitchTokens } from "../shared/schema";
import { desc } from "drizzle-orm";
import { log } from "./index";

// ============ TWITCH TOKEN MANAGER ============
// Handles OAuth authorization code flow and automatic token refresh
// Tokens are stored in the DB so they survive server restarts

// Get the current valid access token
// Automatically refreshes if expired or expiring soon
export async function getChatToken(): Promise<string> {
  try {
    // Get the most recently stored token
    const stored = await db
      .select()
      .from(twitchTokens)
      .orderBy(desc(twitchTokens.updated_at))
      .limit(1);

    if (stored.length === 0) {
      // No token stored yet — fall back to env var if set
      if (process.env.CHAT_TOKEN) {
        log("No token in DB, using CHAT_TOKEN env var", "auth");
        return process.env.CHAT_TOKEN;
      }
      throw new Error("No chat token available — visit /auth/twitch to authorize");
    }

    const token = stored[0];
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Refresh if token is expired or expiring within 5 minutes
    if (expiresAt <= fiveMinutesFromNow) {
      log("Token expiring soon — refreshing...", "auth");
      return await refreshChatToken(token.refresh_token);
    }

    return token.access_token;
  } catch (err) {
    // Fall back to env var as last resort
    if (process.env.CHAT_TOKEN) {
      log(`Token fetch error, falling back to env var: ${err}`, "auth");
      return process.env.CHAT_TOKEN;
    }
    throw err;
  }
}

// Refresh the access token using the refresh token
async function refreshChatToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    log(`❌ Token refresh failed: ${JSON.stringify(errorData)}`, "auth");
    // Fall back to env var if refresh fails
    if (process.env.CHAT_TOKEN) {
      log("Falling back to CHAT_TOKEN env var", "auth");
      return process.env.CHAT_TOKEN;
    }
    throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Update token in DB
  await db.delete(twitchTokens);
  await db.insert(twitchTokens).values({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    updated_at: new Date(),
  });

  log(`✅ Token refreshed successfully — expires at ${expiresAt.toISOString()}`, "auth");
  return data.access_token;
}

// Save a new token to the DB after initial OAuth authorization
export async function saveChatToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Clear old tokens and save new one
  await db.delete(twitchTokens);
  await db.insert(twitchTokens).values({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    updated_at: new Date(),
  });

  log(`✅ Token saved — expires at ${expiresAt.toISOString()}`, "auth");
}

// Build the Twitch OAuth authorization URL
export function getTwitchAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    redirect_uri: process.env.TWITCH_REDIRECT_URI!,
    response_type: "code",
    scope: [
      "channel:bot",
      "user:write:chat",
      "chat:edit",
      "chat:read",
      "moderator:read:chatters",
      "user:read:chat",
      "channel:read:redemptions",
      "channel:manage:redemptions",
    ].join(" "),
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

// Exchange authorization code for access + refresh tokens
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TWITCH_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  await saveChatToken(data.access_token, data.refresh_token, data.expires_in);
}
