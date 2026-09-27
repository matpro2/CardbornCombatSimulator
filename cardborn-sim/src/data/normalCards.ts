import type { CardBlueprint } from '../types/card';
import { compactNumber } from '../core/formulas';

export function defineCard(bp: CardBlueprint): CardBlueprint {
  return bp;
}

export const NORMAL_CARDS: Record<string, CardBlueprint> = {
  // 1
  dummy: defineCard({ name: "Dummy", rng: 1, tags: [], abilities: [] }),

  // 2
  scarecrow: defineCard({
    name: "Scarecrow",
    rng: 2,
    croppedImageId: "112249315395374",
    tags: [],
    abilities: [
      {
        name: "Field Guardian",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.15);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.15);
          ctx.emitStatChange(ctx.self.name, "max hp", "+15%");
        }
      }
    ],
    fabledAbilities: [
      {
        name: "Field Guardian",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.40);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.40);
          ctx.emitStatChange(ctx.self.name, "max hp", "+40%");
        }
      }
    ]
  }),

  // 5
  peasant: defineCard({
    name: "Peasant",
    rng: 5,
    croppedImageId: "122195750891979",
    tags: ["human"],
    abilities: [
      {
        name: "Peasant’s Bravery",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: (ctx) => ctx.self.currentHp / ctx.self.maxHp < 0.30,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.10);
          ctx.emitStatChange(ctx.self.name, "ATK", "+10%");
        }
      }
    ],
    fabledAbilities: [
      {
        name: "Peasant’s Bravery",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: (ctx) => ctx.self.currentHp / ctx.self.maxHp < 0.50,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.40);
          ctx.emitStatChange(ctx.self.name, "ATK", "+40%");
        }
      }
    ]
  }),

  // 10
  goblin: defineCard({
    name: "Goblin",
    rng: 10,
    croppedImageId: "99480292208738",
    tags: ["goblin"],
    abilities: [
      {
        name: "Pillage",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const opp = ctx.activeEnemy();
          if (opp) {
            const steal = Math.round(opp.damage * 0.07);
            ctx.self.damage += steal;
            ctx.emitStatChange(ctx.self.name, "ATK", `+${compactNumber(steal)}`);
          }
        }
      }
    ]
  }),

  // 30
  archer: defineCard({
    name: "Archer",
    rng: 30,
    croppedImageId: "82587670530265",
    tags: ["human"],
    abilities: [
      {
        name: "Focused Aim",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: (ctx) => (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.15);
          ctx.emitStatChange(ctx.self.name, "ATK", "+15%");
        }
      }
    ]
  }),

  // 55
  rogue: defineCard({
    name: "Rogue",
    rng: 55,
    croppedImageId: "116192795399925",
    tags: ["human"],
    abilities: [
      {
        name: "Ambush",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) ctx.dealDamage(target, Math.round(ctx.self.damage * 0.40));
          if (Math.random() < 0.25) ctx.self.damage *= 2;
        }
      }
    ]
  }),

  // 80
  priest: defineCard({
    name: "Priest",
    rng: 80,
    croppedImageId: "111907706177001",
    tags: ["human", "support"],
    abilities: [
      {
        name: "Purifying Light",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.05);
            a.currentHp = Math.round(a.currentHp * 1.05);
          });
        }
      }
    ]
  }),

  // 100
  druid: defineCard({
    name: "Druid",
    rng: 100,
    croppedImageId: "111191485862062",
    tags: ["human", "support"],
    abilities: [
      {
        name: "Nature’s Guardian",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => ctx.addBarrier(ctx.self, "nature_guardian", 1, "all")
      }
    ]
  }),

  // 180
  mage: defineCard({
    name: "Mage",
    rng: 180,
    croppedImageId: "97595085226280",
    tags: ["mage", "human"],
    abilities: [
      {
        name: "Flame Wall",
        trigger: { event: "turn", phase: "start", actor: "self" },
        maxUses: 2,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) ctx.dealDamage(enemy, Math.round(enemy.maxHp * 0.08), "burn");
        }
      }
    ]
  }),

  // 300
  witch: defineCard({
    name: "Witch",
    rng: 300,
    croppedImageId: "119466848541857",
    tags: ["mage"],
    abilities: [
      {
        name: "Dark Pact",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const sacrifice = Math.round(ctx.self.maxHp * 0.10);
          ctx.self.currentHp = Math.max(1, ctx.self.currentHp - sacrifice);
          ctx.self.damage = Math.round(ctx.self.damage * 1.10);
        }
      }
    ]
  }),

  // 500
  assassin: defineCard({
    name: "Assassin",
    rng: 500,
    croppedImageId: "128333228743519",
    tags: ["human"],
    abilities: [
      {
        name: "Backstab",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const team = ctx.state.teams[ctx.self.side];
          if (team[team.length - 1] === ctx.self) {
            ctx.self.damage = Math.round(ctx.self.damage * 1.30);
          }
        }
      }
    ]
  }),

  // 650
  spear_goblin: defineCard({
    name: "Spear Goblin",
    rng: 650,
    croppedImageId: "131696355726955",
    tags: ["goblin"],
    abilities: [
      {
        name: "Throwing Spear",
        trigger: { event: "turn", phase: "start", actor: "ally", filter: "first" },
        condition: (ctx) => !ctx.self.isDead,
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) ctx.dealDamage(target, Math.round(ctx.self.damage * 0.20));
        }
      }
    ]
  }),

  // 800
  knight: defineCard({
    name: "Knight",
    rng: 800,
    croppedImageId: "99005620672272",
    tags: ["knight", "human"],
    abilities: [
      {
        name: "Resilience",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.self.currentHp / ctx.self.maxHp > 0.40,
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.85);
        }
      }
    ]
  }),

  // 1 100
  goblin_gang: defineCard({
    name: "Goblin Gang",
    rng: 1100,
    croppedImageId: "125508600811028",
    tags: ["goblin"],
    abilities: [
      {
        name: "Swarm Strike",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const count = ctx.allies().filter(a => a.name.toLowerCase().includes("goblin")).length;
          ctx.self.damage = Math.round(ctx.self.damage * (1 + count * 0.20));
        }
      }
    ]
  }),

  // 1 250
  paladin: defineCard({
    name: "Paladin",
    rng: 1250,
    croppedImageId: "86359314833198",
    tags: ["paladin", "human"],
    abilities: [
      {
        name: "Holy Strike",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.15))
      }
    ]
  }),

  // 2 000
  necromancer: defineCard({
    name: "Necromancer",
    rng: 2000,
    croppedImageId: "89217372427117",
    tags: ["undead", "mage"],
    abilities: [
      {
        name: "Raise Dead",
        trigger: { event: "death", phase: "after", actor: "self" },
        condition: (ctx) => ctx.deadAllies().length > 0,
        run: (ctx) => {
          const pool = ctx.deadAllies();
          const picked = pool[Math.floor(Math.random() * pool.length)];
          if (picked) ctx.revive(picked, Math.round(picked.maxHp * 0.20));
        }
      }
    ]
  }),

  // 3 500
  goblin_lord: defineCard({
    name: "Goblin Lord",
    rng: 3500,
    croppedImageId: "82541533211943",
    tags: ["goblin", "leader"],
    abilities: [
      {
        name: "Goblin Rally",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => ctx.summon("goblin", 2)
      }
    ]
  }),

  // 6 000
  berserker: defineCard({
    name: "Berserker",
    rng: 6000,
    croppedImageId: "125865378330932",
    tags: ["warrior", "human"],
    abilities: [
      {
        name: "Double Strike",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
        }
      }
    ]
  }),

  // 10 000
  lich: defineCard({
    name: "Lich",
    rng: 10000,
    croppedImageId: "93107183478019",
    tags: ["undead", "mage"],
    abilities: [
      {
        name: "Lich’s Curse",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.defender) ctx.defender.damage = Math.round(ctx.defender.damage * 0.90);
        }
      }
    ]
  }),

  // 20 000
  spiderling: defineCard({
    name: "Spiderling",
    rng: 20000,
    croppedImageId: "134689872718825",
    tags: ["beast", "spider"],
    abilities: [
      {
        name: "Scurrying Escape",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.20,
        run: (ctx) => {
          if (ctx.attackEvent) {
            ctx.attackEvent.canceled = true;
            ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.10));
          }
        }
      }
    ]
  }),

  // 24 000
  barbarian: defineCard({
    name: "Barbarian",
    rng: 24000,
    croppedImageId: "100118236617345",
    tags: ["warrior", "human"],
    abilities: [
      {
        name: "Savage Fury",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.15);
        }
      }
    ]
  }),

  // 40 000
  knight_commander: defineCard({
    name: "Knight Commander",
    rng: 40000,
    croppedImageId: "83996789820702",
    tags: ["knight", "human"],
    abilities: [
      {
        name: "Inspiring Leadership",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const matchCount = ctx.allies().filter(a => a !== ctx.self && (a.tags.includes("knight") || a.tags.includes("paladin"))).length;
          const factor = 1 + matchCount * 0.10;
          ctx.self.damage = Math.round(ctx.self.damage * factor);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * factor);
          ctx.self.currentHp = ctx.self.maxHp;
        }
      }
    ]
  }),

  // 42 000
  armored_spider: defineCard({
    name: "Armored Spider",
    rng: 42000,
    croppedImageId: "128566934952020",
    tags: ["beast", "spider"],
    abilities: [
      {
        name: "Cocooned Protection",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.self.turnCount < 2,
        run: (ctx) => {
          if (ctx.damageEvent) {
            const absorbed = Math.round(ctx.damageEvent.amount * 0.40);
            ctx.damageEvent.amount -= absorbed;
            (ctx.self as any)._cocoon = ((ctx.self as any)._cocoon || 0) + absorbed;
          }
        }
      },
      {
        name: "Cocoon Burst",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount === 2 && Boolean((ctx.self as any)._cocoon),
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) ctx.dealDamage(enemy, Math.round(((ctx.self as any)._cocoon || 0) * 0.50));
        }
      }
    ]
  }),

  // 58 500
  black_widow: defineCard({
    name: "Black Widow",
    rng: 58500,
    croppedImageId: "85464115045187",
    tags: ["beast", "spider"],
    abilities: [
      {
        name: "Fatal Sting",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) {
            const mult = (target.currentHp / target.maxHp < 0.50) ? 1.40 : 0.70;
            ctx.dealDamage(target, Math.round(ctx.self.damage * mult));
          }
        }
      }
    ]
  }),

  // 66 000
  king: defineCard({
    name: "King",
    rng: 66000,
    croppedImageId: "91405471512853",
    tags: ["human", "leader"],
    abilities: [
      {
        name: "King's Rule",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const boost = Math.round(ctx.self.damage * 0.15);
          ctx.allies().filter(a => a !== ctx.self).forEach(a => a.damage += boost);
        }
      }
    ]
  }),

  // 85 000 (Event)
  pot_of_gold: defineCard({
    name: "Pot of Gold",
    rng: 85000,
    croppedImageId: "94081103024646",
    tags: ["event", "treasure"],
    abilities: [
      {
        name: "Treasure",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const healAmt = Math.round(ctx.self.maxHp * 0.05);
          ctx.allies().forEach(a => ctx.heal(a, healAmt));
        }
      }
    ]
  }),

  // 92 500
  spider_queen: defineCard({
    name: "Spider Queen",
    rng: 92500,
    croppedImageId: "129320723626329",
    tags: ["beast", "spider", "leader"],
    abilities: [
      {
        name: "Arachnid Dominion",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.allies().filter(a => a.tags.includes("spider")).forEach(s => s.damage = Math.round(s.damage * 1.20));
        }
      },
      {
        name: "Spider Defense",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.75);
        }
      }
    ]
  }),

  // 100 000
  dragon: defineCard({
    name: "Dragon",
    rng: 100000,
    croppedImageId: "79417836541151",
    tags: ["dragon", "beast"],
    abilities: [
      {
        name: "Dragon’s Roar",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            ctx.applyStatus(enemy, "stun", 1);
            enemy.damage = Math.round(enemy.damage * 0.85);
          }
        }
      }
    ]
  }),

  // 125 000
  griffin: defineCard({
    name: "Griffin",
    rng: 125000,
    croppedImageId: "91733053492980",
    tags: ["beast"],
    abilities: [
      {
        name: "Blinding Dive",
        trigger: { event: "attack", phase: "after", actor: "self" },
        condition: () => Math.random() < 0.20,
        run: (ctx) => {
          if (ctx.defender) {
            ctx.dealDamage(ctx.defender, Math.round(ctx.self.damage * 0.40));
            ctx.applyStatus(ctx.defender, "stun", 1);
          }
        }
      }
    ]
  }),

  // 200 000
  prism_serpent: defineCard({
    name: "Prism Serpent",
    rng: 200000,
    croppedImageId: "72030975346520",
    tags: ["beast", "crystal"],
    abilities: [
      {
        name: "Reflective Coil",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.50,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) enemy.damage = Math.round(enemy.damage * 0.85);
        }
      }
    ]
  }),

  // 225 000
  werewolf: defineCard({
    name: "Werewolf",
    rng: 225000,
    croppedImageId: "86978629056229",
    tags: ["beast", "undead"],
    abilities: [
      {
        name: "Full Moon Transformation",
        trigger: { event: "death", phase: "after", actor: "self" },
        maxUses: 1,
        run: (ctx) => {
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.15);
          ctx.self.damage = Math.round(ctx.self.damage * 1.15);
          ctx.revive(ctx.self, ctx.self.maxHp);
        }
      }
    ]
  }),

  // 295 000
  shardsprite: defineCard({
    name: "Shardsprite",
    rng: 295000,
    croppedImageId: "103123259501621",
    tags: ["elemental", "crystal"],
    abilities: [
      {
        name: "Refraction",
        trigger: { event: "damage", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.attacker && ctx.damageEvent) {
            ctx.dealDamage(ctx.attacker, Math.round(ctx.damageEvent.amount * 0.30), "reflected");
          }
        }
      }
    ]
  }),

  // 325 000 (Event)
  the_heartbroken: defineCard({
    name: "The Heartbroken",
    rng: 325000,
    croppedImageId: "110945338282034",
    tags: ["event", "human"],
    abilities: [
      {
        name: "Rejection of Love",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.maxHp *= 2;
          ctx.self.currentHp *= 2;
          (ctx.self as any)._origHp = ctx.self.health;
        }
      },
      {
        name: "Heartbroken Retaliation",
        trigger: { event: "damage", phase: "after", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            ctx.dealDamage(enemy, Math.round(((ctx.self as any)._origHp || ctx.self.maxHp) * 0.25));
            enemy.damage = Math.round(enemy.damage * 0.90);
          }
        }
      }
    ]
  }),

  // 380 000
  gleamstone_golem: defineCard({
    name: "Gleamstone Golem",
    rng: 380000,
    croppedImageId: "94551983484568",
    tags: ["golem", "crystal"],
    abilities: [
      {
        name: "Gemstone Fortress",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const first = ctx.allies()[0];
          if (first) ctx.addBarrier(first, "gemstone_fortress", 1, "all");
        }
      }
    ]
  }),

  // 500 000
  vampire: defineCard({
    name: "Vampire",
    rng: 500000,
    croppedImageId: "116567271676145",
    tags: ["undead"],
    abilities: [
      {
        name: "Vampiric Drain",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => ctx.heal(ctx.self, Math.round(ctx.self.damage * 0.50))
      }
    ]
  }),

  // 550 000 (Secret)
  rogue_black_cat: defineCard({
    name: "Rogue(Black Cat)",
    rng: 550000,
    croppedImageId: "140202189094472",
    tags: ["human", "secret"],
    abilities: [
      {
        name: "Ambush",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) ctx.dealDamage(target, Math.round(ctx.self.damage * 0.40));
          if (Math.random() < 0.25) ctx.self.damage *= 2;
        }
      }
    ]
  }),

  // 610 000
  quartz_beetle: defineCard({
    name: "Quartz Beetle",
    rng: 610000,
    croppedImageId: "86247915461395",
    tags: ["beast", "crystal"],
    abilities: [
      {
        name: "Crystal Slam",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.50,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.10);
          ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.10));
        }
      }
    ]
  }),

  // 750 000
  archmage: defineCard({
    name: "Archmage",
    rng: 750000,
    croppedImageId: "130551318786069",
    tags: ["mage", "human"],
    abilities: [
      {
        name: "Arcane Mastery",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.40,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            const hpDrain = Math.round(enemy.currentHp * 0.10);
            const atkDrain = Math.round(enemy.damage * 0.10);
            enemy.currentHp = Math.max(1, enemy.currentHp - hpDrain);
            enemy.damage = Math.max(1, enemy.damage - atkDrain);
            ctx.self.currentHp += hpDrain;
            ctx.self.damage += atkDrain;
          }
        }
      }
    ]
  }),

  // 900 000
  elemental_lord: defineCard({
    name: "Elemental Lord",
    rng: 900000,
    croppedImageId: "140098149253130",
    tags: ["elemental", "leader"],
    abilities: [
      {
        name: "Elemental Fury",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            if (Math.random() < 0.50) ctx.applyStatus(enemy, "freeze", 1);
            else ctx.dealDamage(enemy, Math.round(enemy.maxHp * 0.10), "elemental");
          }
        }
      }
    ]
  }),

  // 1 000 000
  lich_king: defineCard({
    name: "Lich King",
    rng: 1000000,
    croppedImageId: "120286429544243",
    tags: ["undead", "leader"],
    abilities: [
      {
        name: "Dark Ritual",
        trigger: { event: "damage", phase: "after", actor: "self" },
        condition: (ctx) => ctx.self.currentHp / ctx.self.maxHp < 0.60 && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          const deadAtk = ctx.deadAllies().reduce((sum, a) => sum + a.damage, 0);
          ctx.self.damage += Math.round(deadAtk * 0.50);
        }
      }
    ]
  }),

  // 1 000 000
  storm_giant: defineCard({
    name: "Storm Giant",
    rng: 1000000,
    croppedImageId: "110428035408490",
    tags: ["giant", "elemental"],
    abilities: [
      {
        name: "Eye of the Storm",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.35,
        run: (ctx) => {
          if (ctx.attackEvent) ctx.attackEvent.canceled = true;
        }
      }
    ]
  }),

  // 1 250 000
  king_prismalith: defineCard({
    name: "King Prismalith",
    rng: 1250000,
    croppedImageId: "134610719394054",
    tags: ["elemental", "crystal"],
    abilities: [
      {
        name: "Crystalline Prison",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount > 0 && ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          const enemies = ctx.enemies();
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          if (target) {
            ctx.applyStatus(target, "stun", 1);
            ctx.dealDamage(target, Math.round(target.maxHp * 0.15));
          }
        }
      }
    ]
  }),

  // 1 270 000 (Event)
  the_cake_of_celebration: defineCard({
    name: "The Cake of Celebration",
    rng: 1270000,
    croppedImageId: "124226170292377",
    tags: ["event"],
    abilities: [
      {
        name: "The Coming of the Year",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const step = (ctx.self.turnCount * 2) - 1;
          const factor = 1 + (step / 100);
          ctx.self.damage = Math.round(ctx.self.damage * factor);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * factor);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * factor);
        }
      }
    ]
  }),

  // 1 500 000
  amethyst_spider: defineCard({
    name: "Amethyst Spider",
    rng: 1500000,
    tags: ["beast", "spider", "crystal"],
    abilities: [
      {
        name: "Amethyst Armor",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          const stacks = Math.min(5, (ctx.self as any)._stacks || 0);
          const totalReduction = 0.10 + stacks * 0.05;
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * (1 - totalReduction));
        }
      },
      {
        name: "Stack Defense",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          (ctx.self as any)._stacks = Math.min(5, ((ctx.self as any)._stacks || 0) + 1);
        }
      }
    ]
  }),

  // 2 000 000
  divine_archmage: defineCard({
    name: "Divine Archmage",
    rng: 2000000,
    tags: ["mage", "holy"],
    abilities: [
      {
        name: "Sacred Rejuvenation",
        trigger: { event: "death", phase: "after", actor: "self" },
        condition: () => Math.random() < 0.50,
        run: (ctx) => {
          const next = ctx.allies().find(a => !a.isDead);
          if (next) {
            next.maxHp += Math.round(ctx.self.maxHp * 0.50);
            next.currentHp += Math.round(ctx.self.maxHp * 0.50);
            next.damage += Math.round(ctx.self.damage * 0.50);
          }
        }
      }
    ]
  }),

  // 3 170 000 (Event)
  leprechaun: defineCard({
    name: "Leprechaun",
    rng: 3170000,
    tags: ["event", "fairy"],
    abilities: [
      {
        name: "Greed",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const pots = ctx.allies().filter(a => a.name.includes("Pot of Gold")).length;
          const factor = 1 + pots * 0.15;
          ctx.self.damage = Math.round(ctx.self.damage * factor);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * factor);
          ctx.self.currentHp = ctx.self.maxHp;
        }
      }
    ]
  }),

  // 5 000 000
  void_angel: defineCard({
    name: "Void Angel",
    rng: 5000000,
    tags: ["angel", "void"],
    abilities: [
      {
        name: "Void Beam",
        trigger: { event: "attack", phase: "after", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          const enemies = ctx.enemies();
          if (enemies[1]) ctx.dealDamage(enemies[1], Math.round(ctx.self.damage * 0.50), "void_beam");
        }
      }
    ]
  }),

  // 8 000 000
  hollow_archer: defineCard({
    name: "Hollow Archer",
    rng: 8000000,
    tags: ["undead"],
    abilities: [
      {
        name: "Soulpierce Arrow",
        trigger: { event: "attack", phase: "before", actor: "self" },
        condition: () => Math.random() < 0.15,
        run: (ctx) => {
          ctx.self.damage *= 3;
          ctx.emitStatChange(ctx.self.name, "ATK", "3x Soulpierce");
        }
      }
    ]
  }),

  // 10 000 000
  demon_lord: defineCard({
    name: "Demon Lord",
    rng: 10000000,
    tags: ["demon", "leader"],
    abilities: [
      {
        name: "Demonic Fury",
        trigger: { event: "damage", phase: "after", actor: "self" },
        run: (ctx) => {
          const lostSteps = Math.min(5, Math.floor((1 - (ctx.self.currentHp / ctx.self.maxHp)) * 10));
          ctx.self.damage = Math.round(ctx.self.health * (1 + lostSteps * 0.10));
        }
      }
    ]
  }),

  // 11 000 000 (Secret)
  goblin_gang_undead: defineCard({
    name: "Goblin Gang(Undead Army)",
    rng: 11000000,
    croppedImageId: "78099391484558",
    tags: ["goblin", "undead", "secret"],
    abilities: [
      {
        name: "Swarm Strike",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const count = ctx.allies().filter(a => a.name.toLowerCase().includes("goblin")).length;
          ctx.self.damage = Math.round(ctx.self.damage * (1 + count * 0.20));
        }
      }
    ]
  }),

  // 12 500 000 (Secret)
  paladin_samurai: defineCard({
    name: "Paladin(Samurai)",
    rng: 12500000,
    croppedImageId: "128030846529272",
    tags: ["paladin", "human", "secret"],
    abilities: [
      {
        name: "Holy Strike",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.15))
      }
    ]
  }),

  // 12 500 000
  elder_dragon: defineCard({
    name: "Elder Dragon",
    rng: 12500000,
    tags: ["dragon", "boss"],
    abilities: [
      {
        name: "Immortal Scales",
        trigger: { event: "damage", phase: "after", actor: "self" },
        condition: (ctx) => ctx.self.currentHp / ctx.self.maxHp < 0.50 && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.50));
          (ctx.self as any)._scalesActive = true;
        }
      },
      {
        name: "Elder Growth",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => Boolean((ctx.self as any)._scalesActive),
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.10);
        }
      }
    ]
  }),

  // 15 000 000
  heavenly_hen: defineCard({
    name: "Heavenly Hen",
    rng: 15000000,
    tags: ["beast", "holy"],
    abilities: [
      {
        name: "Strut & Strike",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          if (ctx.self.turnCount % 2 === 1) {
            ctx.addShield(ctx.self, "hen_guard", Math.round(ctx.self.damage * 0.30));
          } else {
            const enemy = ctx.activeEnemy();
            if (enemy && enemy.rng < ctx.self.rng) {
              ctx.self.damage = Math.round(ctx.self.damage * 1.80);
            }
          }
        }
      }
    ]
  }),

  // 16 000 000
  ghastly_herald: defineCard({
    name: "Ghastly Herald",
    rng: 16000000,
    tags: ["undead"],
    abilities: [
      {
        name: "Death’s Whisper",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const target = ctx.activeEnemy();
          if (target) {
            ctx.dealDamage(target, Math.round(ctx.self.damage * 0.35));
            (target as any)._heraldCurse = 2;
          }
        }
      }
    ]
  }),

  // 20 000 000
  storm_king: defineCard({
    name: "Storm King",
    rng: 20000000,
    tags: ["elemental", "leader"],
    abilities: [
      {
        name: "Raging Tempest",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.50,
        run: (ctx) => {
          if (ctx.attacker) ctx.dealDamage(ctx.attacker, Math.round(ctx.self.damage * 0.35), "lightning");
        }
      }
    ]
  }),

  // 20 000 000
  earth_king: defineCard({
    name: "Earth King",
    rng: 20000000,
    tags: ["elemental", "leader"],
    abilities: [
      {
        name: "Earth's Blessing",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.15);
            a.currentHp = Math.round(a.currentHp * 1.15);
          });
        }
      }
    ]
  }),

  // 20 000 000
  frost_warden: defineCard({
    name: "Frost Warden",
    rng: 20000000,
    tags: ["elemental", "guard"],
    abilities: [
      {
        name: "Winter’s Grasp",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.defender) {
            const stealAtk = Math.round(ctx.defender.damage * 0.07);
            const stealHp = Math.round(ctx.defender.currentHp * 0.07);
            ctx.self.damage += stealAtk;
            ctx.self.currentHp += stealHp;
            if (Math.random() < 0.20) ctx.applyStatus(ctx.defender, "freeze", 1);
          }
        }
      }
    ]
  }),

  // 20 000 000
  thunder_arbiter: defineCard({
    name: "Thunder Arbiter",
    rng: 20000000,
    tags: ["elemental", "holy"],
    abilities: [
      {
        name: "Moment of Impact",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.damageEvent !== undefined && ctx.damageEvent.amount >= ctx.self.currentHp && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent) {
            ctx.damageEvent.amount = ctx.self.currentHp - 1;
            if (ctx.attacker) ctx.applyStatus(ctx.attacker, "stun", 1);
          }
        }
      }
    ]
  }),

  // 25 000 000
  patient_roller: defineCard({
    name: "Patient Roller",
    rng: 25000000,
    tags: ["human"],
    abilities: [
      {
        name: "Double or Nothing",
        trigger: { event: "attack", phase: "before", actor: "self" },
        run: (ctx) => {
          if (Math.random() < 0.50) ctx.self.damage *= 2;
          else if (ctx.attackEvent) ctx.attackEvent.canceled = true;
        }
      }
    ]
  }),

  // 28 000 000
  blighted_blacksmith: defineCard({
    name: "Blighted Blacksmith",
    rng: 28000000,
    tags: ["undead", "human"],
    abilities: [
      {
        name: "Cursed Forge",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.damage = Math.round(a.damage * 1.07);
            a.maxHp = Math.round(a.maxHp * 1.07);
            a.currentHp = Math.round(a.currentHp * 1.07);
          });
        }
      },
      {
        name: "Continuous Tempering",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.damage = Math.round(a.damage * 1.05);
            a.maxHp = Math.round(a.maxHp * 1.05);
          });
        }
      }
    ]
  }),

  // 30 000 000
  dream_eater: defineCard({
    name: "Dream Eater",
    rng: 30000000,
    tags: ["eldritch", "spirit"],
    abilities: [
      {
        name: "Mind Fracture",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.15,
        run: (ctx) => {
          if (ctx.attackEvent) ctx.attackEvent.canceled = true;
        }
      }
    ]
  }),

  // 35 000 000
  mighty_kraken: defineCard({
    name: "Mighty Kraken",
    rng: 35000000,
    tags: ["beast", "boss"],
    abilities: [
      {
        name: "Crushing Depths",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) enemy.damage = Math.round(enemy.damage * 0.50);
        }
      }
    ]
  }),

  // 50 000 000
  celestial_entity: defineCard({
    name: "Celestial Entity",
    rng: 50000000,
    tags: ["cosmic"],
    abilities: [
      {
        name: "Astral Blessing",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.40,
        run: (ctx) => {
          if (ctx.attackEvent) {
            ctx.attackEvent.canceled = true;
            ctx.allies().forEach(a => {
              a.damage = Math.round(a.damage * 1.10);
              a.maxHp = Math.round(a.maxHp * 1.10);
              a.currentHp = Math.round(a.currentHp * 1.10);
            });
          }
        }
      }
    ]
  }),

  // 60 000 000 (Secret)
  berserker_voidserker: defineCard({
    name: "Berserker(Voidserker)",
    rng: 60000000,
    croppedImageId: "119696533997512",
    tags: ["warrior", "void", "secret"],
    abilities: [
      {
        name: "Double Strike",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
        }
      }
    ]
  }),

  // 61 400 000 (Event)
  romeo_and_juliet: defineCard({
    name: "Romeo and Juliet",
    rng: 61400000,
    tags: ["event", "human"],
    abilities: [
      {
        name: "Till Death Do Us Part",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
          ctx.self.damage = Math.round(ctx.self.damage * 1.40);
          ctx.self.currentHp = Math.max(1, Math.round(ctx.self.currentHp * 0.85));
        }
      }
    ]
  }),

  // 65 000 000
  marionette: defineCard({
    name: "Marionette",
    rng: 65000000,
    tags: ["spirit"],
    abilities: [
      {
        name: "Puppet Strings",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.damageEvent !== undefined && ctx.damageEvent.amount >= ctx.self.currentHp && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent) {
            const rawDmg = ctx.damageEvent.amount;
            ctx.damageEvent.amount = 0;
            const lowest = ctx.lowestHpEnemy();
            if (lowest) ctx.dealDamage(lowest, rawDmg, "redirected");
          }
        }
      }
    ]
  }),

  // 78 000 000
  hollow_bellsinger: defineCard({
    name: "Hollow Bellsinger",
    rng: 78000000,
    tags: ["undead"],
    abilities: [
      {
        name: "Melodic Resonance",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          ctx.self.maxHp += ctx.self.damage;
          ctx.self.currentHp = ctx.self.maxHp;
        }
      },
      {
        name: "Melodic Revival",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          const dead = ctx.deadAllies();
          if (dead.length > 0) {
            ctx.revive(dead[0], Math.round(dead[0].maxHp * 0.50));
          } else {
            const exp = ctx.self.maxHp;
            ctx.enemies().forEach(e => ctx.dealDamage(e, exp, "explosion"));
            ctx.dealDamage(ctx.self, ctx.self.currentHp, "self_destruct");
          }
        }
      }
    ]
  }),

  // 80 000 000
  behemoth: defineCard({
    name: "Behemoth",
    rng: 80000000,
    tags: ["monster", "beast"],
    abilities: [
      {
        name: "Behemoth's Wrath",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.50);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.50);
          ctx.self.currentHp = ctx.self.maxHp;
        }
      }
    ]
  }),

  // 90 000 000
  archbishop_of_the_end: defineCard({
    name: "Archbishop of the End",
    rng: 90000000,
    tags: ["holy", "leader"],
    abilities: [
      {
        name: "Endless Reign",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          const team = ctx.state.teams[ctx.self.side];
          const last = team[team.length - 1];
          if (last && last !== ctx.self && ctx.damageEvent) {
            const dmg = ctx.damageEvent.amount;
            ctx.damageEvent.amount = 0;
            ctx.dealDamage(last, dmg, "redirected");
          }
        }
      }
    ]
  }),

  // 100 000 000
  chaos_emperor: defineCard({
    name: "Chaos Emperor",
    rng: 100000000,
    tags: ["eldritch", "boss"],
    abilities: [
      {
        name: "Unstable Power",
        trigger: { event: "attack", phase: "before", actor: "self" },
        run: (ctx) => {
          const mult = 0.60 + Math.random() * 1.90;
          ctx.self.damage = Math.round(ctx.self.health * mult);
        }
      }
    ]
  }),

  // 125 000 000
  abyss_warlord: defineCard({
    name: "Abyss Warlord",
    rng: 125000000,
    tags: ["void", "warrior"],
    abilities: [
      {
        name: "Store Abyss",
        trigger: { event: "damage", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            const cap = ctx.self.maxHp * 3;
            (ctx.self as any)._stored = Math.min(cap, ((ctx.self as any)._stored || 0) + ctx.damageEvent.amount);
          }
        }
      },
      {
        name: "Void Devastation",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          const stored = (ctx.self as any)._stored || 0;
          if (enemy && stored > 0) ctx.dealDamage(enemy, stored, "void_devastation");
        }
      }
    ]
  }),

  // 160 000 000
  crumbling_warden: defineCard({
    name: "Crumbling Warden",
    rng: 160000000,
    tags: ["golem"],
    abilities: [
      {
        name: "Final Stand",
        trigger: { event: "death", phase: "after", actor: "self" },
        run: (ctx) => {
          ctx.enemies().forEach(e => e.damage = Math.round(e.damage * 0.80));
        }
      }
    ]
  }),

  // 200 000 000
  supreme_archangel: defineCard({
    name: "Supreme Archangel",
    rng: 200000000,
    tags: ["angel", "holy"],
    abilities: [
      {
        name: "Grace of the Divine",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent && ctx.damageEvent.amount < ctx.self.maxHp * 0.25) {
            const healAmt = ctx.damageEvent.amount;
            ctx.damageEvent.amount = 0;
            ctx.heal(ctx.self, healAmt);
          }
        }
      }
    ]
  }),

  // 260 000 000
  fallen_knight: defineCard({
    name: "Fallen Knight",
    rng: 260000000,
    tags: ["undead", "knight"],
    abilities: [
      {
        name: "Soul Reservoir",
        trigger: { event: "death", phase: "after", actor: "self" },
        maxUses: 2,
        condition: () => Math.random() < 0.60,
        run: (ctx) => {
          ctx.revive(ctx.self, Math.round(ctx.self.maxHp * 0.50));
          const opp = ctx.activeEnemy();
          if (opp) ctx.applyStatus(opp, "stun", 1);
        }
      }
    ]
  }),

  // 300 000 000
  eternal_beast: defineCard({
    name: "Eternal Beast",
    rng: 300000000,
    tags: ["beast", "cosmic"],
    abilities: [
      {
        name: "Endless Hunger",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.40,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.20);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.20);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.20);
        }
      }
    ]
  }),

  // 455 000 000
  infernal_titan: defineCard({
    name: "Infernal Titan",
    rng: 455000000,
    tags: ["giant", "elemental"],
    abilities: [
      {
        name: "Furnace Heart",
        trigger: { event: "damage", phase: "after", actor: "self" },
        run: (ctx) => ctx.allies().forEach(a => a.damage = Math.round(a.damage * 1.15))
      }
    ]
  }),

  // 500 000 000
  celestial_fury: defineCard({
    name: "Celestial Fury",
    rng: 500000000,
    tags: ["cosmic", "holy"],
    abilities: [
      {
        name: "Celestial Smite",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          if (ctx.attackContext) ctx.attackContext.strikeCount = 2;
          ctx.self.damage = Math.round(ctx.self.damage * 1.125);
        }
      }
    ]
  }),

  // 550 000 000
  mimic: defineCard({
    name: "Mimic",
    rng: 550000000,
    tags: ["monster"],
    abilities: [
      {
        name: "Treacherous Feast",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemies = ctx.enemies();
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          if (target) ctx.dealDamage(target, Math.round(ctx.self.damage * 0.20));
        }
      }
    ]
  }),

  // 600 000 000
  dragon_king: defineCard({
    name: "Dragon King",
    rng: 600000000,
    unshieldable: true,
    tags: ["dragon", "boss"],
    abilities: [
      {
        name: "King’s Command",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) ctx.dealDamage(enemy, Math.round(enemy.damage * 0.65), "confusion");
        }
      }
    ]
  }),

  // 625 000 000
  forgotten_cultist: defineCard({
    name: "Forgotten Cultist",
    rng: 625000000,
    tags: ["human", "eldritch"],
    abilities: [
      {
        name: "Rotten Pact",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const team = ctx.state.teams[ctx.self.side];
          const last = team[team.length - 1];
          if (last) {
            last.damage = Math.round(last.damage + ctx.self.damage * 1.50);
            (last as any)._doom = 2;
          }
        }
      }
    ]
  }),

  // 666 000 000
  void_reaver: defineCard({
    name: "Void Reaver",
    rng: 666000000,
    tags: ["void", "demon"],
    abilities: [
      {
        name: "Nullify",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.enemies().forEach(e => {
            e.abilities = e.abilities.filter(a => a.name.toLowerCase().includes("dodge") || a.name.toLowerCase().includes("escape"));
          });
        }
      }
    ]
  }),

  // 750 000 000
  titanic_beast: defineCard({
    name: "Titanic Beast",
    rng: 750000000,
    tags: ["beast", "giant"],
    abilities: [
      {
        name: "Titan’s Kindness",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          if (ctx.deadAllies().length > 0) {
            ctx.self.damage = Math.round(ctx.self.health * 3.0);
          } else {
            ctx.allies().forEach(a => {
              a.damage = Math.round(a.damage * 1.10);
              a.maxHp = Math.round(a.maxHp * 1.10);
              a.currentHp = Math.round(a.currentHp * 1.10);
            });
          }
        }
      }
    ]
  }),

  // 800 000 000
  abyssal_maw: defineCard({
    name: "Abyssal Maw",
    rng: 800000000,
    tags: ["void", "monster"],
    abilities: [
      {
        name: "Pull of the Deep",
        trigger: { event: "attack", phase: "before", actor: "self" },
        run: (ctx) => {
          const idx = ctx.defender ? ctx.enemies().indexOf(ctx.defender) : 0;
          const boost = Math.max(0.10, 0.25 - idx * 0.05);
          ctx.self.damage = Math.round(ctx.self.damage * (1 + boost));
        }
      }
    ]
  }),

  // 850 000 000
  eternal_knight: defineCard({
    name: "Eternal Knight",
    rng: 850000000,
    tags: ["knight", "holy"],
    abilities: [
      {
        name: "Fate Reversal",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent && ctx.attacker) {
            const raw = ctx.damageEvent.amount;
            ctx.damageEvent.amount = 0;
            ctx.dealDamage(ctx.attacker, Math.round(raw * 0.35), "reflected");
            if (ctx.attacker.isDead) ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.50));
          }
        }
      }
    ]
  }),

  // 900 000 000
  cosmic_dragon: defineCard({
    name: "Cosmic Dragon",
    rng: 900000000,
    tags: ["cosmic", "dragon"],
    abilities: [
      {
        name: "Starfall Barrage",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.enemies().forEach(e => ctx.dealDamage(e, Math.round(ctx.self.damage * 0.15)));
        }
      },
      {
        name: "Cosmic Rampage",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.30);
        }
      }
    ]
  }),

  // 950 000 000
  the_silent_king: defineCard({
    name: "The Silent King",
    rng: 950000000,
    tags: ["leader", "spirit"],
    abilities: [
      {
        name: "Royal Decree: Silence",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        run: (ctx) => {
          const dodgeChance = Math.min(0.60, 0.30 + ((ctx.self as any)._hits || 0) * 0.10);
          if (Math.random() < dodgeChance && ctx.attackEvent) {
            ctx.attackEvent.canceled = true;
          } else {
            (ctx.self as any)._hits = ((ctx.self as any)._hits || 0) + 1;
          }
        }
      }
    ]
  }),

  // 1 000 000 000 (Secret)
  dragon_loong: defineCard({
    name: "Dragon(Loong)",
    rng: 1000000000,
    croppedImageId: "81761147935871",
    tags: ["dragon", "secret"],
    abilities: [
      {
        name: "Dragon’s Roar",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) {
            ctx.applyStatus(enemy, "stun", 1);
            enemy.damage = Math.round(enemy.damage * 0.85);
          }
        }
      }
    ]
  }),

  // 1 000 000 000 (Event)
  rift_dragon: defineCard({
    name: "Rift Dragon",
    rng: 1000000000,
    tags: ["event", "dragon"],
    abilities: [
      {
        name: "Between Worlds",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.30);
        }
      }
    ]
  }),

  // 1 000 000 000
  dread_lord: defineCard({
    name: "Dread Lord",
    rng: 1000000000,
    tags: ["undead", "boss"],
    abilities: [
      {
        name: "Shadow Rebirth",
        trigger: { event: "death", phase: "after", actor: "self" },
        maxUses: 1,
        run: (ctx) => {
          ctx.revive(ctx.self, ctx.self.maxHp);
          ctx.enemies().forEach(e => ctx.dealDamage(e, ctx.self.maxHp, "explosion"));
        }
      }
    ]
  }),

  // 1 000 000 000
  arcane_overlord: defineCard({
    name: "Arcane Overlord",
    rng: 1000000000,
    tags: ["mage", "boss"],
    abilities: [
      {
        name: "Arcane Cataclysm",
        trigger: { event: "damage", phase: "before", actor: "self" },
        run: (ctx) => {
          if (ctx.damageEvent) {
            if (ctx.damageEvent.amount < ctx.self.maxHp * 0.25) {
              ctx.damageEvent.amount = 0;
            } else {
              ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.70);
            }
          }
        }
      }
    ]
  }),

  // 1 500 000 000
  world_eater: defineCard({
    name: "World Eater",
    rng: 1500000000,
    tags: ["cosmic", "eldritch"],
    abilities: [
      {
        name: "Cataclysmic Devour",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          if (ctx.victim) {
            ctx.self.damage += Math.round(ctx.victim.damage * 0.30);
            ctx.self.maxHp += Math.round(ctx.victim.maxHp * 0.30);
            ctx.self.currentHp += Math.round(ctx.victim.maxHp * 0.30);
          }
        }
      }
    ]
  }),

  // 2 000 000 000 (Secret)
  prism_serpent_celestial: defineCard({
    name: "Prism Serpent(Celestial)",
    rng: 2000000000,
    croppedImageId: "121252334240350",
    tags: ["beast", "crystal", "secret"],
    abilities: [
      {
        name: "Reflective Coil",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.50,
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) enemy.damage = Math.round(enemy.damage * 0.85);
        }
      }
    ]
  }),

  // 5 000 000 000
  king_of_yellow: defineCard({
    name: "King of Yellow",
    rng: 5000000000,
    tags: ["eldritch", "mage"],
    abilities: [
      {
        name: "Kings Vision",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.15);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.15);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.15);
        }
      }
    ]
  }),

  // 7 000 000 000
  the_creator: defineCard({
    name: "The Creator",
    rng: 7000000000,
    tags: ["deity"],
    abilities: [
      {
        name: "Ruler Of Cardborn",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const opp = ctx.activeEnemy();
          if (opp) {
            if (opp.rng < ctx.self.rng) {
              ctx.self.damage = Math.round(ctx.self.damage * 1.30);
            } else {
              ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.50);
              ctx.self.currentHp = ctx.self.maxHp;
              ctx.addBarrier(ctx.self, "creator_shield", 1, "all");
            }
          }
        }
      }
    ]
  }),

  // 8 500 000 000
  frosted_sentinel: defineCard({
    name: "Frosted Sentinel",
    rng: 8500000000,
    tags: ["golem", "elemental"],
    abilities: [
      {
        name: "Frozen Guard",
        trigger: { event: "damage", phase: "after", actor: "self" },
        condition: () => Math.random() < 0.40,
        run: (ctx) => {
          if (ctx.attacker) ctx.applyStatus(ctx.attacker, "freeze", 1);
        }
      }
    ]
  }),

  // 12 000 000 000
  usurper: defineCard({
    name: "Usurper",
    rng: 12000000000,
    tags: ["human", "leader"],
    abilities: [
      {
        name: "Turn Theft",
        trigger: { event: "turn", phase: "start", actor: "opponent" },
        condition: (ctx) => (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          ctx.emitStatChange(ctx.self.name, "usurp", "Turn Stolen");
        }
      }
    ]
  }),

  // 20 000 000 000
  the_crawling_chaos: defineCard({
    name: "The Crawling Chaos",
    rng: 20000000000,
    tags: ["eldritch"],
    abilities: [
      {
        name: "Borrowed Mask",
        trigger: { event: "death", phase: "after", actor: "ally", relativePosition: "immediate_before" },
        run: (ctx) => {
          if (ctx.victim && ctx.victim.abilities) {
            ctx.self.abilities = [...ctx.self.abilities, ...ctx.victim.abilities];
          }
        }
      }
    ]
  }),

  // 22 500 000 000
  blizzard_arcanist: defineCard({
    name: "Blizzard Arcanist",
    rng: 22500000000,
    tags: ["mage", "elemental"],
    abilities: [
      {
        name: "Permafrost",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          const enemy = ctx.activeEnemy();
          if (enemy) ctx.applyStatus(enemy, "freeze", 1);
        }
      },
      {
        name: "Glacial Reap",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        condition: (ctx) => Boolean(ctx.victim?.statuses.freeze),
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.20);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.20);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.20);
        }
      }
    ]
  }),

  // 35 000 000 000
  plague_sovereign: defineCard({
    name: "Plague Sovereign",
    rng: 35000000000,
    tags: ["undead", "boss"],
    abilities: [
      {
        name: "Withering Feast",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.defender) {
            ctx.defender.maxHp = Math.max(1, ctx.defender.maxHp - ctx.self.damage);
            ctx.defender.currentHp = Math.min(ctx.defender.currentHp, ctx.defender.maxHp);
          }
        }
      }
    ]
  }),

  // 44 000 000 000
  snowmaw: defineCard({
    name: "Snowmaw",
    rng: 44000000000,
    tags: ["beast", "elemental"],
    abilities: [
      {
        name: "Crushing Cold",
        trigger: { event: "battle", phase: "start" },
        run: (ctx) => {
          const sorted = [...ctx.enemies()].sort((a, b) => a.rng - b.rng);
          if (sorted[0] && sorted[0].rng < ctx.self.rng) ctx.applyStatus(sorted[0], "freeze", 1);
          if (sorted[1] && sorted[1].rng < ctx.self.rng) ctx.applyStatus(sorted[1], "freeze", 1);
        }
      },
      {
        name: "Glacial Hide",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => Boolean(ctx.attacker && ctx.attacker.rng < ctx.self.rng),
        run: (ctx) => {
          if (ctx.damageEvent) ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * 0.80);
        }
      }
    ]
  }),

  // 50 000 000 000 (Secret)
  void_angel_true_angel: defineCard({
    name: "Void Angel(True Angel)",
    rng: 50000000000,
    tags: ["angel", "void", "secret"],
    abilities: [
      {
        name: "Void Beam",
        trigger: { event: "attack", phase: "after", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          const enemies = ctx.enemies();
          if (enemies[1]) ctx.dealDamage(enemies[1], Math.round(ctx.self.damage * 0.50), "void_beam");
        }
      }
    ]
  }),

  // 94 000 000 000
  whiteout_stalker: defineCard({
    name: "Whiteout Stalker",
    rng: 94000000000,
    tags: ["beast", "elemental"],
    abilities: [
      {
        name: "Assassin’s Blizzard",
        trigger: { event: "turn", phase: "attack", actor: "self" },
        run: (ctx) => {
          const low = ctx.lowestHpEnemy();
          if (low) {
            ctx.defender = low;
            if (low.statuses.freeze) ctx.self.damage = Math.round(ctx.self.damage * 1.40);
          }
        }
      }
    ]
  }),

  // 190 000 000 000
  glacial_goliath: defineCard({
    name: "Glacial Goliath",
    rng: 190000000000,
    tags: ["giant", "elemental"],
    abilities: [
      {
        name: "Arctic Giant’s Protection",
        trigger: { event: "damage", phase: "after", actor: "ally", relativePosition: "immediate_before" },
        condition: (ctx) => ctx.victim !== undefined && ctx.victim.currentHp / ctx.victim.maxHp < 0.40 && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.victim) ctx.heal(ctx.victim, ctx.victim.maxHp);
          const opp = ctx.activeEnemy();
          if (opp) ctx.applyStatus(opp, "freeze", 1);
        }
      }
    ]
  }),

  // 225 000 000 000
  tyrant_of_the_frozen_end: defineCard({
    name: "Tyrant of the Frozen End",
    rng: 225000000000,
    tags: ["boss", "elemental"],
    abilities: [
      {
        name: "Endless Winter",
        trigger: { event: "entry", phase: "start", actor: "self" },
        condition: (ctx) => ctx.enemies().some(e => e.statuses.freeze > 0),
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.30);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.30);
          ctx.self.currentHp = ctx.self.maxHp;
        }
      },
      {
        name: "Tyrant Defiance",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.damageEvent !== undefined && ctx.damageEvent.amount >= ctx.self.currentHp && (ctx.self.abilityUses[1] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent) {
            const healAmt = ctx.damageEvent.amount;
            ctx.damageEvent.amount = 0;
            ctx.heal(ctx.self, healAmt);
          }
        }
      }
    ]
  }),

  // 300 000 000 000 (Secret)
  dream_eater_signus: defineCard({
    name: "Dream Eater(Signus)",
    rng: 300000000000,
    tags: ["eldritch", "spirit", "secret"],
    abilities: [
      {
        name: "Mind Fracture",
        trigger: { event: "attack", phase: "before", actor: "opponent" },
        condition: () => Math.random() < 0.15,
        run: (ctx) => {
          if (ctx.attackEvent) ctx.attackEvent.canceled = true;
        }
      }
    ]
  }),

  // 750 000 000 000
  plaguebloom_shaman: defineCard({
    name: "Plaguebloom Shaman",
    rng: 750000000000,
    tags: ["undead", "mage"],
    abilities: [
      {
        name: "Necrotic Bloom",
        trigger: { event: "entry", phase: "start", actor: "self" },
        run: (ctx) => {
          ctx.allies().forEach(a => {
            a.maxHp = Math.round(a.maxHp * 1.15);
            ctx.heal(a, Math.round(a.maxHp * 0.20));
          });
        }
      },
      {
        name: "Bloom Shield",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: (ctx) => ctx.self.turnCount % 2 === 0,
        run: (ctx) => {
          ctx.addBarrier(ctx.self, "bloom_shield", 1, "all");
          ctx.allies().forEach(a => ctx.heal(a, Math.round(a.maxHp * 0.08)));
        }
      }
    ]
  }),

  // 2 300 000 000 000
  soulbinder_of_decay: defineCard({
    name: "Soulbinder of Decay",
    rng: 2300000000000,
    tags: ["undead", "boss"],
    abilities: [
      {
        name: "Hollow Conscription",
        trigger: { event: "death", phase: "after", actor: "opponent", killer: "self" },
        run: (ctx) => {
          ctx.heal(ctx.self, Math.round(ctx.self.maxHp * 0.10));
        }
      }
    ]
  }),

  // 3 000 000 000 000 (Secret)
  eternal_beast_holy_beast: defineCard({
    name: "Eternal Beast(Holy Beast)",
    rng: 3000000000000,
    tags: ["beast", "holy", "secret"],
    abilities: [
      {
        name: "Endless Hunger",
        trigger: { event: "turn", phase: "start", actor: "self" },
        condition: () => Math.random() < 0.40,
        run: (ctx) => {
          ctx.self.damage = Math.round(ctx.self.damage * 1.20);
          ctx.self.maxHp = Math.round(ctx.self.maxHp * 1.20);
          ctx.self.currentHp = Math.round(ctx.self.currentHp * 1.20);
        }
      }
    ]
  }),

  // 5 800 000 000 000
  ruined_vessel: defineCard({
    name: "Ruined Vessel",
    rng: 5800000000000,
    tags: ["undead", "void"],
    abilities: [
      {
        name: "Tainted Vitality",
        trigger: { event: "turn", phase: "start", actor: "self" },
        run: (ctx) => {
          const cut = Math.round(ctx.self.maxHp * 0.08);
          ctx.self.currentHp = Math.max(1, ctx.self.currentHp - cut);
          ctx.self.damage += cut;
        }
      }
    ]
  }),

  // 10 300 000 000 000
  blight_knight: defineCard({
    name: "Blight Knight",
    rng: 10300000000000,
    tags: ["undead", "knight"],
    abilities: [
      {
        name: "Festering Edge",
        trigger: { event: "attack", phase: "after", actor: "self" },
        run: (ctx) => {
          if (ctx.defender) {
            ctx.defender.maxHp = Math.max(1, ctx.defender.maxHp - Math.round(ctx.self.damage * 0.50));
            ctx.defender.currentHp = Math.min(ctx.defender.currentHp, ctx.defender.maxHp);
          }
          ctx.self.damage = Math.round(ctx.self.damage * 1.25);
        }
      }
    ]
  }),

  // 16 500 000 000 000
  vermathys_the_eternal_blight: defineCard({
    name: "Vermathys, the Eternal Blight",
    rng: 16500000000000,
    tags: ["undead", "boss", "god"],
    abilities: [
      {
        name: "Curse of Decay",
        trigger: { event: "damage", phase: "before", actor: "self" },
        condition: (ctx) => ctx.damageEvent !== undefined && ctx.damageEvent.amount >= ctx.self.currentHp && (ctx.self.abilityUses[0] || 0) === 0,
        maxUses: 1,
        run: (ctx) => {
          if (ctx.damageEvent) {
            ctx.damageEvent.amount = ctx.self.currentHp - 1;
            if (ctx.attacker) (ctx.attacker as any)._decayCursed = true;
          }
        }
      }
    ]
  })
};