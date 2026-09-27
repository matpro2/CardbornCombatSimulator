<script lang="ts">
  import type { CombatEvent } from '../types/card';
  import { compactNumber } from '../core/formulas';

  interface Props {
    events: CombatEvent[];
  }

  let { events }: Props = $props();

  interface Token {
    text: string;
    theme?: string | null;
    isCard?: boolean;
    cssClass?: string;
  }

  function getEventFormatting(e: CombatEvent): { tokens: Token[]; border: string; lineClass: string } {
    const side = 'side' in e ? e.side : undefined;
    const border = side === 'team1' 
      ? 'border-l-2 border-blue-500 pl-2' 
      : side === 'team2' 
      ? 'border-l-2 border-red-500 pl-2' 
      : 'pl-2';

    switch (e.type) {
      case 'turn_start':
        return {
          tokens: [
            { text: `[T${e.turn}] Turn: ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` (${e.side === 'team1' ? 'Team 1' : 'Team 2'})`, cssClass: 'text-slate-500 text-[10px]' }
          ],
          border,
          lineClass: 'text-slate-100 font-bold'
        };

      case 'damage': {
        const isAbility = Boolean(e.abilityName && e.abilityName !== 'attack' && e.abilityName !== 'attaque');
        return {
          tokens: [
            { text: `[` },
            { text: e.sourceCard, theme: e.sourceTheme, isCard: true },
            { text: isAbility ? ` · ${e.abilityName}] ` : ' Attack] ' },
            { text: e.targetCard, theme: e.targetTheme, isCard: true },
            { text: ` -${compactNumber(e.amount)} HP (${compactNumber(e.remainingHp)}/${compactNumber(e.maxHp)})`, cssClass: 'text-red-400 font-semibold' }
          ],
          border,
          lineClass: 'text-slate-300'
        };
      }

      case 'heal':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` +${compactNumber(e.amount)} HP (${compactNumber(e.currentHp)}/${compactNumber(e.maxHp)})`, cssClass: 'text-emerald-400 font-semibold' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'shield':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` +${compactNumber(e.amount)} shield`, cssClass: 'text-sky-400 font-medium' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'barrier':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` barrier`, cssClass: 'text-sky-400 font-medium' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'status':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` +${e.status}`, cssClass: 'text-purple-400 font-medium' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'stat_change':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` ${e.deltaText} ${e.stat}`, cssClass: 'text-sky-400 font-medium' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'revive':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` revive ${compactNumber(e.hp)} HP`, cssClass: 'text-emerald-400 font-bold' }
          ],
          border,
          lineClass: 'text-slate-300'
        };

      case 'summon':
        return {
          tokens: [
            { text: `[${e.abilityName}] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` summons ${e.count > 1 ? `${e.count}x ` : ''}` },
            { text: e.summonedName, theme: e.summonedTheme, isCard: true },
            { text: ` !` }
          ],
          border,
          lineClass: 'text-amber-400 font-bold'
        };

      case 'death':
        return {
          tokens: [
            { text: `[Death] ` },
            { text: e.cardName, theme: e.cardTheme, isCard: true },
            { text: ` defeated` }
          ],
          border,
          lineClass: 'text-rose-500 font-bold'
        };

      case 'battle_end':
        return {
          tokens: [
            { text: `Victory for ${e.winner === 'team1' ? 'Team 1' : 'Team 2'} in ${e.totalTurns} turns!` }
          ],
          border: 'border-l-2 border-yellow-400 pl-2',
          lineClass: 'text-yellow-400 font-extrabold'
        };

      default:
        return { tokens: [], border: 'pl-2', lineClass: '' };
    }
  }
</script>

<section class="bg-[#060911] border border-[#1e293b] rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
  <div class="bg-[#0b1120] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#1e293b] shrink-0">
    Battle Feed
  </div>
  <div class="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] leading-relaxed flex flex-col gap-1 min-h-0">
    {#each events as event}
      {@const fmt = getEventFormatting(event)}
      <div class="{fmt.border} {fmt.lineClass}">
        {#each fmt.tokens as token}
          {#if token.theme}
            <span class="tier-text-{token.theme} font-bold">{token.text}</span>
          {:else if token.isCard}
            <span class="text-slate-100 font-bold">{token.text}</span>
          {:else}
            <span class={token.cssClass || ''}>{token.text}</span>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</section>