import type { CardBlueprint } from '../types/card';
import { NORMAL_CARDS } from './normalCards';
import { WEATHER_CARDS } from './weatherCards';

export { NORMAL_CARDS, WEATHER_CARDS };

const merged = { ...NORMAL_CARDS, ...WEATHER_CARDS };

export const CARDS_DATA: Record<string, CardBlueprint> = Object.fromEntries(
  Object.entries(merged).sort(([, a], [, b]) => (b.rng || 0) - (a.rng || 0))
);