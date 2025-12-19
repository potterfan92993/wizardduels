import { LucideIcon, Swords, Shield, Wand, Zap, Skull, Heart, Star, Flame, Droplet, Wind, Mountain } from "lucide-react";

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
  targetSpell?: Spell; // For future clashes
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
  // Offensive (Beats Support)
  { id: "o1", name: "Fireball", type: "OFFENSIVE", description: "A classic ball of searing flame.", icon: Flame, color: "text-red-500" },
  { id: "o2", name: "Lightning Bolt", type: "OFFENSIVE", description: "Strikes with the fury of the storm.", icon: Zap, color: "text-yellow-400" },
  { id: "o3", name: "Void Spike", type: "OFFENSIVE", description: "A spike of pure darkness.", icon: Skull, color: "text-purple-500" },
  { id: "o4", name: "Blade Dance", type: "OFFENSIVE", description: "Summons spectral blades.", icon: Swords, color: "text-orange-500" },
  { id: "o5", name: "Magma Eruption", type: "OFFENSIVE", description: "The ground explodes beneath them.", icon: Mountain, color: "text-red-600" },
  { id: "o6", name: "Acid Splash", type: "OFFENSIVE", description: "Corrosive alchemy.", icon: Droplet, color: "text-green-500" },
  { id: "o7", name: "Mind Blast", type: "OFFENSIVE", description: "Psychic assault.", icon: Wind, color: "text-pink-500" },

  // Defensive (Beats Offensive)
  { id: "d1", name: "Arcane Shield", type: "DEFENSIVE", description: "Blocks incoming magic.", icon: Shield, color: "text-blue-400" },
  { id: "d2", name: "Ice Wall", type: "DEFENSIVE", description: "A frozen barrier.", icon: Mountain, color: "text-cyan-300" },
  { id: "d3", name: "Mirror Image", type: "DEFENSIVE", description: "Confuses the attacker.", icon: Star, color: "text-indigo-300" },
  { id: "d4", name: "Stone Skin", type: "DEFENSIVE", description: "Hardens skin to rock.", icon: Mountain, color: "text-stone-400" },
  { id: "d5", name: "Wind Barrier", type: "DEFENSIVE", description: "Deflects projectiles.", icon: Wind, color: "text-teal-300" },
  { id: "d6", name: "Phase Shift", type: "DEFENSIVE", description: "Briefly step into the void.", icon: Zap, color: "text-purple-300" },
  { id: "d7", name: "Divine Ward", type: "DEFENSIVE", description: "Holy protection.", icon: Shield, color: "text-yellow-200" },

  // Support (Beats Defensive)
  { id: "s1", name: "Healing Mist", type: "SUPPORT", description: "Soothing vapors.", icon: Heart, color: "text-green-400" },
  { id: "s2", name: "Mana Surge", type: "SUPPORT", description: "Boosts magical power.", icon: Wand, color: "text-blue-500" },
  { id: "s3", name: "Time Warp", type: "SUPPORT", description: "Alters the flow of time.", icon: Wind, color: "text-indigo-400" },
  { id: "s4", name: "Blessing", type: "SUPPORT", description: "Divine favor.", icon: Star, color: "text-yellow-300" },
  { id: "s5", name: "Polymorph", type: "SUPPORT", description: "Turns threats harmless.", icon: Wand, color: "text-pink-400" },
  { id: "s6", name: "Invisibility", type: "SUPPORT", description: "Unseen movement.", icon: Wind, color: "text-gray-400" },
  { id: "s7", name: "Dispel Magic", type: "SUPPORT", description: "Removes magical effects.", icon: Zap, color: "text-cyan-400" },
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
