import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Matches the broadcast payload shape from routes.ts
interface DuelResult {
  type: "DUEL_RESULT";
  casterName: string;
  targetName: string;
  casterSpell: string;
  casterSpellType: string;
  casterSpellColor: string;
  targetSpell: string;
  targetSpellType: string;
  winner: string;
  result: string;
  message: string;
}

// Maps spell type to a readable emoji for the overlay
function spellEmoji(type: string): string {
  if (type === "OFFENSIVE") return "⚔️";
  if (type === "DEFENSIVE") return "🛡️";
  if (type === "SUPPORT") return "✨";
  return "🪄";
}

// Maps result to overlay color
function resultColor(result: string): string {
  if (result === "VICTORY") return "text-yellow-400";
  if (result === "DEFEAT") return "text-red-400";
  if (result === "DRAW") return "text-cyan-400";
  return "text-white";
}

export function OverlayDisplay() {
  const [currentDuel, setCurrentDuel] = useState<DuelResult | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${protocol}://${window.location.host}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "DUEL_RESULT") {
            setCurrentDuel(data);
            // Auto-clear after 8 seconds
            setTimeout(() => setCurrentDuel(null), 8000);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setConnected(false);
      };

      // Auto-reconnect after 3 seconds if connection drops
      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting in 3s...");
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-transparent pointer-events-none overflow-hidden relative">

      {/* Small connection indicator - green = connected, red = reconnecting */}
      <div className={`fixed top-2 right-2 w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />

      {/* ===== DUEL ANIMATION (center screen) ===== */}
      <AnimatePresence>
        {currentDuel && (
          <motion.div
            key={currentDuel.casterName + currentDuel.targetName + Date.now()}
            initial={{ scale: 0, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -60 }}
            transition={{ type: "spring", damping: 14, stiffness: 120 }}
            className="relative bg-black/85 border-2 border-cyan-500/60 rounded-3xl p-8 max-w-2xl w-full text-center shadow-[0_0_60px_rgba(0,255,255,0.25)] backdrop-blur-md mx-8"
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-3xl animate-pulse pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-5">

              {/* Title */}
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
                ⚡ Wizard Duel ⚡
              </p>

              {/* Combatants Row */}
              <div className="flex items-center justify-between w-full gap-4">

                {/* Caster */}
                <div className="flex-1 text-right space-y-1">
                  <p className="text-xl font-black text-white">{currentDuel.casterName}</p>
                  <p className="text-sm text-neutral-400 uppercase tracking-widest">Caster</p>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-2xl">{spellEmoji(currentDuel.casterSpellType)}</span>
                    <span className={`text-sm font-bold ${currentDuel.casterSpellColor}`}>
                      {currentDuel.casterSpell}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 uppercase">{currentDuel.casterSpellType}</p>
                </div>

                {/* VS divider */}
                <div className="flex flex-col items-center gap-1 px-2">
                  <span className="text-3xl font-black text-white/30">VS</span>
                  <div className="w-px h-12 bg-white/10" />
                </div>

                {/* Target */}
                <div className="flex-1 text-left space-y-1">
                  <p className="text-xl font-black text-white">{currentDuel.targetName}</p>
                  <p className="text-sm text-neutral-400 uppercase tracking-widest">Target</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">{spellEmoji(currentDuel.targetSpellType)}</span>
                    <span className="text-sm font-bold text-purple-400">
                      {currentDuel.targetSpell}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 uppercase">{currentDuel.targetSpellType}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/10" />

              {/* Result */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="space-y-1"
              >
                {currentDuel.winner === "Draw" ? (
                  <p className="text-2xl font-black text-cyan-400">It's a Draw! 🤝</p>
                ) : (
                  <p className={`text-3xl font-black ${resultColor(currentDuel.result)}`}>
                    🏆 {currentDuel.winner} Wins!
                  </p>
                )}
                <p className="text-sm text-neutral-400 italic">{currentDuel.message}</p>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PERSISTENT INSTRUCTION BAR (bottom of screen) ===== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="bg-black/70 border border-cyan-500/30 rounded-full px-6 py-2 backdrop-blur-sm"
        >
          <p className="text-cyan-400 text-sm font-semibold tracking-wide whitespace-nowrap">
            🧙 Type <span className="text-white font-black">!duel</span> for potential duelists!
          </p>
        </motion.div>
      </div>

    </div>
  );
}
