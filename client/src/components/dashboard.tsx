import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  SPELLS, GameEvent, LeaderboardEntry, 
  getRandomSpell, getRandomUser, resolveDuel 
} from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Swords, Shield, Zap, History, ExternalLink, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bgImage from "@assets/generated_images/dark_arcane_cyberpunk_background_with_neon_runes.png";
import { apiRequest } from "@/lib/queryClient";

export function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. FETCH REAL DATA FROM BACKEND ---
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      setLeaderboard(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  };

  const fetchLatestEvents = async () => {
    try {
      const response = await fetch("/api/events/latest");
      const data = await response.json();
      // Since 'latest' returns one object, we wrap it in an array or handle accordingly
      if (data.id) setEvents([data]); 
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchLatestEvents();
    // Refresh every 10 seconds to keep dashboard live
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. UPDATED SIMULATION (Now uses Real Database) ---
  const simulateRedemption = async () => {
    const caster = getRandomUser();
    const target = getRandomUser(caster.id);
    const spell = getRandomSpell();
    const targetReaction = getRandomSpell();
    const outcome = resolveDuel(spell, targetReaction);

    let winnerName = "None";
    let resultStatus = "DRAW";

    if (outcome === "WIN") {
      winnerName = caster.username;
      resultStatus = "VICTORY";
    } else if (outcome === "LOSE") {
      winnerName = target.username;
      resultStatus = "DEFEAT";
    }

    try {
      await apiRequest("POST", "/api/events/record", {
        caster_id: caster.id,
        caster_name: caster.username,
        target_id: target.id,
        target_name: target.username,
        caster_spell: spell.name,
        target_spell: targetReaction.name,
        winner: winnerName,
        result: resultStatus,
        message: `${caster.username} cast ${spell.name} against ${target.username}!`
      });
      
      // Refresh data after simulation
      fetchLeaderboard();
      fetchLatestEvents();
    } catch (error) {
      console.error("Database save failed:", error);
    }
  };

  const resetGame = () => {
    // In live mode, we don't reset the DB from the UI for security, 
    // but we can clear the local view.
    setEvents([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
        <div 
            className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        />
        
        <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-xl z-10 flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    SPELLCASTER
                </h1>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Live Dashboard</p>
            </div>

            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Manual Trigger</h3>
                    <Button 
                        onClick={simulateRedemption}
                        className="w-full h-12 text-lg font-heading bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all hover:scale-[1.02]"
                    >
                        <Zap className="mr-2 h-5 w-5" /> Test Duel
                    </Button>
                </div>

                <div className="space-y-4">
                     <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stream Overlay</h3>
                     <p className="text-sm text-muted-foreground">
                         URL for OBS Browser Source:
                     </p>
                     <Link href="/overlay" target="_blank">
                        <Button variant="secondary" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" /> Open Overlay
                        </Button>
                     </Link>
                </div>
            </div>

            <div className="p-6 border-t border-border bg-black/20">
                <div className="text-xs text-muted-foreground">
                    <p>Status: <span className="text-green-400 font-bold">● LIVE DATA</span></p>
                    <p className="mt-1">Connected to Supabase</p>
                </div>
            </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col z-10 relative">
            <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center px-8 justify-between">
                <h2 className="text-xl font-heading text-white">Battle Statistics</h2>
            </header>

            <div className="flex-1 p-8 overflow-hidden">
                <Tabs defaultValue="events" className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-muted/50 border border-white/5">
                            <TabsTrigger value="events">
                                <History className="mr-2 h-4 w-4" /> Recent Duels
                            </TabsTrigger>
                            <TabsTrigger value="leaderboard">
                                <Trophy className="mr-2 h-4 w-4" /> Top Casters
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="events" className="flex-1 overflow-hidden mt-0">
                        <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md flex flex-col">
                            <CardContent className="flex-1 overflow-hidden p-6">
                                <ScrollArea className="h-full">
                                    <div className="space-y-3">
                                        {events.map((event) => (
                                            <div key={event.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex justify-between items-center">
                                                  <div>
                                                    <span className="font-bold text-primary">{event.caster_name}</span>
                                                    <span className="mx-2 text-muted-foreground text-sm text-white">vs</span>
                                                    <span className="font-bold text-secondary">{event.target_name}</span>
                                                  </div>
                                                  <div className="text-sm text-primary font-bold">{event.result}</div>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2 italic">"{event.message}"</p>
                                            </div>
                                        ))}
                                        {events.length === 0 && (
                                            <div className="text-center py-20 text-muted-foreground">Waiting for the first duel...</div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="leaderboard" className="flex-1 overflow-hidden mt-0">
                        <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md flex flex-col">
                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-full px-6">
                                    <div className="space-y-1">
                                        {leaderboard.map((entry, index) => (
                                            <div key={entry.username} className="flex items-center p-4 border-b border-white/5 last:border-0">
                                                <div className="w-12 font-heading text-2xl font-bold text-muted-foreground/50">#{index + 1}</div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-white">{entry.username}</h3>
                                                    <div className="text-xs text-muted-foreground">Casts: {entry.casts}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-heading text-primary">{entry.wins}</span>
                                                    <p className="text-xs text-primary/70 uppercase">Wins</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}
