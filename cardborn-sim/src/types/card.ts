// Ordre absolu et immuable des tiers dans tout le projet
export const TIER_ORDER = ['shiny', 'awakened', 'fabled', 'corrupted', 'void'] as const;
export type TierKey = typeof TIER_ORDER[number];

export const TIER_CONFIG: { key: TierKey; label: string; fullLabel: string }[] = [
  { key: 'shiny', label: 'SH', fullLabel: 'Shiny' },
  { key: 'awakened', label: 'AW', fullLabel: 'Awakened' },
  { key: 'fabled', label: 'FB', fullLabel: 'Fabled' },
  { key: 'corrupted', label: 'CR', fullLabel: 'Corrupted' },
  { key: 'void', label: 'VD', fullLabel: 'Void' }
];

export type WeatherKey =
  | 'none'
  | 'travelling_caravan'
  | 'gnome_raid'
  | 'iron_legion'
  | 'new_years_festival'
  | 'glaring_sun'
  | 'dragons_roost'
  | 'warrior_path'
  | 'shadowed_world'
  | 'black_hole'
  | 'rip_in_time';

export type CombatEvent =
  | { type: 'turn_start'; turn: number; side: 'team1' | 'team2'; cardName: string; cardTheme?: string | null }
  | { type: 'damage'; sourceCard: string; targetCard: string; amount: number; remainingHp: number; maxHp: number; side: 'team1' | 'team2'; abilityName?: string; sourceTheme?: string | null; targetTheme?: string | null }
  | { type: 'heal'; cardName: string; amount: number; currentHp: number; maxHp: number; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'shield'; cardName: string; shieldId: string; amount: number; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'barrier'; cardName: string; barrierId: string; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'status'; cardName: string; status: string; turns: number; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'stat_change'; cardName: string; stat: string; deltaText: string; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'revive'; cardName: string; hp: number; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null }
  | { type: 'summon'; cardName: string; summonedName: string; count: number; side: 'team1' | 'team2'; abilityName: string; cardTheme?: string | null; summonedTheme?: string | null }
  | { type: 'death'; cardName: string; side: 'team1' | 'team2'; cardTheme?: string | null }
  | { type: 'battle_end'; winner: 'team1' | 'team2'; totalTurns: number };
  
export interface AttackContext {
  strikeCount: number;
  target?: CardInstance;
  ignoreDefenses?: boolean;
}

export interface CombatContext {
  state: BattleState;
  self: CardInstance;
  target?: CardInstance;
  attacker?: CardInstance;
  defender?: CardInstance;
  victim?: CardInstance;
  currentAbilityName: string;
  damageEvent?: { amount: number; ignoreDefenses?: boolean };
  attackEvent?: { canceled: boolean };
  attackContext?: AttackContext;
  brokenShield?: { id: string; amount: number; sourceCard: CardInstance };

  dealDamage: (target: CardInstance, amount: number, type?: string) => void;
  heal: (target: CardInstance, amount: number) => void;
  addShield: (target: CardInstance, id: string, amount: number, turns?: number) => void;
  addBarrier: (target: CardInstance, id: string, turns?: number, absorb?: string) => void;
  applyStatus: (target: CardInstance, status: string, turns?: number) => void;
  revive: (target: CardInstance, hp: number) => void;
  summon: (cardKey: string, count?: number) => void;
  emitStatChange: (targetText: string, stat: string, deltaText: string) => void;

  allies: () => CardInstance[];
  enemies: () => CardInstance[];
  activeEnemy: () => CardInstance | undefined;
  lowestHpEnemy: () => CardInstance | undefined;
  deadAllies: () => CardInstance[];
}

export interface FunctionalAbility {
  name: string;
  maxUses?: number;
  trigger: {
    event: 'battle' | 'entry' | 'turn' | 'attack' | 'damage' | 'death' | 'shield_break';
    phase?: 'start' | 'before' | 'attack' | 'after' | 'end';
    actor?: 'self' | 'ally' | 'opponent' | 'self_shield' | 'team';
    killer?: 'self';
    filter?: 'first';
    shieldId?: string;
    relativePosition?: 'immediate_before';
  };
  condition?: (ctx: CombatContext) => boolean;
  run: (ctx: CombatContext) => void;
}

export interface CardBlueprint {
  name: string;
  rng: number;
  weather?: WeatherKey;
  baseDamage?: number;
  baseHealth?: number;
  croppedImageId?: string;
  tags?: string[];
  unshieldable?: boolean;
  abilities?: FunctionalAbility[];
  fabledAbilities?: FunctionalAbility[];
}

export interface CardInstance {
  id: string;
  side: 'team1' | 'team2';
  name: string;
  rng: number;
  tags: string[];
  unshieldable: boolean;
  maxHp: number;
  currentHp: number;
  health: number;
  damage: number;
  shields: { id: string; amount: number; duration_turns?: number; sourceCard: CardInstance }[];
  barriers: { id: string; duration_turns: number; absorb: string }[];
  statuses: Record<string, number>;
  isDead: boolean;
  hasPlayedTurn: boolean;
  hasEntered: boolean;
  turnCount: number;
  abilities: FunctionalAbility[];
  abilityUses: Record<number, number>;
  tiers: TierKey[];
}

export interface BattleState {
  turn: number;
  activeSide: 'team1' | 'team2';
  isFinished: boolean;
  winner: 'team1' | 'team2' | null;
  events: CombatEvent[];
  extraTurnSide?: 'team1' | 'team2';
  teams: {
    team1: CardInstance[];
    team2: CardInstance[];
  };
}

export interface BattleSimulationResult {
  winner: 'team1' | 'team2';
  totalTurns: number;
  finalTeams: {
    team1: CardInstance[];
    team2: CardInstance[];
  };
  events: CombatEvent[];
}