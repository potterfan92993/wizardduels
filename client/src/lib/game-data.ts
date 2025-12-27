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

export function getRandomSpell(): Spell {
  return SPELLS[Math.floor(Math.random() * SPELLS.length)];
}

export function getRandomUser(excludeId?: string): User {
  const pool = excludeId ? MOCK_USERS.filter(u => u.id !== excludeId) : MOCK_USERS;
  return pool[Math.floor(Math.random() * pool.length)];
}
