<script lang="ts">
  import type { BattleState } from '../types/card';
  import { compactNumber, getTierThemeKey } from '../core/formulas';

  interface Props {
    state: BattleState | null;
  }

  let { state }: Props = $props();
</script>

<section class="bg-[#0f172a] border border-[#1e293b] rounded-xl p-2.5 shadow-lg">
  {#if !state}
    <p class="text-[11px] text-slate-500 italic text-center py-2">Waiting for battle to start...</p>
  {:else}
    <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-[#1e293b] pb-1.5">
      <span>Turn: <strong class="text-slate-100">{state.turn}</strong></span>
      <span>Active: <strong class="text-sky-400">{state.activeSide === 'team1' ? 'Team 1' : 'Team 2'}</strong></span>
    </div>

    <div class="grid grid-cols-2 gap-2 text-[10px]">
      <!-- Team 1 -->
      <div>
        <h4 class="font-bold text-blue-400 mb-1">Team 1</h4>
        <ul class="flex flex-col gap-1">
          {#each state.teams.team1 as c}
            {@const themeKey = getTierThemeKey(c.tiers)}
            <li
              class="bg-[#111a2e] rounded px-2 py-1.5 flex items-center justify-between gap-1 transition relative tier-animated-border {themeKey
                ? `tier-border-${themeKey} tier-glow-${themeKey} border border-transparent`
                : 'border border-[#1e293b]'} {c.isDead ? 'opacity-35 line-through' : ''}"
            >
              <span class="font-bold truncate max-w-[85px] {themeKey ? `tier-text-${themeKey}` : 'text-slate-100'}">{c.name}</span>
              <div class="flex items-center gap-2 font-mono shrink-0">
                <span class="text-red-400 font-semibold" title="Attack">{compactNumber(c.damage)}</span>
                <span class="text-emerald-400 font-semibold" title="Health Points">{compactNumber(c.currentHp)}</span>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Team 2 -->
      <div>
        <h4 class="font-bold text-red-400 mb-1">Team 2</h4>
        <ul class="flex flex-col gap-1">
          {#each state.teams.team2 as c}
            {@const themeKey = getTierThemeKey(c.tiers)}
            <li
              class="bg-[#111a2e] rounded px-2 py-1.5 flex items-center justify-between gap-1 transition relative tier-animated-border {themeKey
                ? `tier-border-${themeKey} tier-glow-${themeKey} border border-transparent`
                : 'border border-[#1e293b]'} {c.isDead ? 'opacity-35 line-through' : ''}"
            >
              <span class="font-bold truncate max-w-[85px] {themeKey ? `tier-text-${themeKey}` : 'text-slate-100'}">{c.name}</span>
              <div class="flex items-center gap-2 font-mono shrink-0">
                <span class="text-red-400 font-semibold" title="Attack">{compactNumber(c.damage)}</span>
                <span class="text-emerald-400 font-semibold" title="Health Points">{compactNumber(c.currentHp)}</span>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</section>