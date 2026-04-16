import { useState, useEffect } from "react";
import bgImage from "@assets/generated_images/dark_arcane_cyberpunk_background_with_neon_runes.png";

interface LeaderboardEntry {
  username: string;
  wins: number;
}

interface DuelEvent {
  id: string;
  caster_name: string;
  target_name: string;
  caster_spell: string;
  target_spell: string;
  winner: string;
  result: string;
  message: string;
  created_at: string;
}

function resultBadge(result: string): string {
  if (result === "VICTORY") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  if (result === "DEFEAT") return "text-red-400 bg-red-400/10 border-red-400/20";
  if (result === "DRAW") return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
  if (result === "AUTO_PRACTICE") return "text-neutral-400 bg-neutral-400/10 border-neutral-400/20";
  return "text-white";
}

export function Dashboard() {
  const [events, setEvents] = useState<DuelEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = async () => {
    try {
      // FIX: use /api/events/recent to get last 10 duels
      const [lbRes, evRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/events/recent"),
      ]);

      const lbData = await lbRes.json();
      const evData = await evRes.json();

      setLeaderboard(lbData);
      setEvents(Array.isArray(evData) ? evData : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Data fetch failed", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-12 border-b border-white/10 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              WIZARD BATTLE ADMIN
            </h1>
            <p className="text-neutral-500 uppercase tracking-widest text-xs mt-2">
              Live Twitch Integration Status
            </p>
          </div>
          {lastUpdated && (
            <p className="text-neutral-600 text-xs">Last updated: {lastUpdated}</p>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Leaderboard */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              🏆 Top Wizards
            </h2>
            <div className="space-y-3">
              {leaderboard.map((user, i) => (
                <div
                  key={user.username}
                  className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 text-sm font-mono w-5">#{i + 1}</span>
                    <span className="font-medium text-neutral-200">{user.username}</span>
                  </div>
                  <span className="text-cyan-400 font-mono font-bold">{user.wins}W</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-neutral-600 text-sm">No wins recorded yet...</p>
              )}
            </div>
          </section>

          {/* Battle Log */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              📜 Battle Log
            </h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      <span className="text-cyan-400">{event.caster_name}</span>
                      <span className="text-neutral-500 mx-1">vs</span>
                      <span className="text-purple-400">{event.target_name}</span>
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${resultBadge(event.result)}`}>
                      {event.result}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {event.caster_spell} <span className="text-neutral-600">vs</span> {event.target_spell}
                  </p>
                  {event.winner && event.winner !== "Draw" && (
                    <p className="text-xs text-yellow-400 font-semibold">🏆 {event.winner} wins</p>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-neutral-600 text-sm">Waiting for Twitch redemptions...</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
