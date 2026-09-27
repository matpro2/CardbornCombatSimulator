<script lang="ts">
  import type { CardBlueprint, TierKey } from '../types/card';
  import { TIER_CONFIG } from '../types/card';
  import { calculateEffectiveStats, compactNumber, getTierThemeKey } from '../core/formulas';

  interface Props {
    index: number;
    cardsDb: Record<string, CardBlueprint>;
    selectedKey: string;
    appliedTiers: TierKey[];
    onSelect: (key: string) => void;
    onToggleTier: (tier: TierKey) => void;
  }

  let { index, cardsDb, selectedKey, appliedTiers, onSelect, onToggleTier }: Props = $props();

  const card = $derived(cardsDb[selectedKey]);
  const stats = $derived(
    card ? calculateEffectiveStats(card.rng, appliedTiers, card.weather || 'none') : null
  );
  const abilityName = $derived(card?.abilities?.[0]?.name || '');
  const themeKey = $derived(getTierThemeKey(appliedTiers));
</script>

<div
  class="flex flex-col bg-[#0d1527] rounded-xl p-2.5 transition relative tier-animated-border {themeKey
    ? `tier-border-${themeKey} tier-glow-${themeKey} border border-transparent`
    : 'border border-[#1e293b] hover:border-[#334155]'}"
>
  <!-- Weather Badge -->
  <div class="h-4 flex items-center mb-1 pl-7">
    {#if card?.weather && card.weather !== 'none'}
      <span class="text-[9px] font-extrabold uppercase tracking-wide text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 leading-none">
        {card.weather.replace(/_/g, ' ')}
      </span>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    <!-- Number -->
    <span class="font-mono text-xs font-bold text-slate-500 w-4 text-center shrink-0">
      {String(index + 1).padStart(2, '0')}
    </span>

    <!-- Thumbnail -->
    <div class="w-12 h-12 rounded-lg bg-[#070b14] border border-[#24324f] flex items-center justify-center font-bold text-sm text-slate-400 overflow-hidden shrink-0 shadow-inner">
      {#if card?.croppedImageId}
        <img
          src={`https://www.roblox.com/asset-thumbnail/image?assetId=${card.croppedImageId}&width=150&height=150&format=png`}
          alt={card.name}
          class="w-full h-full object-cover"
        />
      {:else}
        <span>{card ? card.name[0] : '?'}</span>
      {/if}
    </div>

    <!-- Details -->
    <div class="flex-1 min-w-0 flex flex-col gap-1.5">
      <!-- Card Selector -->
      <select
        value={selectedKey}
        onchange={(e) => onSelect((e.target as HTMLSelectElement).value)}
        class="bg-[#070b14] border border-[#24324f] hover:border-sky-500/50 rounded-md text-xs font-semibold text-slate-200 px-2 py-1 outline-none w-full truncate cursor-pointer transition"
      >
        <option value="none">-- Select Card --</option>
        {#each Object.entries(cardsDb) as [key, c]}
          <option value={key}>
            {c.name} (1/{compactNumber(c.rng)})
          </option>
        {/each}
      </select>

      <!-- Stats -->
      <div class="flex items-center justify-between text-[11px] leading-none">
        {#if stats}
          <div class="flex items-center gap-2.5 font-mono">
            <div><strong class="text-emerald-400 font-bold">{compactNumber(stats.health)}</strong> <span class="text-[9px] text-slate-500">HP</span></div>
            <div><strong class="text-red-400 font-bold">{compactNumber(stats.damage)}</strong> <span class="text-[9px] text-slate-500">ATK</span></div>
            <div class="text-slate-500 text-[10px]">1/<span class="text-slate-300 font-semibold">{compactNumber(stats.effectiveRng)}</span></div>
          </div>
        {:else}
          <span class="text-[10px] text-slate-600 italic">No data</span>
        {/if}

        <span class="text-[10px] text-slate-400 font-medium truncate max-w-[130px] text-right">
          {abilityName}
        </span>
      </div>

      <!-- Tier Buttons -->
      <div class="grid grid-cols-5 gap-1 pt-0.5">
        {#each TIER_CONFIG as t}
          {@const active = appliedTiers.includes(t.key)}
          <button
            type="button"
            title={t.fullLabel}
            onclick={() => onToggleTier(t.key)}
            class="py-1 rounded text-[10px] font-mono font-bold tracking-tight text-center transition {active
              ? `tier-animated-border tier-border-${t.key} tier-glow-${t.key} tier-text-${t.key} tier-bg-${t.key}`
              : 'bg-[#070b14] border border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-[#334155]'}"
          >
            {t.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>