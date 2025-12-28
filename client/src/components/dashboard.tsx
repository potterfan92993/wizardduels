import { useState, useEffect } from "react";
import { SPELLS } from "@/lib/game-data";
import bgImage from "@assets/generated_images/dark_arcane_cyberpunk_background_with_neon_runes.png";

export function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch real data from your Render backend
  const fetchData = async () => {
    try {
      const lbRes = await fetch("/api/leaderboard");
      const lbData = await lbRes.json();
      setLeaderboard(lbData);

      const evRes = await fetch("/api/events/latest");
      const evData = await evRes.json();
      if (evData.id) setEvents([evData]);
    } catch (err) {
      console.error("Data fetch failed", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
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
        <header className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            WIZARD BATTLE ADMIN
          </h1>
          <p className="text-neutral-500 uppercase tracking-widest text-xs mt-2">Live Twitch Integration Status</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: Leaderboard */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              🏆 Top Wizards
            </h2>
            <div className="space-y-4">
              {leaderboard.map((user, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="font-medium text-neutral-300">#{i + 1} {user.username}</span>
                  <span className="text-cyan-400 font-mono font-bold">{user.wins} Wins</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-neutral-600">No data yet...</p>}
            </div>
          </section>

          {/* Right Side: Live Logs */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              📜 Battle Logs
            </h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    <span className="text-cyan-400 font-bold">{event.caster_name}</span> vs <span className="text-purple-400 font-bold">{event.target_name}</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-2 italic">"{event.message}"</p>
                </div>
              ))}
              {events.length === 0 && <p className="text-neutral-600">Waiting for Twitch redemptions...</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
