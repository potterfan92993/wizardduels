import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  SPELLS, MOCK_USERS, GameEvent, LeaderboardEntry, 
  getRandomSpell, getRandomUser, resolveDuel 
} from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Swords, Shield, Zap, History, ExternalLink, Play, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bgImage from "@assets/generated_images/dark_arcane_cyberpunk_background_with_neon_runes.png";
import { apiRequest } from "@/lib/queryClient";

export function Dashboard() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry>>({});

  // Initialize Leaderboard with mock users
  useEffect(() => {
    const initialLB: Record<string, LeaderboardEntry> = {};
    MOCK_USERS.forEach(u => {
      initialLB[u.id] = {
        userId: u.id,
        username: u.username,
        wins: 0,
        losses: 0,
        casts: 0
      };
    });
    setLeaderboard(initialLB);
  }, []);

  const simulateRedemption = () => {
    const caster = getRandomUser();
    const target = getRandomUser(caster.id);
    const spell = getRandomSpell();

    // In this simplified version, we just determine if the spell "hits" effectively
    // To make it a "Game", let's say:
    // Offensive spells always count as a "Win" against the target unless defended (not implemented in simple mode)
    // For now, let's just log the cast.
    
    // BUT the prompt asked for "Winner" logic: Offensive > Support > Defensive > Offensive
    // So let's simulate the target ALSO casting a random "Reaction" spell to determine the outcome.

    await apiRequest("POST", "/api/events/record", {
    type: "spell_cast",
    payload: { spell: selectedSpellName } // whatever your spell variable is
    });
    
    const targetReaction = getRandomSpell();
    const outcome = resolveDuel(spell, targetReaction);

    
    let winner: "CASTER" | "TARGET" | "DRAW" = "DRAW";
    let message = "";

    if (outcome === "WIN") {
      winner = "CASTER";
      message = `${caster.username}'s ${spell.name} overwhelmed ${target.username}'s ${targetReaction.name}!`;
    } else if (outcome === "LOSE") {
      winner = "TARGET";
      message = `${target.username}'s ${targetReaction.name} countered ${caster.username}'s ${spell.name}!`;
    } else {
      message = `Clash! ${spell.name} and ${targetReaction.name} cancel out!`;
    }

    const newEvent: GameEvent = {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      caster,
      target,
      casterSpell: spell,
      targetSpell: targetReaction,
      message,
      winner: winner === "CASTER" ? caster : (winner === "TARGET" ? target : undefined)
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 50));
    
    // Update Leaderboard
    setLeaderboard(prev => {
      const next = { ...prev };
      
      // Update Caster stats
      if (!next[caster.id]) next[caster.id] = { userId: caster.id, username: caster.username, wins: 0, losses: 0, casts: 0 };
      next[caster.id].casts += 1;
      if (winner === "CASTER") next[caster.id].wins += 1;
      if (winner === "TARGET") next[caster.id].losses += 1;

      // Update Target stats
      if (!next[target.id]) next[target.id] = { userId: target.id, username: target.username, wins: 0, losses: 0, casts: 0 };
      next[target.id].casts += 1;
      if (winner === "TARGET") next[target.id].wins += 1;
      if (winner === "CASTER") next[target.id].losses += 1;

      return next;
    });

    // Sync to Overlay
    localStorage.setItem("last_game_event", JSON.stringify(newEvent));
    // Trigger storage event manually for same-window testing if needed, though 'storage' event is strictly cross-tab.
    // In a real app we'd use a BroadcastChannel or WebSocket. 
  };

  const resetGame = () => {
    setEvents([]);
    const resetLB: Record<string, LeaderboardEntry> = {};
    MOCK_USERS.forEach(u => {
      resetLB[u.id] = {
        userId: u.id,
        username: u.username,
        wins: 0,
        losses: 0,
        casts: 0
      };
    });
    setLeaderboard(resetLB);
  };

  const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.wins - a.wins);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
        {/* Background Overlay */}
        <div 
            className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        />
        
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-xl z-10 flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    SPELLCASTER
                </h1>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Twitch Integration Mockup</p>
            </div>

            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Simulation Controls</h3>
                    <Button 
                        onClick={simulateRedemption}
                        className="w-full h-12 text-lg font-heading bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all hover:scale-[1.02]"
                    >
                        <Zap className="mr-2 h-5 w-5" /> Cast Random Spell
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={resetGame}
                        className="w-full border-muted-foreground/20 hover:bg-white/5"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Data
                    </Button>
                </div>

                <div className="space-y-4">
                     <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overlay</h3>
                     <p className="text-sm text-muted-foreground">
                         Open this link in OBS as a Browser Source to see spell effects.
                     </p>
                     <Link href="/overlay" target="_blank">
                        <Button variant="secondary" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" /> Open Overlay Window
                        </Button>
                     </Link>
                </div>
            </div>

            <div className="p-6 border-t border-border bg-black/20">
                <div className="text-xs text-muted-foreground">
                    <p>Status: <span className="text-green-400 font-bold">● SIMULATION MODE</span></p>
                    <p className="mt-1">Backend: Disconnected</p>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col z-10 relative">
            <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center px-8 justify-between">
                <h2 className="text-xl font-heading text-white">Dashboard</h2>
                <div className="flex gap-4">
                    {/* Stats/Metrics could go here */}
                </div>
            </header>

            <div className="flex-1 p-8 overflow-hidden">
                <Tabs defaultValue="events" className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-muted/50 border border-white/5">
                            <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <History className="mr-2 h-4 w-4" /> Event Log
                            </TabsTrigger>
                            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                                <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="events" className="flex-1 overflow-hidden mt-0">
                        <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-heading tracking-wide">Recent Casts</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-0">
                                <ScrollArea className="h-full px-6 pb-6">
                                    <div className="space-y-3">
                                        <AnimatePresence mode="popLayout">
                                            {events.map((event) => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded bg-background/50 ${event.casterSpell.color}`}>
                                                                {<event.casterSpell.icon />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-primary">{event.caster.username}</span>
                                                                    <span className="text-muted-foreground text-sm">cast</span>
                                                                    <span className={`font-bold ${event.casterSpell.color}`}>{event.casterSpell.name}</span>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    vs {event.target.username}'s {event.targetSpell?.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-white mb-1">
                                                                {event.winner === event.caster ? "VICTORY" : event.winner === event.target ? "DEFEATED" : "DRAW"}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(event.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {events.length === 0 && (
                                                <div className="text-center py-20 text-muted-foreground">
                                                    No spells cast yet. Start the simulation!
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="leaderboard" className="flex-1 overflow-hidden mt-0">
                        <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-heading tracking-wide">Top Casters</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-full px-6">
                                    <div className="space-y-1">
                                        {sortedLeaderboard.map((entry, index) => (
                                            <div 
                                                key={entry.userId}
                                                className="flex items-center p-4 rounded hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <div className="w-12 font-heading text-2xl font-bold text-muted-foreground/50">
                                                    #{index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-white">{entry.username}</h3>
                                                    <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                                        <span>Casts: {entry.casts}</span>
                                                        <span className="text-red-400">Losses: {entry.losses}</span>
                                                    </div>
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
