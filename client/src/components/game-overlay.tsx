import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GameEvent } from "@/lib/game-data";

export function OverlayDisplay() {
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

  useEffect(() => {
    // Listen for storage events to sync with dashboard
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "last_game_event" && e.newValue) {
        const event = JSON.parse(e.newValue);
        setCurrentEvent(event);
        // Clear event after 5 seconds
        setTimeout(() => setCurrentEvent(null), 5000);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!currentEvent) return null;

  const SpellIcon = currentEvent.casterSpell.icon;

  return (
    <div className="w-full h-screen flex items-center justify-center bg-transparent pointer-events-none overflow-hidden">
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 12 }}
        className="relative bg-black/80 border-4 border-primary rounded-3xl p-8 max-w-2xl text-center shadow-[0_0_50px_rgba(0,255,255,0.3)] backdrop-blur-md"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="text-right">
              <h2 className="text-2xl font-bold font-heading text-white">{currentEvent.caster.username}</h2>
              <p className="text-muted-foreground uppercase tracking-widest text-sm">Caster</p>
            </div>
            
            <div className={`p-6 rounded-full bg-background border-2 border-white/20 shadow-xl ${currentEvent.casterSpell.color}`}>
               <SpellIcon size={64} strokeWidth={1.5} />
            </div>

            <div className="text-left">
              <h2 className="text-2xl font-bold font-heading text-white">{currentEvent.target.username}</h2>
              <p className="text-muted-foreground uppercase tracking-widest text-sm">Target</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h1 className="text-4xl font-black font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary uppercase tracking-widest filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {currentEvent.casterSpell.name}
            </h1>
            <div className={`text-xl font-bold px-4 py-1 rounded bg-white/10 inline-block ${currentEvent.casterSpell.color}`}>
              {currentEvent.casterSpell.type}
            </div>
            <p className="text-lg text-gray-300 font-sans max-w-md mx-auto leading-relaxed">
              {currentEvent.message}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
