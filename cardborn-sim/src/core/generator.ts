import type { CardBlueprint, TierKey } from '../types/card';
import { calculateEffectiveStats, computeMultiplier, WEATHER_VALUES } from './formulas';

export interface SlotSelection {
  key: string;
  tiers: TierKey[];
}

export interface BalancedMatch {
  team1: SlotSelection[];
  team2: SlotSelection[];
  targetRng: number;
}

const TIER_POOL: TierKey[][] = [
  [],
  ['shiny'],
  ['fabled'],
  ['corrupted'],
  ['awakened'],
  ['void'],
  ['shiny', 'fabled'],
  ['shiny', 'corrupted'],
  ['shiny', 'awakened'],
  ['shiny', 'void'],
  ['awakened', 'fabled'],
  ['awakened', 'corrupted'],
  ['fabled', 'corrupted']
];

interface Candidate {
  key: string;
  tiers: TierKey[];
  effectiveRng: number;
  health: number;
  damage: number;
}

export function generateBalancedMatch(
  cardsDb: Record<string, CardBlueprint>,
  teamSize = 4
): BalancedMatch {
  const cardEntries = Object.entries(cardsDb).filter(([k]) => k !== 'dummy');

  const logTarget = 4 + Math.random() * 7;
  const targetRng = Math.pow(10, logTarget);

  const minRng = targetRng * 0.65;
  const maxRng = targetRng * 1.45;

  const pool: Candidate[] = [];

  for (const [key, card] of cardEntries) {
    const weatherMult = card.weather ? (WEATHER_VALUES[card.weather] || 1) : 1;
    for (const tiers of TIER_POOL) {
      const mult = computeMultiplier(tiers) * weatherMult;
      const eff = (card.rng || 100) * mult;

      if (eff >= minRng && eff <= maxRng) {
        const stats = calculateEffectiveStats(card.rng, tiers, card.weather || 'none');
        pool.push({
          key,
          tiers: [...tiers],
          effectiveRng: eff,
          health: stats.health,
          damage: stats.damage
        });
      }
    }
  }

  if (pool.length < teamSize * 2) {
    const fallbackKey = cardEntries[0][0];
    return {
      team1: Array(teamSize).fill(null).map(() => ({ key: fallbackKey, tiers: [] })),
      team2: Array(teamSize).fill(null).map(() => ({ key: fallbackKey, tiers: [] })),
      targetRng
    };
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const team1: Candidate[] = [];
  const team2: Candidate[] = [];

  for (let i = 0; i < teamSize; i++) {
    team1.push(shuffled[i % shuffled.length]);
  }
  for (let i = 0; i < teamSize - 1; i++) {
    team2.push(shuffled[(teamSize + i) % shuffled.length]);
  }

  // Équilibrage : la 4e carte comble le différentiel de puissance
  const t1TotalPower = team1.reduce((sum, c) => sum + c.health + c.damage, 0);
  const t2PartialPower = team2.reduce((sum, c) => sum + c.health + c.damage, 0);
  const neededPower = t1TotalPower - t2PartialPower;

  let bestCandidate = shuffled[0];
  let minDiff = Infinity;

  for (const cand of pool) {
    const diff = Math.abs((cand.health + cand.damage) - neededPower);
    if (diff < minDiff) {
      minDiff = diff;
      bestCandidate = cand;
    }
  }

  team2.push(bestCandidate);

  return {
    team1: team1.map(c => ({ key: c.key, tiers: c.tiers })),
    team2: team2.map(c => ({ key: c.key, tiers: c.tiers })),
    targetRng
  };
}