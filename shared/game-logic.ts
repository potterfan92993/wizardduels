export type SpellType = "OFFENSIVE" | "DEFENSIVE" | "SUPPORT";

export interface Spell {
  id: string;
  name: string;
  type: SpellType;
  description: string;
  color: string;
}

export const SPELLS: Omit<Spell, "icon">[] = [
  // Support
  { id: "s1", name: "Alohomora", type: "SUPPORT", description: "Opens locked objects", color: "text-emerald-400" },
  { id: "s2", name: "Aparecium", type: "SUPPORT", description: "Reveals invisible ink", color: "text-cyan-300" },
  { id: "s3", name: "Descendo", type: "SUPPORT", description: "Lowers caster down", color: "text-blue-400" },
  { id: "s4", name: "Ascendio", type: "SUPPORT", description: "Lifts caster into the air", color: "text-indigo-400" },
  { id: "s5", name: "Reparo", type: "SUPPORT", description: "Repairs objects", color: "text-orange-400" },
  { id: "s6", name: "Wingardium Leviosa", type: "SUPPORT", description: "Makes objects fly", color: "text-violet-300" },
  { id: "s7", name: "Lumos & Nox", type: "SUPPORT", description: "Illuminates and darkens wand tip", color: "text-yellow-300" },

  // Offensive
  { id: "o1", name: "Mimblewimble", type: "OFFENSIVE", description: "Tongue-ties victim from speaking", color: "text-red-500" },
  { id: "o2", name: "Silencio", type: "OFFENSIVE", description: "Temporarily silences victim", color: "text-pink-500" },
  { id: "o3", name: "Imperio", type: "OFFENSIVE", description: "Controls opponent's freewill", color: "text-purple-600" },
  { id: "o4", name: "Arresto Momentum", type: "OFFENSIVE", description: "Slows or stops a target's velocity", color: "text-blue-600" },
  { id: "o5", name: "Crucio", type: "OFFENSIVE", description: "Tortures opponent", color: "text-red-600" },
  { id: "o6", name: "Oppugno", type: "OFFENSIVE", description: "Directs objects to attack victim", color: "text-red-700" },
  { id: "o7", name: "Avada Kedavra", type: "OFFENSIVE", description: "Kills opponent", color: "text-green-600" },

  // Defensive
  { id: "d1", name: "Specialis Revelio", type: "DEFENSIVE", description: "Reveals charms or hexes", color: "text-teal-400" },
  { id: "d2", name: "Herbivicus", type: "DEFENSIVE", description: "Promotes plant growth", color: "text-green-400" },
  { id: "d3", name: "Finite Incantatem", type: "DEFENSIVE", description: "Terminates all spell effects", color: "text-amber-400" },
  { id: "d4", name: "Stupefy", type: "DEFENSIVE", description: "Renders target unconscious", color: "text-indigo-300" },
  { id: "d5", name: "Revelio", type: "DEFENSIVE", description: "Reveals hidden objects", color: "text-cyan-400" },
  { id: "d6", name: "Meteolojinx Recanto", type: "DEFENSIVE", description: "Ends weather effects from incantations", color: "text-slate-300" },
  { id: "d7", name: "Expelliarmus", type: "DEFENSIVE", description: "Disarms opponent", color: "text-yellow-400" },
];

export function resolveDuel(spell1: any, spell2: any): "WIN" | "LOSE" | "DRAW" {
  if (spell1.type === spell2.type) return "DRAW";
  if (spell1.type === "OFFENSIVE" && spell2.type === "SUPPORT") return "WIN";
  if (spell1.type === "SUPPORT" && spell2.type === "DEFENSIVE") return "WIN";
  if (spell1.type === "DEFENSIVE" && spell2.type === "OFFENSIVE") return "WIN";
  return "LOSE";
}
