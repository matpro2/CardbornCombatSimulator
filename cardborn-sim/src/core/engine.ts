import type { AttackContext, BattleSimulationResult, BattleState, CardBlueprint, TierKey } from '../types/card';
import { TIER_VALUES, WEATHER_VALUES, getTierThemeKey } from './formulas';
import { Dispatcher, createCardInstance } from './dispatcher';

export { TIER_VALUES, WEATHER_VALUES, createCardInstance };

export class Engine {
  static initBattle(
    t1Blueprints: { bp: CardBlueprint; tiers: TierKey[] }[], 
    t2Blueprints: { bp: CardBlueprint; tiers: TierKey[] }[]
  ): BattleState {
    const state: BattleState = {
      turn: 0,
      activeSide: 'team1',
      isFinished: false,
      winner: null,
      events: [],
      teams: {
        team1: t1Blueprints.map((item, i) => createCardInstance(item.bp, `t1_${i}`, 'team1', item.tiers)),
        team2: t2Blueprints.map((item, i) => createCardInstance(item.bp, `t2_${i}`, 'team2', item.tiers))
      }
    };

    Dispatcher.emit({ event: 'battle', phase: 'start', state });

    (['team1', 'team2'] as const).forEach(side => {
      const first = state.teams[side].find(c => !c.isDead);
      if (first) {
        first.hasEntered = true;
        Dispatcher.emit({ event: 'entry', phase: 'start', state, sourceCard: first });
      }
    });

    state.turn = 1;
    return state;
  }

  static stepTurn(state: BattleState) {
    if (state.isFinished) return;

    const currentTeam = state.teams[state.activeSide];
    const enemySide = state.activeSide === 'team1' ? 'team2' : 'team1';
    const enemyTeam = state.teams[enemySide];

    const activeCard = currentTeam.find(c => !c.isDead);
    if (activeCard && !activeCard.hasEntered) {
      activeCard.hasEntered = true;
      Dispatcher.emit({ event: 'entry', phase: 'start', state, sourceCard: activeCard });
    }

    const enemyActive = enemyTeam.find(c => !c.isDead);
    if (!activeCard || !enemyActive) {
      state.isFinished = true;
      state.winner = activeCard ? state.activeSide : enemySide;
      state.events.push({ type: 'battle_end', winner: state.winner, totalTurns: state.turn });
      return;
    }

    if (activeCard.statuses.freeze > 0) {
      activeCard.statuses.freeze--;
      state.events.push({
        type: 'status',
        cardName: activeCard.name,
        cardTheme: getTierThemeKey(activeCard.tiers),
        status: 'frozen (turn skipped)',
        turns: activeCard.statuses.freeze,
        side: state.activeSide,
        abilityName: 'Freeze'
      });
      state.turn++;
      state.activeSide = enemySide;
      return;
    }

    if (activeCard.statuses.stun > 0) {
      activeCard.statuses.stun--;
      state.events.push({
        type: 'status',
        cardName: activeCard.name,
        cardTheme: getTierThemeKey(activeCard.tiers),
        status: 'stunned (turn skipped)',
        turns: activeCard.statuses.stun,
        side: state.activeSide,
        abilityName: 'Stun'
      });
      state.turn++;
      state.activeSide = enemySide;
      return;
    }

    state.events.push({
      type: 'turn_start',
      turn: state.turn,
      side: state.activeSide,
      cardName: activeCard.name,
      cardTheme: getTierThemeKey(activeCard.tiers)
    });

    Dispatcher.emit({ event: 'turn', phase: 'start', state, sourceCard: activeCard });
    activeCard.hasPlayedTurn = true;

    const attackContext: AttackContext = {
      strikeCount: 1,
      target: enemyActive,
      ignoreDefenses: activeCard.tags.includes('warrior_path') && activeCard.name === 'Duelist'
    };

    Dispatcher.emit({ event: 'turn', phase: 'attack', state, sourceCard: activeCard, defender: enemyActive, attackContext });

    let finalTarget = attackContext.target || enemyActive;
    if (activeCard.statuses.confusion && activeCard.statuses.confusion > 0) {
      activeCard.statuses.confusion--;
      const allies = currentTeam.filter(c => !c.isDead && c !== activeCard);
      finalTarget = allies.length > 0 ? allies[0] : activeCard;
      state.events.push({
        type: 'status',
        cardName: activeCard.name,
        cardTheme: getTierThemeKey(activeCard.tiers),
        status: 'confused (targets ally)',
        turns: 0,
        side: state.activeSide,
        abilityName: 'Confusion'
      });
    }

    for (let i = 0; i < attackContext.strikeCount; i++) {
      if (!finalTarget || finalTarget.isDead || activeCard.isDead) {
        const nextOpp = enemyTeam.find(c => !c.isDead);
        if (!nextOpp) break;
        finalTarget = nextOpp;
      }

      const attackEvent = { canceled: false };
      Dispatcher.emit({
        event: 'attack',
        phase: 'before',
        state,
        sourceCard: finalTarget,
        attacker: activeCard,
        defender: finalTarget,
        attackEvent
      });

      if (!attackEvent.canceled) {
        Dispatcher.applyDamage(
          finalTarget,
          activeCard.damage,
          activeCard,
          state,
          'attack',
          undefined,
          attackContext.ignoreDefenses
        );
        Dispatcher.emit({ event: 'attack', phase: 'after', state, sourceCard: activeCard, defender: finalTarget });
      }
    }

    Dispatcher.emit({ event: 'turn', phase: 'end', state, sourceCard: activeCard });

    activeCard.barriers.forEach(b => b.duration_turns--);
    activeCard.barriers = activeCard.barriers.filter(b => b.duration_turns > 0);
    activeCard.shields.forEach(s => { if (s.duration_turns !== undefined) s.duration_turns--; });
    activeCard.shields = activeCard.shields.filter(s => s.duration_turns === undefined || s.duration_turns > 0);

    state.turn++;
    state.activeSide = enemySide;

    const t1Alive = state.teams.team1.some(c => !c.isDead);
    const t2Alive = state.teams.team2.some(c => !c.isDead);

    if (!t1Alive || !t2Alive) {
      state.isFinished = true;
      state.winner = t1Alive ? 'team1' : 'team2';
      state.events.push({ type: 'battle_end', winner: state.winner, totalTurns: state.turn });
    }
  }

  static runCompleteBattle(
    t1Blueprints: { bp: CardBlueprint; tiers: TierKey[] }[],
    t2Blueprints: { bp: CardBlueprint; tiers: TierKey[] }[],
    maxTurns = 500
  ): BattleSimulationResult {
    const state = Engine.initBattle(t1Blueprints, t2Blueprints);
    while (!state.isFinished && state.turn < maxTurns) {
      Engine.stepTurn(state);
    }
    return {
      winner: state.winner || 'team1',
      totalTurns: state.turn,
      finalTeams: state.teams,
      events: state.events
    };
  }
}