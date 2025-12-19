import { LucideIcon, Wand2, Lock, Eye, Volume2, Shield, ArrowDown, ArrowUp, User, Wrench, Wind, Feather, Leaf, Zap, Lightbulb, CheckCircle, Skull, Binoculars, Wand, Cloud, Sword } from "lucide-react";

export type SpellType = "OFFENSIVE" | "DEFENSIVE" | "SUPPORT";

export interface Spell {
  id: string;
  name: string;
  type: SpellType;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  caster: User;
  target: User;
  casterSpell: Spell;
  targetSpell?: Spell;
  winner?: User;
  message: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  casts: number;
}

export const SPELLS: Spell[] = [
  // Support
  { id: "s1", name: "Alohomora", type: "SUPPORT", description: "Opens locked objects", icon: Lock, color: "text-emerald-400" },
  { id: "s2", name: "Aparecium", type: "SUPPORT", description: "Reveals invisible ink", icon: Eye, color: "text-cyan-300" },
  { id: "s3", name: "Descendo", type: "SUPPORT", description: "Lowers caster down", icon: ArrowDown, color: "text-blue-400" },
  { id: "s4", name: "Ascendio", type: "SUPPORT", description: "Lifts caster into the air", icon: ArrowUp, color: "text-indigo-400" },
  { id: "s5", name: "Reparo", type: "SUPPORT", description: "Repairs objects", icon: Wrench, color: "text-orange-400" },
  { id: "s6", name: "Wingardium Leviosa", type: "SUPPORT", description: "Makes objects fly", icon: Feather, color: "text-violet-300" },
  { id: "s7", name: "Lumos & Nox", type: "SUPPORT", description: "Illuminates and darkens wand tip", icon: Lightbulb, color: "text-yellow-300" },

  // Offensive
  { id: "o1", name: "Mimblewimble", type: "OFFENSIVE", description: "Tongue-ties victim from speaking", icon: Volume2, color: "text-red-500" },
  { id: "o2", name: "Silencio", type: "OFFENSIVE", description: "Temporarily silences victim", icon: Volume2, color: "text-pink-500" },
  { id: "o3", name: "Imperio", type: "OFFENSIVE", description: "Controls opponent's freewill", icon: User, color: "text-purple-600" },
  { id: "o4", name: "Arresto Momentum", type: "OFFENSIVE", description: "Slows or stops a target's velocity", icon: Wind, color: "text-blue-600" },
  { id: "o5", name: "Crucio", type: "OFFENSIVE", description: "Tortures opponent", icon: Zap, color: "text-red-600" },
  { id: "o6", name: "Oppugno", type: "OFFENSIVE", description: "Directs objects to attack victim", icon: Wand, color: "text-red-700" },
  { id: "o7", name: "Avada Kedavra", type: "OFFENSIVE", description: "Kills opponent", icon: Skull, color: "text-green-600" },

  // Defensive
  { id: "d1", name: "Specialis Revelio", type: "DEFENSIVE", description: "Reveals charms or hexes", icon: Eye, color: "text-teal-400" },
  { id: "d2", name: "Herbivicus", type: "DEFENSIVE", description: "Promotes plant growth", icon: Leaf, color: "text-green-400" },
  { id: "d3", name: "Finite Incantatem", type: "DEFENSIVE", description: "Terminates all spell effects", icon: CheckCircle, color: "text-amber-400" },
  { id: "d4", name: "Stupefy", type: "DEFENSIVE", description: "Renders target unconscious", icon: Shield, color: "text-indigo-300" },
  { id: "d5", name: "Revelio", type: "DEFENSIVE", description: "Reveals hidden objects", icon: Binoculars, color: "text-cyan-400" },
  { id: "d6", name: "Meteolojinx Recanto", type: "DEFENSIVE", description: "Ends weather effects from incantations", icon: Cloud, color: "text-slate-300" },
  { id: "d7", name: "Expelliarmus", type: "DEFENSIVE", description: "Disarms opponent", icon: Sword, color: "text-yellow-400" },
];

export const MOCK_USERS: User[] = [
  { id: "u1", username: "NinjaCaster99" },
  { id: "u2", username: "MageGirl_2024" },
  { id: "u3", username: "TheTankStreamer" },
  { id: "u4", username: "HealerMain_BTW" },
  { id: "u5", username: "LurkerLog" },
  { id: "u6", username: "ModBot_3000" },
  { id: "u7", username: "SpeedRunnerX" },
];

export function getRandomSpell(): Spell {
  return SPELLS[Math.floor(Math.random() * SPELLS.length)];
}

export function getRandomUser(excludeId?: string): User {
  const pool = excludeId ? MOCK_USERS.filter(u => u.id !== excludeId) : MOCK_USERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function resolveDuel(spell1: Spell, spell2: Spell): "WIN" | "LOSE" | "DRAW" {
  if (spell1.type === spell2.type) return "DRAW";
  if (spell1.type === "OFFENSIVE" && spell2.type === "SUPPORT") return "WIN";
  if (spell1.type === "SUPPORT" && spell2.type === "DEFENSIVE") return "WIN";
  if (spell1.type === "DEFENSIVE" && spell2.type === "OFFENSIVE") return "WIN";
  return "LOSE";
}
