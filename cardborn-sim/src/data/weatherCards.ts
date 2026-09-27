import type { CardBlueprint } from '../types/card';
import { compactNumber } from '../core/formulas';

export function defineCard(bp: CardBlueprint): CardBlueprint {
  return bp;
}

export const WEATHER_CARDS: Record<string, CardBlueprint> = {
  // 30 000
  coin_squire: defineCard({
    name: "Coin Squire",
    rng: 30000,
    weather: "travelling_caravan",
    croppedImageId: "119319125613081",
    tags: ["knight", "human"],
    abilities: [
      {
        name: "Tip the Guard",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 0.70);
          ctx.emitStatChange(ctx.self.name, "ATK", "-30%");
        }
      },
      {
        name: "Guard Protection",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.70);
            ctx.emitStatChange(ctx.self.name, "damage taken", "-30%");
          }
        }
      }
    ]
  }),

  // 80 000
  traveling_trader: defineCard({
    name: "Traveling Trader",
    rng: 80000,
    weather: "travelling_caravan",
    croppedImageId: "93035174829356",
    tags: ["human"],
    abilities: [
      {
        name: "Fine Print",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (ctx.self.turnCount === 1 && enemy) {
            const cut = Math.round(ctx.self.damage * 0.20);
            ctx.self.damage -= cut;
            enemy.damage += cut;
            (ctx.self as any)._stolenAtk = cut;
            ctx.emitStatChange(ctx.self.name, "ATK", "-20% to enemy");
          } else if (ctx.self.turnCount === 2 && enemy) {
            const restored = (ctx.self as any)._stolenAtk || 0;
            enemy.damage = Math.max(1, enemy.damage - restored);
            ctx.self.damage = Math.round(ctx.self.damage * 1.80);
            ctx.emitStatChange(ctx.self.name, "ATK", "+80%");
          }
        }
      }
    ]
  }),

  // 200 000
  burrow_bomber: defineCard({
    name: "Burrow Bomber",
    rng: 200000,
    weather: "gnome_raid",
    croppedImageId: "117301732780030",
    tags: ["gnome"],
    abilities: [
      {
        name: "Tunnel Strike",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: () => Math.random() < 0.70,
        run: (ctx) => {
          const enemyTeam = ctx.enemies();
          if (enemyTeam.length > 1 && ctx.attackEvent) {
            ctx.attackEvent.canceled = true;
            ctx.dealDamage(enemyTeam[1], Math.round(ctx.self.damage * 1.20));
          }
        }
      }
    ]
  }),

  // 250 000
  market_guard: defineCard({
    name: "Market Guard",
    rng: 250000,
    weather: "travelling_caravan",
    croppedImageId: "126103575690191",
    tags: ["human", "guard"],
    abilities: [
      {
        name: "Paid Security",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const count = ctx.allies().filter(a => a !== ctx.self && (a as any).weather === "travelling_caravan" && !a.name.toLowerCase().includes("guard")).length;
          const boost = 1 + count * 0.35;
          ctx.self.damage = Math.round(ctx.self.damage * boost);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * boost);
          ctx.self.currentHp = ctx.self.maxHp;
          ctx.emitStatChange(ctx.self.name, "stats", `+${count * 35}%`);
        }
      }
    ]
  }),

  // 444 000
  young_disciple: defineCard({
    name: "Young Disciple",
    rng: 444000,
    weather: "warrior_path",
    croppedImageId: "73440805460994",
    tags: ["human", "warrior"],
    abilities: [
      {
        name: "Unshaken Form",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.statuses.stun = 0;
          ctx.self.statuses.freeze = 0;
        }
      }
    ]
  }),

  // 500 000
  tax_collector: defineCard({
    name: "Tax Collector",
    rng: 500000,
    weather: "travelling_caravan",
    croppedImageId: "120888259839230",
    tags: ["human"],
    abilities: [
      {
        name: "Taxed",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemies = ctx.enemies();
          let drained = 0;
          enemies.forEach(e => {
            const cut = Math.round(e.damage * 0.12);
            e.damage = Math.max(1, e.damage - cut);
            drained += cut;
          });
          const allies = ctx.allies();
          if (allies.length > 0 && drained > 0) {
            const share = Math.round(drained / allies.length);
            allies.forEach(a => a.damage += share);
          }
          ctx.emitStatChange(ctx.self.name, "taxes", `drained ${compactNumber(drained)} ATK`);
        }
      }
    ]
  }),

  // 700 000
  iron_legionnaire: defineCard({
    name: "Iron Legionnaire",
    rng: 700000,
    weather: "iron_legion",
    croppedImageId: "115990857650353",
    tags: ["human", "soldier"],
    abilities: [
      {
        name: "Seasoned Veteran",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          const cap = Math.round(ctx.self.maxHp * 0.35);
          if (ctx.damageEvent && ctx.damageEvent.amount > cap) {
            ctx.damageEvent.amount = cap;
            ctx.emitStatChange(ctx.self.name, "damage cap", `max ${compactNumber(cap)}`);
          }
        }
      }
    ]
  }),

  // 777 777
  the_embodiment_of_luck: defineCard({
    name: "The Embodiment of Luck",
    rng: 777777,
    weather: "new_years_festival",
    croppedImageId: "108656598910625",
    tags: ["spirit"],
    abilities: [
      {
        name: "Luck Incarnate",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => {
          const next = ctx.allies().find(a => !a.isDead);
          if (next) {
            const pct = (7 + Math.random() * 70) / 100;
            const hpBoost = Math.round(ctx.self.maxHp * pct);
            const atkBoost = Math.round(ctx.self.damage * pct);
            next.maxHp += hpBoost;
            next.currentHp += hpBoost;
            next.damage += atkBoost;
            ctx.emitStatChange(next.name, "stats", `+${Math.round(pct * 100)}% Luck`);
          }
        }
      }
    ]
  }),

  // 800 000
  gnomelord_technician: defineCard({
    name: "Gnomelord Technician",
    rng: 800000,
    weather: "gnome_raid",
    croppedImageId: "138325517071270",
    tags: ["gnome"],
    abilities: [
      {
        name: "Chaotic Contraption",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const roll = Math.random();
          if (roll < 0.33) {
            ctx.self.damage = Math.round(ctx.self.damage * 1.20);
            ctx.emitStatChange(ctx.self.name, "ATK", "+20%");
          } else if (roll < 0.66) {
            ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.10));
          } else {
            const exp = Math.round(ctx.self.damage * 0.10);
            ctx.allies().forEach(a => ctx.dealDamage(a, exp, "explosion"));
            ctx.enemies().forEach(e => ctx.dealDamage(e, exp, "explosion"));
          }
        }
      }
    ]
  }),

  // 1 110 000
  wyrmling: defineCard({
    name: "Wyrmling",
    rng: 1110000,
    weather: "dragons_roost",
    croppedImageId: "81323807801126",
    tags: ["dragon", "beast"],
    abilities: [
      {
        name: "Weak Growth",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.05);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.05);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.05);
          ctx.emitStatChange(ctx.self.name, "stats", "+5%");
        }
      }
    ]
  }),

  // 1 400 000
  tinkering_gnome: defineCard({
    name: "Tinkering Gnome",
    rng: 1400000,
    weather: "gnome_raid",
    croppedImageId: "77503130676004",
    tags: ["gnome"],
    abilities: [
      {
        name: "Gearjam",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy && !enemy.tags.includes("boss")) {
            const temp = enemy.damage;
            enemy.damage = enemy.currentHp;
            enemy.currentHp = temp;
            enemy.maxHp = Math.max(enemy.maxHp, temp);
            ctx.emitStatChange(enemy.name, "stats", "swapped ATK/HP");
          }
        }
      }
    ]
  }),

  // 1 500 000
  nian: defineCard({
    name: "Nian",
    rng: 1500000,
    weather: "new_years_festival",
    croppedImageId: "113309977264047",
    tags: ["beast", "mythic"],
    abilities: [
      {
        name: "Stricken Terror",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0 && Math.random() < 0.65,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            ctx.applyStatus(enemy, "stun", 1);
            const stealAtk = Math.round(enemy.damage * 0.20);
            const stealHp = Math.round(enemy.currentHp * 0.20);
            enemy.damage = Math.max(1, enemy.damage - stealAtk);
            enemy.currentHp = Math.max(1, enemy.currentHp - stealHp);
            ctx.self.damage += stealAtk;
            ctx.self.currentHp += stealHp;
            ctx.emitStatChange(ctx.self.name, "terror", "stun & steal 20%");
          }
        }
      }
    ]
  }),

  // 2 000 000
  sun_sprite: defineCard({
    name: "Sun Sprite",
    rng: 2000000,
    weather: "glaring_sun",
    tags: ["elemental", "fairy"],
    abilities: [
      {
        name: "Radiant Burst",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.07);
            a.currentHp = Math.round(a.currentHp * 1.07);
          });
          ctx.enemies().forEach(e => ctx.dealDamage(e, Math.round(e.currentHp * 0.07), "burn"));
          ctx.emitStatChange("Allies", "max hp", "+7%");
        }
      }
    ]
  }),

  // 4 000 000
  iron_protector: defineCard({
    name: "Iron Protector",
    rng: 4000000,
    weather: "iron_legion",
    tags: ["human", "knight"],
    abilities: [
      {
        name: "Hold the Line",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: (ctx) => !ctx.self.isDead && Boolean(ctx.defender && ctx.defender !== ctx.self),
        run: (ctx) => {
          if (ctx.defender) ctx.defender = ctx.self;
          ctx.emitStatChange(ctx.self.name, "intercept", "redirected to self");
        }
      }
    ]
  }),

  // 6 000 000
  janus: defineCard({
    name: "Janus, God of Beginnings",
    rng: 6000000,
    weather: "new_years_festival",
    tags: ["deity"],
    abilities: [
      {
        name: "Renewal of a New Cycle",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.maxHp *= 2;
          ctx.self.currentHp *= 2;
          ctx.emitStatChange(ctx.self.name, "HP", "+100%");
        }
      },
      {
        name: "Renewal Party Revive",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount === 4 && (ctx.self.abilityUses[1] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          ctx.deadAllies().forEach(a => ctx.revive(a, Math.round(a.maxHp * 0.50)));
          ctx.emitStatChange("Team", "revive", "50% HP");
        }
      }
    ]
  }),

  // 8 500 000
  the_last_mammoth: defineCard({
    name: "The Last Mammoth",
    rng: 8500000,
    weather: "rip_in_time",
    tags: ["beast"],
    abilities: [
      {
        name: "Age of Beasts",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.40);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.40);
        }
      },
      {
        name: "Shared Sacrifice",
        trigger: { event: "damage", phase: "after", actor: "ally", relativePosition: "immediate_before" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            const split = Math.round(ctx.damageEvent.amount * 0.50);
            ctx.damageEvent.amount -= split;
            ctx.dealDamage(ctx.self, split, "split");
          }
        }
      },
      {
        name: "Mammoth Rebirth",
        trigger: { event: "death", phase: "after", actor: "self" },
        maxUses: 1,
        run: (ctx) => ctx.revive(ctx.self, Math.round(ctx.self.maxHp * 0.40))
      }
    ]
  }),

  // 9 000 000
  solar_paladin: defineCard({
    name: "Solar Paladin",
    rng: 9000000,
    weather: "glaring_sun",
    tags: ["paladin", "human"],
    abilities: [
      {
        name: "Solar Ward",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.allies().forEach(a => ctx.addShield(a, "solar_ward", Math.round(a.currentHp * 0.25)));
        }
      },
      {
        name: "Solar Flare",
        trigger: { event: "shield_break", actor: "self_shield", shieldId: "solar_ward" },
        run: (ctx) => {
          if (ctx.attacker) ctx.dealDamage(ctx.attacker, Math.round(ctx.attacker.maxHp * 0.10), "burn");
        }
      }
    ]
  }),

  // 10 000 000
  ice_dragon: defineCard({
    name: "Ice Dragon",
    rng: 10000000,
    weather: "dragons_roost",
    tags: ["dragon", "elemental"],
    abilities: [
      {
        name: "Frost Breath",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy && Math.random() < 0.35) {
            ctx.applyStatus(enemy, "freeze", 1);
          }
        }
      },
      {
        name: "Shatter",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: (ctx) => Boolean(ctx.activeEnemy()?.statuses.freeze),
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.60);
          ctx.emitStatChange(ctx.self.name, "ATK", "+60% vs Frozen");
        }
      }
    ]
  }),

  // 11 100 000
  abomination: defineCard({
    name: "Abomination",
    rng: 11100000,
    weather: "black_hole",
    tags: ["cosmic", "eldritch"],
    abilities: [
      {
        name: "Critical Mass",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.self.damage *= 3;
          ctx.emitStatChange(ctx.self.name, "ATK", "3x Critical Mass");
        }
      },
      {
        name: "Critical Decay",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 0.75);
          ctx.emitStatChange(ctx.self.name, "ATK", "-25% Decay");
        }
      }
    ]
  }),

  // 18 000 000
  specter: defineCard({
    name: "Specter",
    rng: 18000000,
    weather: "shadowed_world",
    tags: ["undead"],
    abilities: [
      {
        name: "Haunting Presence",
        trigger: { event: "damage", phase: "before", actor: "opponent" },
        condition: (ctx) => !ctx.self.isDead,
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.85);
        }
      },
      {
        name: "Haunting Regen",
        trigger: { event: "turn", phase: "start", actor: "ally" },
        condition: (ctx) => !ctx.self.isDead,
        run: (ctx) => ctx.allies().forEach(a => ctx.heal(a, Math.round(a.maxHp * 0.05)))
      }
    ]
  }),

  // 22 500 000
  flare_king: defineCard({
    name: "Flare King",
    rng: 22500000,
    weather: "glaring_sun",
    tags: ["elemental", "leader"],
    abilities: [
      {
        name: "Crown of Embers",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.30);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.30);
          ctx.self.currentHp = ctx.self.maxHp;
          ctx.emitStatChange(ctx.self.name, "stats", "+30% Crown");
        }
      },
      {
        name: "Pass Crown",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => {
          const next = ctx.allies().find(a => !a.isDead);
          if (next) {
            next.damage = Math.round(next.damage * 1.20);
            next.maxHp = Math.round(next.maxHp * 1.20);
            next.currentHp = Math.round(next.currentHp * 1.20);
            ctx.emitStatChange(next.name, "stats", "+20% Crown Passed");
          }
        }
      }
    ]
  }),

  // 25 000 000
  marching_colossus: defineCard({
    name: "Marching Colossus",
    rng: 25000000,
    weather: "iron_legion",
    tags: ["golem"],
    abilities: [
      {
        name: "Colossal Momentum",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          const next = ctx.activeEnemy();
          if (next) ctx.dealDamage(next, Math.round(ctx.self.damage * 0.50));
        }
      }
    ]
  }),

  // 30 000 000
  shade: defineCard({
    name: "Shade",
    rng: 30000000,
    weather: "shadowed_world",
    tags: ["undead"],
    abilities: [
      {
        name: "Slip Between Shadows",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            const pct = 0.40 + Math.random() * 0.35;
            ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * pct);
            if (pct <= 0.45 && ctx.attacker) {
              ctx.applyStatus(ctx.attacker, "stun", 1);
            }
          }
        }
      }
    ]
  }),

  // 32 500 000
  dragon_broodmother: defineCard({
    name: "Dragon Broodmother",
    rng: 32500000,
    weather: "dragons_roost",
    tags: ["dragon", "beast"],
    abilities: [
      {
        name: "Dragon Mother Summon",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => ctx.summon("wyrmling", 1)
      },
      {
        name: "Dragon Mother Death",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => {
          ctx.allies().filter(a => a.tags.includes("dragon")).forEach(d => d.damage = Math.round(d.damage * 1.40));
          ctx.emitStatChange("Dragons", "ATK", "+40%");
        }
      }
    ]
  }),

  // 33 000 000
  lotus_swordmaiden: defineCard({
    name: "Lotus Swordmaiden",
    rng: 33000000,
    weather: "warrior_path",
    tags: ["human", "warrior"],
    abilities: [
      {
        name: "Triple Petal Slash",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) {
            ctx.attackContext.strikeCount = 3;
            ctx.self.damage = Math.round(ctx.self.damage * 0.75);
          }
        }
      }
    ]
  }),

  // 38 000 000
  theodora: defineCard({
    name: "Theodora, Empress of Resolve",
    rng: 38000000,
    weather: "rip_in_time",
    tags: ["human", "leader"],
    abilities: [
      {
        name: "Heaven's Threshold",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.10);
            a.currentHp = Math.round(a.currentHp * 1.10);
          });
        }
      },
      {
        name: "Heaven's Guard",
        trigger: { event: "damage", phase: "before", actor: "team" },
        condition: (ctx) => !ctx.self.isDead && (ctx.self.abilityUses[1] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent) {
            ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.55);
            ctx.self.damage = Math.round(ctx.self.damage * 1.12);
            ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.12);
            ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.12);
          }
        }
      }
    ]
  }),

  // 42 000 000
  paradox_creator: defineCard({
    name: "Paradox Creator",
    rng: 42000000,
    weather: "black_hole",
    tags: ["cosmic", "mage"],
    abilities: [
      {
        name: "Inverse Law",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const temp = ctx.self.damage;
          ctx.self.damage = ctx.self.health;
          ctx.self.maxHp = temp;
          ctx.self.currentHp = temp;
        }
      },
      {
        name: "Inverse Guard",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            const red = Math.round(ctx.self.damage * 0.30);
            ctx.damageEvent.amount = Math.max(0, ctx.damageEvent.amount - red);
          }
        }
      }
    ]
  }),

  // 50 000 000
  revenant: defineCard({
    name: "Revenant",
    rng: 50000000,
    weather: "shadowed_world",
    tags: ["undead"],
    abilities: [
      {
        name: "Undying Grudge",
        trigger: { event: "death", phase: "after", actor: "ally" },
        condition: (ctx) => ctx.self.isDead && Math.random() < 0.35,
        run: (ctx) => ctx.revive(ctx.self, Math.round(ctx.self.maxHp * 0.50))
      }
    ]
  }),

  // 52 200 000
  iron_juggernaut: defineCard({
    name: "Iron Juggernaut",
    rng: 52200000,
    weather: "iron_legion",
    tags: ["golem", "soldier"],
    abilities: [
      {
        name: "Unstoppable Force",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: (ctx) => (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          const enemyTeam = ctx.enemies();
          if (enemyTeam.length > 1) {
            const pushed = enemyTeam.shift();
            if (pushed) enemyTeam.push(pushed);
            ctx.emitStatChange("Enemy", "push", "Target sent to back");
          } else {
            ctx.self.damage = Math.round(ctx.self.damage * 3.5);
            ctx.emitStatChange(ctx.self.name, "ATK", "+250% Solo Target");
          }
        }
      },
      {
        name: "Juggernaut Growth",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.80);
          ctx.emitStatChange(ctx.self.name, "ATK", "+80% Kill");
        }
      }
    ]
  }),

  // 54 600 000
  duelist: defineCard({
    name: "Duelist",
    rng: 54600000,
    weather: "warrior_path",
    tags: ["human", "warrior"],
    abilities: [
      {
        name: "Perfect Strike",
        trigger: { event: "attack", phase: "before", actor: "self" },
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) {
            target.barriers = [];
            target.shields = [];
          }
        }
      }
    ]
  }),

  // 63 000 000
  vorrath_the_calamity: defineCard({
    name: "Vorrath, The Calamity",
    rng: 63000000,
    weather: "dragons_roost",
    tags: ["dragon", "boss"],
    abilities: [
      {
        name: "Apex Dragon",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.enemies().forEach(e => {
            e.damage = Math.round(e.damage * 0.80);
            ctx.dealDamage(e, Math.round(ctx.self.damage * 0.35));
          });
          ctx.emitStatChange("Enemies", "ATK", "-20%");
        }
      }
    ]
  }),

  // 88 888 888
  perfected_singularity: defineCard({
    name: "Perfected Singularity",
    rng: 88888888,
    weather: "black_hole",
    tags: ["cosmic"],
    abilities: [
      {
        name: "Near Perfection",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const roll = Math.random();
          if (roll < 0.33) {
            ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.20));
          } else if (roll < 0.66) {
            ctx.self.damage = Math.round(ctx.self.damage * 1.50);
            ctx.emitStatChange(ctx.self.name, "ATK", "+50%");
          } else {
            (ctx.self as any)._dodgeNext = 0.35;
          }
        }
      }
    ]
  }),

  // 94 500 000
  grandmaster_of_forms: defineCard({
    name: "Grandmaster of Forms",
    rng: 94500000,
    weather: "warrior_path",
    tags: ["human", "master"],
    abilities: [
      {
        name: "Flow Attack",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.20);
          (ctx.self as any)._flow = ((ctx.self as any)._flow || 0) + 1;
        }
      },
      {
        name: "Flow State",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        condition: (ctx) => ((ctx.self as any)._flow || 0) >= 5,
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
          ctx.heal(ctx.self, Math.round(ctx.self.damage * 0.30));
        }
      }
    ]
  }),

  // 132 000 000
  umbral: defineCard({
    name: "Umbral",
    rng: 132000000,
    weather: "shadowed_world",
    tags: ["undead", "shadow"],
    abilities: [
      {
        name: "Event Horizon",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.90);
        }
      }
    ]
  }),

  // 155 000 000
  caesar_eternal_conqueror: defineCard({
    name: "Caesar, Eternal Conqueror",
    rng: 155000000,
    weather: "rip_in_time",
    tags: ["human", "leader"],
    abilities: [
      {
        name: "Imperial Advance",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.damage = Math.round(a.damage * 1.15);
            a.maxHp = Math.round(a.maxHp * 1.15);
            a.currentHp = Math.round(a.currentHp * 1.15);
          });
        }
      },
      {
        name: "Double Strike",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
        }
      }
    ]
  }),

  // 525 000 000
  gunshin: defineCard({
    name: "Gunshin",
    rng: 525000000,
    weather: "warrior_path",
    tags: ["warrior", "deity"],
    abilities: [
      {
        name: "Ascendant War Doctrine",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            if ((a as any).weather === "warrior_path") {
              a.damage = Math.round(a.damage * 1.30);
              a.maxHp = Math.round(a.maxHp * 1.30);
              a.currentHp = Math.round(a.currentHp * 1.30);
            }
          });
          ctx.emitStatChange("Warriors", "stats", "+30%");
        }
      }
    ]
  }),

  // 8 000 000 000 (Secret)
  gnomelord_technician_clockwork_king: defineCard({
    name: "Gnomelord Technician(Clockwork King)",
    rng: 8000000000,
    weather: "gnome_raid",
    croppedImageId: "86424994346482",
    tags: ["gnome", "secret"],
    abilities: [
      {
        name: "Chaotic Contraption",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.30);
          ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.15));
        }
      }
    ]
  }),

  // 20 000 000 000 (Secret)
  sun_sprite_eclipse: defineCard({
    name: "Sun Sprite(Eclipse)",
    rng: 20000000000,
    weather: "glaring_sun",
    tags: ["elemental", "secret"],
    abilities: [
      {
        name: "Radiant Burst",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.10);
            a.currentHp = Math.round(a.currentHp * 1.10);
          });
          ctx.enemies().forEach(e => ctx.dealDamage(e, Math.round(e.currentHp * 0.10), "burn"));
        }
      }
    ]
  }),

  // 180 000 000 000 (Secret)
  specter_grim_reaper: defineCard({
    name: "Specter(Grim Reaper)",
    rng: 180000000000,
    weather: "shadowed_world",
    tags: ["undead", "secret"],
    abilities: [
      {
        name: "Haunting Presence",
        trigger: { event: "damage", phase: "before", actor: "opponent" },
        condition: (ctx) => !ctx.self.isDead,
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.80);
        }
      },
      {
        name: "Reaper Heal",
        trigger: { event: "turn", phase: "start", actor: "ally" },
        condition: (ctx) => !ctx.self.isDead,
        run: (ctx) => ctx.allies().forEach(a => ctx.heal(a, Math.round(a.maxHp * 0.08)))
      }
    ]
  }),

  // 250 000 000 000 (Secret)
  marching_colossus_void_colossus: defineCard({
    name: "Marching Colossus(Void Colossus)",
    rng: 250000000000,
    weather: "iron_legion",
    tags: ["golem", "void", "secret"],
    abilities: [
      {
        name: "Colossal Momentum",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          const next = ctx.activeEnemy();
          if (next) ctx.dealDamage(next, ctx.self.damage);
        }
      }
    ]
  })
};