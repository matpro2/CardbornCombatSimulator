<script lang="ts">
  import type { TierKey, BattleState } from './types/card';
  import { Engine } from './core/engine';
  import { CARDS_DATA } from './data/cards';
  import { generateBalancedMatch } from './core/generator';
  import SlotCard from './components/SlotCard.svelte';
  import BattleBoard from './components/BattleBoard.svelte';
  import BattleLogs from './components/BattleLogs.svelte';
  import './styles/tiers.css';

  interface TeamSlot {
    key: string;
    tiers: TierKey[];
  }

  const createEmptyTeam = (): TeamSlot[] => [
    { key: 'none', tiers: [] },
    { key: 'none', tiers: [] },
    { key: 'none', tiers: [] },
    { key: 'none', tiers: [] }
  ];

  let team1 = $state<TeamSlot[]>(createEmptyTeam());
  let team2 = $state<TeamSlot[]>(createEmptyTeam());
  let battleState = $state<BattleState | null>(null);

  function handleSelect(team: 'team1' | 'team2', idx: number, key: string) {
    if (team === 'team1') {
      team1[idx] = { ...team1[idx], key };
    } else {
      team2[idx] = { ...team2[idx], key };
    }
  }

  function handleToggleTier(team: 'team1' | 'team2', idx: number, tier: TierKey) {
    const targetArray = team === 'team1' ? team1 : team2;
    const current = targetArray[idx].tiers;
    const updated = current.includes(tier) ? current.filter(t => t !== tier) : [...current, tier];

    if (team === 'team1') {
      team1[idx] = { ...team1[idx], tiers: updated };
    } else {
      team2[idx] = { ...team2[idx], tiers: updated };
    }
  }

  function handleRandomMatch() {
    const match = generateBalancedMatch(CARDS_DATA, 4);
    team1 = match.team1;
    team2 = match.team2;
    battleState = null;
  }

  function startBattle() {
    const t1 = team1
      .filter(s => s.key !== 'none' && CARDS_DATA[s.key])
      .map(s => ({ bp: CARDS_DATA[s.key], tiers: s.tiers }));
    const t2 = team2
      .filter(s => s.key !== 'none' && CARDS_DATA[s.key])
      .map(s => ({ bp: CARDS_DATA[s.key], tiers: s.tiers }));

    if (t1.length === 0 || t2.length === 0) {
      alert('Please configure at least one card per team.');
      return;
    }

    battleState = Engine.initBattle(t1, t2);
  }

  function nextTurn() {
    if (!battleState || battleState.isFinished) return;
    Engine.stepTurn(battleState);
    battleState = { ...battleState };
  }

  function resetBattle() {
    battleState = null;
  }
</script>

<div class="h-screen w-screen overflow-hidden bg-[#0a0f1d] text-slate-100 p-3 flex flex-col box-border">
  <header class="mb-2 shrink-0 flex items-center justify-between">
    <div>
      <div class="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">Cardborn Simulator</div>
      <h1 class="text-lg font-extrabold tracking-tight">Battle Arena</h1>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={handleRandomMatch}
        class="bg-gradient-to-r from-purple-600/30 to-sky-600/30 hover:from-purple-600/50 hover:to-sky-600/50 border border-purple-500/40 text-purple-200 font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
      >
        <span>🎲</span> Balanced Random
      </button>

      <button
        type="button"
        onclick={startBattle}
        class="bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
      >
        Start Battle
      </button>

      <button
        type="button"
        onclick={nextTurn}
        disabled={!battleState || battleState.isFinished}
        class="bg-[#111a2e] hover:bg-[#1e293b] border border-[#24324f] text-slate-100 font-bold py-1.5 px-3.5 rounded-lg text-xs transition disabled:opacity-40 cursor-pointer"
      >
        Next Turn
      </button>

      <button
        type="button"
        onclick={resetBattle}
        class="bg-[#111a2e] hover:bg-[#1e293b] border border-[#24324f] text-slate-100 font-bold py-1.5 px-3.5 rounded-lg text-xs transition cursor-pointer"
      >
        Reset
      </button>
    </div>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
    <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full min-h-0">
      <!-- TEAM 1 -->
      <section class="bg-[#0f172a] border border-[#1e293b] rounded-xl p-2.5 flex flex-col h-full shadow-lg min-h-0">
        <div class="mb-1 shrink-0 flex items-center justify-between">
          <div>
            <span class="text-[9px] font-bold tracking-wider uppercase text-slate-500">Blue Formation</span>
            <h2 class="text-xs font-bold text-blue-400">Team 1</h2>
          </div>
          <span class="text-[10px] font-mono text-slate-500">{team1.filter(s => s.key !== 'none').length}/4</span>
        </div>

        <div class="flex flex-col gap-1.5 flex-1 justify-between min-h-0 overflow-y-auto pr-0.5">
          {#each team1 as slot, i}
            <SlotCard
              index={i}
              cardsDb={CARDS_DATA}
              selectedKey={slot.key}
              appliedTiers={slot.tiers}
              onSelect={(key) => handleSelect('team1', i, key)}
              onToggleTier={(tier) => handleToggleTier('team1', i, tier)}
            />
          {/each}
        </div>
      </section>

      <!-- TEAM 2 -->
      <section class="bg-[#0f172a] border border-[#1e293b] rounded-xl p-2.5 flex flex-col h-full shadow-lg min-h-0">
        <div class="mb-1 shrink-0 flex items-center justify-between">
          <div>
            <span class="text-[9px] font-bold tracking-wider uppercase text-slate-500">Red Formation</span>
            <h2 class="text-xs font-bold text-red-400">Team 2</h2>
          </div>
          <span class="text-[10px] font-mono text-slate-500">{team2.filter(s => s.key !== 'none').length}/4</span>
        </div>

        <div class="flex flex-col gap-1.5 flex-1 justify-between min-h-0 overflow-y-auto pr-0.5">
          {#each team2 as slot, i}
            <SlotCard
              index={i}
              cardsDb={CARDS_DATA}
              selectedKey={slot.key}
              appliedTiers={slot.tiers}
              onSelect={(key) => handleSelect('team2', i, key)}
              onToggleTier={(tier) => handleToggleTier('team2', i, tier)}
            />
          {/each}
        </div>
      </section>
    </div>

    <!-- RIGHT COLUMN : BOARD & LOG FEED -->
    <div class="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
      <div class="shrink-0">
        <BattleBoard state={battleState} />
      </div>
      <div class="flex-1 min-h-0">
        <BattleLogs events={battleState?.events || []} />
      </div>
    </div>
  </div>
</div>