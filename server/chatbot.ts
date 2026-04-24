import net from "net";

type CommandHandler = (username: string) => void;

export function startChatBot(onDuelCommand: CommandHandler) {
  const CHANNEL = process.env.TWITCH_CHANNEL!; // your channel name lowercase
  const BOT_TOKEN = process.env.CHAT_TOKEN!;
  const BOT_NICK = process.env.BROADCASTER_USERNAME!;

  const client = net.createConnection(6667, "irc.chat.twitch.tv", () => {
    client.write(`PASS oauth:${BOT_TOKEN}\r\n`);
    client.write(`NICK ${BOT_NICK}\r\n`);
    client.write(`JOIN #${CHANNEL}\r\n`);
    console.log("[chatbot] Connected to Twitch IRC");
  });

  client.on("data", (data) => {
    const msg = data.toString();

    // Respond to Twitch PING to keep connection alive
    if (msg.includes("PING :tmi.twitch.tv")) {
      client.write("PONG :tmi.twitch.tv\r\n");
      return;
    }

    // Parse chat messages
    const match = msg.match(/:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(.+)/);
    if (match) {
      const username = match[1];
      const text = match[2].trim();
      if (text.toLowerCase() === "!duel") {
        onDuelCommand(username);
      }
    }
  });

  client.on("error", (err) => console.error("[chatbot] IRC error:", err));
  client.on("close", () => {
    console.log("[chatbot] Disconnected, reconnecting in 5s...");
    setTimeout(() => startChatBot(onDuelCommand), 5000);
  });
}
