import type { AttackContext, BattleState, CardBlueprint, CardInstance, CombatContext, FunctionalAbility, TierKey } from '../types/card';
import { calculateEffectiveStats, getTierThemeKey } from './formulas';
import { CARDS_DATA } from '../data/cards';

export interface RawEventContext {
  event: FunctionalAbility['trigger']['event'];
  phase?: FunctionalAbility['trigger']['phase'];
  state: BattleState;
  sourceCard?: CardInstance;
  targetCard?: CardInstance;
  defender?: CardInstance;
  attacker?: CardInstance;
  victim?: CardInstance;
  currentAbilityName?: string;
  damageEvent?: { amount: number; ignoreDefenses?: boolean };
  attackEvent?: { canceled: boolean };
  attackContext?: AttackContext;
  brokenShield?: { id: string; amount: number; sourceCard: CardInstance };
}

export function createCardInstance(
  blueprint: CardBlueprint,
  id: string,
  side: 'team1' | 'team2',
  appliedTiers: TierKey[] = []
): CardInstance {
  const isFabled = appliedTiers.includes('fabled');
  const abilityList = (isFabled && blueprint.fabledAbilities)
    ? blueprint.fabledAbilities
    : (blueprint.abilities || []);

  const stats = (blueprint.baseDamage && blueprint.baseHealth)
    ? { damage: blueprint.baseDamage, health: blueprint.baseHealth }
    : calculateEffectiveStats(blueprint.rng || 100, appliedTiers, blueprint.weather || 'none');

  return {
    id,
    side,
    name: blueprint.name,
    rng: blueprint.rng || 100,
    tags: [...(blueprint.tags || [])],
    unshieldable: Boolean(blueprint.unshieldable),
    maxHp: stats.health,
    currentHp: stats.health,
    health: stats.health,
    damage: stats.damage,
    shields: [],
    barriers: [],
    statuses: {},
    isDead: false,
    hasPlayedTurn: false,
    hasEntered: false,
    turnCount: 0,
    abilities: abilityList,
    abilityUses: {},
    tiers: [...appliedTiers]
  };
}

export class Dispatcher {
  static createCombatContext(raw: RawEventContext, card: CardInstance, abilityName: string): CombatContext {
    const enemySide = card.side === 'team1' ? 'team2' : 'team1';

    return {
      ...raw,
      self: card,
      target: raw.targetCard,
      attacker: raw.attacker,
      defender: raw.defender,
      victim: raw.victim,
      currentAbilityName: abilityName,

      allies: () => raw.state.teams[card.side].filter(c => !c.isDead),
      enemies: () => raw.state.teams[enemySide].filter(c => !c.isDead),
      activeEnemy: () => raw.state.teams[enemySide].find(c => !c.isDead),
      lowestHpEnemy: () => {
        const pool = raw.state.teams[enemySide].filter(c => !c.isDead);
        return pool.sort((a, b) => a.currentHp - b.currentHp)[0];
      },
      deadAllies: () => raw.state.teams[card.side].filter(c => c.isDead && c !== card),

      dealDamage: (t, amount, type = 'normal') => {
        if (!t) return;
        Dispatcher.applyDamage(t, amount, card, raw.state, type, abilityName);
      },
      heal: (t, amount) => {
        if (!t || t.isDead) return;
        const prev = t.currentHp;
        t.currentHp = Math.min(t.maxHp, t.currentHp + amount);
        raw.state.events.push({
          type: 'heal',
          cardName: t.name,
          amount: t.currentHp - prev,
          currentHp: t.currentHp,
          maxHp: t.maxHp,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(t.tiers)
        });
      },
      addShield: (t, id, amount, duration_turns) => {
        if (!t || t.unshieldable) return;
        t.shields.push({ id, amount, duration_turns, sourceCard: card });
        raw.state.events.push({
          type: 'shield',
          cardName: t.name,
          shieldId: id,
          amount,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(t.tiers)
        });
      },
      addBarrier: (t, id, duration_turns = 1, absorb = 'all') => {
        if (!t) return;
        t.barriers.push({ id, duration_turns, absorb });
        raw.state.events.push({
          type: 'barrier',
          cardName: t.name,
          barrierId: id,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(t.tiers)
        });
      },
      applyStatus: (t, status, duration_turns = 1) => {
        if (!t) return;
        t.statuses[status] = (t.statuses[status] || 0) + duration_turns;
        raw.state.events.push({
          type: 'status',
          cardName: t.name,
          status,
          turns: duration_turns,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(t.tiers)
        });
      },
      revive: (t, hp) => {
        if (!t) return;
        t.isDead = false;
        t.currentHp = Math.max(1, hp);
        raw.state.events.push({
          type: 'revive',
          cardName: t.name,
          hp: t.currentHp,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(t.tiers)
        });
      },
      summon: (cardKey: string, count = 1) => {
        const bp = CARDS_DATA[cardKey];
        if (!bp) return;
        for (let i = 0; i < count; i++) {
          const summonId = `${card.side}_summon_${raw.state.turn}_${Math.random().toString(36).slice(2, 6)}`;
          const summonedCard = createCardInstance(bp, summonId, card.side, []);
          raw.state.teams[card.side].push(summonedCard);
        }
        raw.state.events.push({
          type: 'summon',
          cardName: card.name,
          summonedName: bp.name,
          count,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(card.tiers),
          summonedTheme: null
        });
      },
      emitStatChange: (targetText, stat, deltaText) => {
        raw.state.events.push({
          type: 'stat_change',
          cardName: targetText,
          stat,
          deltaText,
          side: card.side,
          abilityName,
          cardTheme: getTierThemeKey(card.tiers)
        });
      }
    };
  }

  static matchesTrigger(card: CardInstance, trigger: FunctionalAbility['trigger'], raw: RawEventContext): boolean {
    if (trigger.event !== raw.event) return false;
    if (trigger.phase && trigger.phase !== raw.phase) return false;
    if (trigger.actor === 'self' && raw.sourceCard !== card) return false;
    if (trigger.actor === 'ally' && (!raw.sourceCard || raw.sourceCard.side !== card.side || raw.sourceCard === card)) return false;
    if (trigger.actor === 'opponent') {
      const isOppSource = raw.sourceCard && raw.sourceCard.side !== card.side;
      const isOppAttacker = raw.attacker && raw.attacker.side !== card.side;
      if (!isOppSource && !isOppAttacker) return false;
    }
    if (trigger.actor === 'team' && raw.sourceCard && raw.sourceCard.side !== card.side) return false;
    if (trigger.actor === 'self_shield' && raw.brokenShield?.sourceCard !== card) return false;
    if (trigger.killer === 'self' && raw.attacker !== card) return false;
    if (trigger.relativePosition === 'immediate_before') {
      const team = raw.state.teams[card.side];
      if (!raw.victim || team.indexOf(raw.victim) !== team.indexOf(card) - 1) return false;
    }
    if (trigger.filter === 'first' && raw.sourceCard?.hasPlayedTurn) return false;
    if (trigger.shieldId && raw.brokenShield?.id !== trigger.shieldId) return false;
    return true;
  }

  static emit(raw: RawEventContext) {
    const allCards = [...raw.state.teams.team1, ...raw.state.teams.team2];

    for (const card of allCards) {
      if (!card.abilities) continue;

      card.abilities.forEach((ability, aIdx) => {
        if (!Dispatcher.matchesTrigger(card, ability.trigger, raw)) return;

        if (ability.maxUses) {
          card.abilityUses[aIdx] = card.abilityUses[aIdx] || 0;
          if (card.abilityUses[aIdx] >= ability.maxUses) return;
        }

        const ctx = Dispatcher.createCombatContext(raw, card, ability.name);
        if (ability.condition && !ability.condition(ctx)) return;

        if (ability.maxUses) card.abilityUses[aIdx]++;
        ability.run(ctx);
      });
    }
  }

  static applyDamage(
    target: CardInstance,
    rawAmount: number,
    attacker: CardInstance,
    state: BattleState,
    type = 'normal',
    sourceAbilityName?: string,
    ignoreDefenses = false
  ) {
    if (!target || target.isDead) return;

    const shouldIgnoreDefenses = ignoreDefenses || (attacker.tags.includes('warrior_path') && attacker.name === 'Duelist');
    const damageEvent = { amount: rawAmount, ignoreDefenses: shouldIgnoreDefenses };

    Dispatcher.emit({ event: 'damage', phase: 'before', state, sourceCard: target, attacker, damageEvent });
    let dmg = damageEvent.amount;

    if (!damageEvent.ignoreDefenses) {
      const barrierIdx = target.barriers.findIndex(b => b.absorb === 'all' && b.duration_turns > 0);
      if (barrierIdx !== -1) {
        const barrier = target.barriers[barrierIdx];
        target.barriers.splice(barrierIdx, 1);
        state.events.push({
          type: 'damage',
          sourceCard: attacker.name,
          targetCard: target.name,
          amount: 0,
          remainingHp: target.currentHp,
          maxHp: target.maxHp,
          side: target.side,
          abilityName: sourceAbilityName || barrier.id || 'Barrier',
          sourceTheme: getTierThemeKey(attacker.tiers),
          targetTheme: getTierThemeKey(target.tiers)
        });
        return;
      }

      if (target.shields.length > 0) {
        for (let i = target.shields.length - 1; i >= 0; i--) {
          const s = target.shields[i];
          if (dmg >= s.amount) {
            dmg -= s.amount;
            s.amount = 0;
            const brokenShield = target.shields.splice(i, 1)[0];
            Dispatcher.emit({ event: 'shield_break', phase: 'start', state, brokenShield, targetCard: target, attacker });
          } else {
            s.amount -= dmg;
            dmg = 0;
            break;
          }
        }
      }
    }

    target.currentHp = Math.max(0, target.currentHp - dmg);
    state.events.push({
      type: 'damage',
      sourceCard: attacker.name,
      targetCard: target.name,
      amount: dmg,
      remainingHp: target.currentHp,
      maxHp: target.maxHp,
      side: attacker.side,
      abilityName: sourceAbilityName,
      sourceTheme: getTierThemeKey(attacker.tiers),
      targetTheme: getTierThemeKey(target.tiers)
    });

    if (type !== 'reflected') {
      Dispatcher.emit({ event: 'damage', phase: 'after', state, sourceCard: target, victim: target, attacker, damageEvent: { amount: dmg } });
    }

    if (target.currentHp <= 0) {
      target.isDead = true;
      state.events.push({
        type: 'death',
        cardName: target.name,
        side: target.side,
        cardTheme: getTierThemeKey(target.tiers)
      });
      Dispatcher.emit({ event: 'death', phase: 'after', state, sourceCard: target, victim: target, attacker });

      if (target.currentHp > 0) {
        target.isDead = false;
      }
    }
  }
}