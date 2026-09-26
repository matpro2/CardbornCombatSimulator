(() => {
    'use strict';

    function generateStatsFromRng(rng) {
        const val = Math.max(1, Number(rng) || 1);
        const damage = Math.round(2.64 * Math.pow(val, 0.347) + 3);
        const health = Math.round(damage * 2);
        return { health, damage };
    }

    function createCardInstance(blueprint, id, side, appliedTiers = []) {
        const stats = (blueprint.baseDamage && blueprint.baseHealth)
            ? { damage: blueprint.baseDamage, health: blueprint.baseHealth }
            : generateStatsFromRng(blueprint.rng || 100);

        const mult = blueprint.stat_mult || 1;
        stats.damage = Math.round(stats.damage * mult);
        stats.health = Math.round(stats.health * mult);

        const isFabled = (appliedTiers || []).includes('fabled');
        const abilityList = (isFabled && blueprint.compiled_fabled_abilities)
            ? blueprint.compiled_fabled_abilities
            : (blueprint.abilities || []);

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
            abilities: JSON.parse(JSON.stringify(abilityList)),
            abilityUses: {}
        };
    }

    // =========================================================================
    // RÉSOLVEURS ATOMIQUES (Target & Value)
    // =========================================================================
    const TargetResolver = {
        resolve(targetDesc, ctx) {
            if (!targetDesc) return [];
            const side = targetDesc.side;
            const select = targetDesc.select;

            let pool = [];
            if (side === 'self') {
                pool = [ctx.sourceCard];
            } else if (side === 'ally') {
                pool = ctx.state.teams[ctx.sourceCard.side].filter(c => !c.isDead);
            } else if (side === 'enemy') {
                const enemySide = ctx.sourceCard.side === 'team1' ? 'team2' : 'team1';
                pool = ctx.state.teams[enemySide].filter(c => !c.isDead);
            } else if (side === 'event') {
                if (select === 'defender') return ctx.defender ? [ctx.defender] : [];
                if (select === 'attacker') return ctx.attacker ? [ctx.attacker] : [];
                if (select === 'victim') return ctx.victim ? [ctx.victim] : [];
                if (select === 'attack') return ctx.attackEvent ? [ctx.attackEvent] : [];
                if (select === 'target') return ctx.targetCard ? [ctx.targetCard] : [];
            }

            if (targetDesc.exclude_self) {
                pool = pool.filter(c => c !== ctx.sourceCard);
            }

            if (targetDesc.match_tag) {
                pool = pool.filter(c => c.tags && c.tags.includes(targetDesc.match_tag));
            }

            if (select === 'this') return [ctx.sourceCard];
            if (select === 'active' || select === 'first') return pool.length > 0 ? [pool[0]] : [];
            if (select === 'all') return pool;

            if (select === 'lowest_health') {
                const sorted = [...pool].sort((a, b) => a.currentHp - b.currentHp);
                return sorted.length > 0 ? [sorted[0]] : [];
            }

            if (select === 'random_alive') {
                const alive = pool.filter(c => !c.isDead);
                return alive.length > 0 ? [alive[Math.floor(Math.random() * alive.length)]] : [];
            }

            if (select === 'random_dead') {
                const deadPool = ctx.state.teams[ctx.sourceCard.side].filter(c => c.isDead && (targetDesc.exclude_self ? c !== ctx.sourceCard : true));
                return deadPool.length > 0 ? [deadPool[Math.floor(Math.random() * deadPool.length)]] : [];
            }

            return pool;
        }
    };

    const ValueResolver = {
        resolve(desc, ctx, targetCard) {
            if (typeof desc === 'number') return desc;
            if (!desc) return 0;

            let baseVal = desc.base || 0;
            let refCard = ctx.sourceCard;

            if (desc.source === 'target') refCard = targetCard;
            else if (desc.source === 'self') refCard = ctx.sourceCard;
            else if (desc.source === 'event_damage' && ctx.damageEvent) {
                return Math.round((ctx.damageEvent.amount || 0) * (desc.mult !== undefined ? desc.mult : 1.0));
            }

            if (desc.stat && refCard) {
                const statVal = desc.stat === 'max_health' ? refCard.maxHp : (refCard[desc.stat] || 0);
                baseVal += statVal * (desc.mult !== undefined ? desc.mult : 1.0);
            }

            return Math.round(baseVal);
        }
    };

    // =========================================================================
    // COMPARATEUR DE DÉCLENCHEURS (Trigger Matcher)
    // =========================================================================
    // =========================================================================
// COMPARATEUR DE DÉCLENCHEURS (Trigger Matcher)
// =========================================================================
function matchesTrigger(card, trigger, eventCtx) {
    if (!trigger) return false;
    if (trigger.event !== eventCtx.event) return false;
    if (trigger.phase && trigger.phase !== eventCtx.phase) return false;

    // Validation de l'acteur
    if (trigger.actor === 'self' && eventCtx.sourceCard !== card) return false;

    if (trigger.actor === 'ally') {
        if (!eventCtx.sourceCard || eventCtx.sourceCard.side !== card.side || eventCtx.sourceCard === card) {
            return false;
        }
    }

    if (trigger.actor === 'opponent') {
        const isOpponentSource = eventCtx.sourceCard && eventCtx.sourceCard.side !== card.side;
        const isOpponentAttacker = eventCtx.attacker && eventCtx.attacker.side !== card.side;
        if (!isOpponentSource && !isOpponentAttacker) return false;
    }

    if (trigger.actor === 'self_shield') {
        if (eventCtx.brokenShield?.sourceCard !== card) return false;
    }

    // Validation du coup de grâce porté directement par la carte
    if (trigger.killer === 'self' && eventCtx.attacker !== card) return false;

    // Filtre contextuel de positionnement relatif
    if (trigger.relative_position === 'immediate_before') {
        const team = eventCtx.state.teams[card.side];
        const myIdx = team.indexOf(card);
        const victimIdx = team.indexOf(eventCtx.victim);
        if (victimIdx !== myIdx - 1) return false;
    }

    // Filtre de premier tour
    if (trigger.filter === 'first' && eventCtx.sourceCard?.hasPlayedTurn) return false;

    // Filtre d'identifiant de bouclier
    if (trigger.shield_id && eventCtx.brokenShield?.id !== trigger.shield_id) return false;

    return true;
}

// =========================================================================
// CONDITIONS GÉNÉRIQUES
// =========================================================================
const Conditions = {
    state: (ctx, cond) => {
        const targets = TargetResolver.resolve(cond.target, ctx);
        if (cond.is === 'alive') return targets.some(t => !t.isDead && t.currentHp > 0);
        if (cond.is === 'dead') return targets.some(t => t.isDead || t.currentHp <= 0);
        return true;
    },
    chance: (_, cond) => Math.random() < cond.value,
    threshold: (ctx, cond) => {
        const targets = TargetResolver.resolve(cond.target, ctx);
        return targets.some(t => {
            const ratio = t.maxHp > 0 ? (t.currentHp / t.maxHp) : 0;
            if (cond.op === 'below') return ratio < cond.value;
            if (cond.op === 'above') return ratio > cond.value;
            if (cond.op === 'at_least') return ratio >= cond.value;
            return true;
        });
    },
    shield_matches: (ctx, cond) => ctx.brokenShield && ctx.brokenShield.id === cond.shield_id,
    turn_interval: (ctx, cond) => {
        const count = ctx.sourceCard?.turnCount || ctx.state?.turn || 1;
        return count > 0 && count % cond.interval === 0;
    }
};

    // =========================================================================
    // ACTIONS GÉNÉRIQUES
    // =========================================================================
    const Actions = {
        damage: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(target => {
                const amount = ValueResolver.resolve(action.value, ctx, target);
                applyDamage(target, amount, ctx.sourceCard, ctx.state, action.damage_type || 'physical');
                if (action.follow_up) {
                    Actions[action.follow_up.type]?.({ ...ctx, targetCard: target }, action.follow_up);
                }
            });
        },

        modify: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);

            if (action.property === 'stat') {
                targets.forEach(target => {
                    let factor = 1.0;
                    if (action.scaling) {
                        const matchPool = TargetResolver.resolve(action.scaling.source, ctx);
                        const matchCount = matchPool.filter(c =>
                            c.tags.some(t => action.scaling.match_tags.includes(t))
                        ).length;
                        factor += matchCount * action.scaling.mult_per_match;
                    }

                    (action.stats || []).forEach(st => {
                        if (action.op === 'multiply') {
                            const mult = action.value !== undefined ? action.value : factor;
                            target[st] = Math.round(target[st] * mult);
                            if (st === 'health') {
                                target.maxHp = Math.round(target.maxHp * mult);
                                target.currentHp = Math.min(target.maxHp, Math.round(target.currentHp * mult));
                            }
                        } else if (action.op === 'add') {
                            const val = ValueResolver.resolve(action.value, ctx, target);
                            target[st] += val;
                            if (st === 'health') {
                                target.maxHp += val;
                                target.currentHp = Math.min(target.maxHp, target.currentHp + val);
                            }
                        }
                    });
                    ctx.state.log(`[Buff] ${target.name} subit modify (${action.stats.join(', ')})`);
                });
            } else if (action.property === 'turn_attacks') {
                if (ctx.attackContext && action.op === 'set') {
                    ctx.attackContext.strikeCount = action.value;
                    ctx.state.log(`[Attaque] ${ctx.sourceCard.name} portera ${action.value} coups ce tour`);
                }
            } else if (action.property === 'incoming_damage') {
                if (ctx.damageEvent && action.op === 'subtract') {
                    const reduction = ValueResolver.resolve(action.value, ctx, ctx.sourceCard);
                    ctx.damageEvent.amount = Math.max(0, ctx.damageEvent.amount - reduction);
                }
            } else if (action.property === 'outgoing_damage') {
                if (ctx.damageEvent && action.op === 'multiply') {
                    ctx.damageEvent.amount = Math.round(ctx.damageEvent.amount * action.value);
                }
            }
        },

        shield: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(target => {
                if (target.unshieldable) {
                    ctx.state.log(`[Immunité] ${target.name} ne peut pas recevoir de bouclier`);
                    return;
                }
                const val = ValueResolver.resolve(action.value, ctx, target);
                target.shields = target.shields || [];
                target.shields.push({
                    id: action.shield_id,
                    amount: val,
                    duration_turns: action.duration_turns,
                    sourceCard: ctx.sourceCard
                });
                ctx.state.log(`[Bouclier] ${target.name} reçoit ${val} de bouclier (${action.shield_id})`);
            });
        },

        barrier: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(target => {
                target.barriers = target.barriers || [];
                target.barriers.push({
                    id: action.barrier_id,
                    duration_turns: action.duration_turns || 1,
                    absorb: action.absorb || 'all'
                });
                ctx.state.log(`[Barrière] ${target.name} érige une barrière (${action.barrier_id}) pour ${action.duration_turns || 1} tour(s)`);
            });
        },

        apply_status: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(target => {
                target.statuses = target.statuses || {};
                target.statuses[action.status] = (target.statuses[action.status] || 0) + (action.duration_turns || 1);
                ctx.state.log(`[Statut] ${target.name} subit ${action.status} pour ${action.duration_turns || 1} tour(s)`);
                if (action.follow_up) {
                    Actions[action.follow_up.type]?.({ ...ctx, targetCard: target }, action.follow_up);
                }
            });
        },

        drain_stat: (ctx, action) => {
            const victims = TargetResolver.resolve(action.target, ctx);
            const statName = (action.stats && action.stats[0]) || 'damage';
            let totalDrained = 0;

            victims.forEach(v => {
                const amount = Math.round((v[statName] || 0) * action.ratio);
                v[statName] = Math.max(1, v[statName] - amount);
                totalDrained += amount;
                ctx.state.log(`[Taxe] ${v.name} cède ${amount} ${statName}`);
            });

            if (totalDrained > 0 && action.distribute) {
                const beneficiaries = TargetResolver.resolve(action.distribute.target, ctx);
                if (beneficiaries.length > 0) {
                    const share = Math.round(totalDrained / beneficiaries.length);
                    beneficiaries.forEach(b => {
                        b[statName] = (b[statName] || 0) + share;
                    });
                    ctx.state.log(`[Distribution] ${beneficiaries.length} carte(s) reçoivent +${share} ${statName}`);
                }
            }
        },

        heal: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(t => {
                if (!t.isDead) {
                    const amount = ValueResolver.resolve(action.value, ctx, t);
                    const prev = t.currentHp;
                    t.currentHp = Math.min(t.maxHp, t.currentHp + amount);
                    const gained = t.currentHp - prev;
                    if (gained > 0) {
                        ctx.state.log(`[Soin] ${t.name} récupère ${gained} PV (${t.currentHp}/${t.maxHp})`);
                    }
                }
            });
        },

        cancel: (ctx, action) => {
            if (ctx.attackEvent) {
                ctx.attackEvent.canceled = true;
                ctx.state.log(`[Annulation] ${ctx.sourceCard.name} annule l'attaque adverse !`);
            }
            if (action.follow_up) {
                Actions[action.follow_up.type]?.(ctx, action.follow_up);
            }
        },

        intercept: (ctx, action) => {
            if (ctx.damageEvent && action.property === 'damage') {
                const intercepted = Math.round(ctx.damageEvent.amount * action.ratio);
                ctx.damageEvent.amount -= intercepted;
                ctx.state.log(`[Interception] ${ctx.sourceCard.name} absorbe ${intercepted} dégâts pour son allié direct`);
                applyDamage(ctx.sourceCard, intercepted, ctx.attacker, ctx.state, 'shared');
            }
        },

        swap: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(t => {
                const [sA, sB] = action.stats;
                const tmp = t[sA];
                t[sA] = t[sB];
                t[sB] = tmp;
                if (action.stats.includes('health')) {
                    t.maxHp = t.health;
                    t.currentHp = t.health;
                }
                ctx.state.log(`[Permutation] ${t.name} échange ${sA} (${t[sA]}) et ${sB} (${t[sB]})`);
            });
        },

        revive: (ctx, action) => {
            const targets = TargetResolver.resolve(action.target, ctx);
            targets.forEach(t => {
                const hp = ValueResolver.resolve(action.value, ctx, t);
                t.isDead = false;
                t.currentHp = Math.max(1, hp);
                if (ctx.deathEvent) ctx.deathEvent.canceled = true;
                ctx.state.log(`[Résurrection] ${t.name} renaît avec ${t.currentHp} PV !`);
                if (action.follow_up) {
                    Actions[action.follow_up.type]?.({ ...ctx, targetCard: t }, action.follow_up);
                }
            });
        }
    };

    // =========================================================================
    // DISPATCHER
    // =========================================================================
    function emit(eventData) {
        const state = eventData.state;
        const allCards = [...state.teams.team1, ...state.teams.team2];

        allCards.forEach(card => {
            if (!card.abilities) return;

            card.abilities.forEach((ability, aIdx) => {
                if (!matchesTrigger(card, ability.trigger, eventData)) return;

                if (ability.max_uses) {
                    card.abilityUses[aIdx] = card.abilityUses[aIdx] || 0;
                    if (card.abilityUses[aIdx] >= ability.max_uses) return;
                }

                const ctx = { ...eventData, sourceCard: card };
                const condPass = !ability.conditions || ability.conditions.every(c => Conditions[c.type]?.(ctx, c));

                if (condPass) {
                    if (ability.max_uses) card.abilityUses[aIdx]++;
                    Actions[ability.action.type]?.(ctx, ability.action);
                }
            });
        });
    }

    // =========================================================================
    // DÉGÂTS & CYCLE DE COMBAT
    // =========================================================================
    function applyDamage(target, rawAmount, attacker, state, type = 'normal') {
        if (target.isDead) return;

        const damageEvent = { amount: rawAmount };
        emit({ event: 'damage', phase: 'before', state, sourceCard: target, attacker, damageEvent });

        let dmg = damageEvent.amount;

        if (target.barriers && target.barriers.length > 0) {
            const fullBarrier = target.barriers.find(b => b.absorb === 'all' && b.duration_turns > 0);
            if (fullBarrier) {
                state.log(`[Barrière] Dégâts (${dmg}) absorbés intégralement par ${fullBarrier.id} sur ${target.name} !`);
                return;
            }
        }

        if (target.shields && target.shields.length > 0) {
            for (let i = target.shields.length - 1; i >= 0; i--) {
                const s = target.shields[i];
                if (s.amount <= 0) {
                    target.shields.splice(i, 1);
                    continue;
                }

                if (dmg >= s.amount) {
                    dmg -= s.amount;
                    s.amount = 0;
                    const brokenShield = target.shields.splice(i, 1)[0];
                    emit({ event: 'shield_break', phase: 'start', state, brokenShield, targetCard: target, attacker });
                } else {
                    s.amount -= dmg;
                    dmg = 0;
                    break;
                }
            }
        }

        target.currentHp = Math.max(0, target.currentHp - dmg);
        state.log(`[Dégâts] ${target.name} encaisse ${dmg} dégâts (${type}). PV restants : ${target.currentHp}/${target.maxHp}`);

        if (type !== 'reflected') {
            emit({ event: 'damage', phase: 'after', state, sourceCard: target, victim: target, attacker, damageEvent: { amount: dmg } });
        }

        if (target.currentHp <= 0) {
            const deathEvent = { canceled: false };
            emit({ event: 'death', phase: 'start', state, sourceCard: target, deathEvent });

            if (!deathEvent.canceled) {
                target.isDead = true;
                state.log(`[Mort] ${target.name} est éliminé !`);
                emit({ event: 'death', phase: 'after', state, sourceCard: target, victim: target });
            }
        }
    }

    function initBattle(t1Blueprints, t2Blueprints) {
        const state = {
            turn: 0,
            activeSide: 'team1',
            isFinished: false,
            winner: null,
            logs: [],
            teams: {
                team1: t1Blueprints.map((bp, i) => createCardInstance(bp, `t1_${i}`, 'team1', bp.appliedTiers || [])),
                team2: t2Blueprints.map((bp, i) => createCardInstance(bp, `t2_${i}`, 'team2', bp.appliedTiers || []))
            },
            log(msg) { this.logs.push(`[T${this.turn}] ${msg}`); }
        };

        state.log('Début du combat ! Initialisation des passifs.');
        emit({ event: 'battle', phase: 'start', state });

        ['team1', 'team2'].forEach(side => {
            const first = state.teams[side].find(c => !c.isDead);
            if (first) {
                first.hasEntered = true;
                emit({ event: 'entry', phase: 'start', state, sourceCard: first });
            }
        });

        state.turn = 1;
        return state;
    }

    function stepTurn(state) {
        if (state.isFinished) return;

        const currentTeam = state.teams[state.activeSide];
        const enemySide = state.activeSide === 'team1' ? 'team2' : 'team1';
        const enemyTeam = state.teams[enemySide];

        const activeCard = currentTeam.find(c => !c.isDead);
        if (activeCard && !activeCard.hasEntered) {
            activeCard.hasEntered = true;
            emit({ event: 'entry', phase: 'start', state, sourceCard: activeCard });
        }

        const enemyActive = enemyTeam.find(c => !c.isDead);

        if (!activeCard || !enemyActive) {
            state.isFinished = true;
            state.winner = activeCard ? state.activeSide : enemySide;
            state.log(`Fin du combat ! Victoire de ${state.winner}`);
            return;
        }

        if (activeCard.statuses?.stun > 0) {
            activeCard.statuses.stun--;
            state.log(`[Étourdissement] ${activeCard.name} est étourdi et passe son tour !`);
            state.turn++;
            state.activeSide = enemySide;
            return;
        }

        activeCard.turnCount = (activeCard.turnCount || 0) + 1;
        state.log(`Tour de ${activeCard.name} (${state.activeSide})`);

        emit({ event: 'turn', phase: 'start', state, sourceCard: activeCard });
        activeCard.hasPlayedTurn = true;

        const attackContext = { strikeCount: 1 };
        emit({ event: 'turn', phase: 'attack', state, sourceCard: activeCard, defender: enemyActive, attackContext });

        for (let i = 0; i < attackContext.strikeCount; i++) {
            if (enemyActive.isDead || activeCard.isDead) break;

            const attackEvent = { canceled: false };
            emit({ event: 'attack', phase: 'before', state, sourceCard: enemyActive, attacker: activeCard, attackEvent });

            if (!attackEvent.canceled) {
                applyDamage(enemyActive, activeCard.damage, activeCard, state, 'attaque');
                emit({ event: 'attack', phase: 'after', state, sourceCard: activeCard, defender: enemyActive });
            }
        }

        if (activeCard.barriers) {
            activeCard.barriers.forEach(b => b.duration_turns--);
            activeCard.barriers = activeCard.barriers.filter(b => b.duration_turns > 0);
        }

        if (activeCard.shields) {
            activeCard.shields.forEach(s => {
                if (s.duration_turns !== undefined) s.duration_turns--;
            });
            activeCard.shields = activeCard.shields.filter(s => s.duration_turns === undefined || s.duration_turns > 0);
        }

        state.turn++;
        state.activeSide = enemySide;

        const t1Alive = state.teams.team1.some(c => !c.isDead);
        const t2Alive = state.teams.team2.some(c => !c.isDead);

        if (!t1Alive || !t2Alive) {
            state.isFinished = true;
            state.winner = t1Alive ? 'team1' : 'team2';
            state.log(`Combat terminé ! Équipe victorieuse : ${state.winner}`);
        }
    }

    window.BattleEngine = {
        initBattle,
        stepTurn
    };
})();