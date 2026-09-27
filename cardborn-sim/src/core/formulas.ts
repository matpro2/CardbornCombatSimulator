import { TIER_ORDER, type TierKey, type WeatherKey } from '../types/card';

export const WEATHER_VALUES: Record<WeatherKey, number> = {
  none: 1,
  travelling_caravan: 1,
  gnome_raid: 1,
  iron_legion: 1,
  new_years_festival: 1,
  glaring_sun: 1,
  dragons_roost: 1,
  warrior_path: 1,
  shadowed_world: 1,
  black_hole: 1,
  rip_in_time: 1,
};

export const TIER_VALUES: Record<TierKey, number> = {
  shiny: 100,
  awakened: 1_000_000,
  fabled: 10_000,
  corrupted: 100_000,
  void: 10_000_000
};

export function computeMultiplier(tiers: TierKey[], customMult = 1): number {
  return tiers.reduce((acc, t) => acc * (TIER_VALUES[t] || 1), customMult);
}

export function computeStatsFromRng(rng: number) {
  const val = Math.max(1, Number(rng) || 1);
  const damage = Math.round(2.64 * Math.pow(val, 0.347) + 3);
  const health = Math.round(damage * 2);
  return { health, damage };
}

export function calculateEffectiveStats(
  baseRng: number,
  tiers: TierKey[] = [],
  weatherKey: WeatherKey = 'none',
  customMult = 1
) {
  const weatherMult = WEATHER_VALUES[weatherKey] ?? 1;
  const tierMultiplier = computeMultiplier(tiers, customMult);
  const effectiveRng = (baseRng || 100) * weatherMult * tierMultiplier;
  const { health, damage } = computeStatsFromRng(effectiveRng);
  return { damage, health, effectiveRng, multiplier: weatherMult * tierMultiplier };
}

export function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const units: [number, string][] = [
    [1e18, 'Qi'], [1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']
  ];
  for (const [divisor, suffix] of units) {
    if (Math.abs(n) >= divisor) {
      return (n / divisor).toFixed(1).replace(/\.0$/, '') + suffix;
    }
  }
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Résolution automatique du thème visuel.
 * Filtre les tiers actifs selon l'ordre absolu et les joint avec un underscore ("_").
 * Exemple : ['corrupted', 'shiny'] => "shiny_corrupted"
 */
export function getTierThemeKey(tiers: TierKey[] = []): string | null {
  if (!tiers || tiers.length === 0) return null;
  const activeSorted = TIER_ORDER.filter(t => tiers.includes(t));
  return activeSorted.length > 0 ? activeSorted.join('_') : null;
}