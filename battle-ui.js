(() => {
    'use strict';

    let CARDS_DB = null;
    let currentBattleState = null;

    const TIER_VALUES = {
        shiny: 100,
        fabled: 10000,
        corrupted: 100000,
        awakened: 1000000,
        void: 10000000
    };

    function deepMerge(target, patch) {
        for (const key of Object.keys(patch)) {
            if (patch[key] instanceof Object && key in target) {
                deepMerge(target[key], patch[key]);
            } else {
                target[key] = patch[key];
            }
        }
        return target;
    }

    function compileCardFabledAbilities(cardBp) {
        if (!cardBp.fabled_upgrade) return cardBp.abilities || [];
        const compiled = JSON.parse(JSON.stringify(cardBp.abilities || []));

        if (cardBp.fabled_upgrade.modify) {
            for (const [idxStr, patch] of Object.entries(cardBp.fabled_upgrade.modify)) {
                const idx = parseInt(idxStr, 10);
                if (compiled[idx]) deepMerge(compiled[idx], patch);
            }
        }

        if (Array.isArray(cardBp.fabled_upgrade.add)) {
            cardBp.fabled_upgrade.add.forEach(extra => {
                compiled.push(JSON.parse(JSON.stringify(extra)));
            });
        }

        return compiled;
    }

    async function init() {
        try {
            const files = ['./data/training.json', './data/offense.json', './data/defense.json', './data/support.json'];
            const responses = await Promise.all(files.map(url => fetch(url)));

            for (const res of responses) {
                if (!res.ok) throw new Error(`Impossible de charger ${res.url}`);
            }

            const dataList = await Promise.all(responses.map(r => r.json()));
            CARDS_DB = Object.assign({}, ...dataList);

            Object.values(CARDS_DB).forEach(bp => {
                bp.compiled_fabled_abilities = compileCardFabledAbilities(bp);
            });

            buildSelectors('team1Selectors', 't1');
            buildSelectors('team2Selectors', 't2');

            document.getElementById('btnStartBattle').addEventListener('click', onStartBattle);
            document.getElementById('btnNextTurn').addEventListener('click', onNextTurn);
            document.getElementById('btnResetBattle').addEventListener('click', onResetBattle);
            document.getElementById('btnRandomizeTeams').addEventListener('click', onRandomizeTeams);

            document.getElementById('loadingMessage').hidden = true;
            document.getElementById('app').hidden = false;
        } catch (err) {
            document.getElementById('loadingMessage').innerHTML = `<p><strong>Erreur :</strong> ${err.message}</p>`;
        }
    }

    function buildSelectors(containerId, prefix) {
        const box = document.getElementById(containerId);
        box.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const p = document.createElement('p');
            p.innerHTML = `
                <label>Emplacement #${i + 1} :
                    <select id="${prefix}_slot_${i}">
                        <option value="none">-- Vide --</option>
                        ${Object.keys(CARDS_DB).map(k => `<option value="${k}">${CARDS_DB[k].name} (Base RNG :${CARDS_DB[k].rng.toLocaleString('fr-FR')})</option>`).join('')}
                    </select>
                </label>
                &nbsp;|&nbsp;
                <strong>Tiers :</strong>
                ${Object.keys(TIER_VALUES).map(t => `
                    <label>
                        <input type="checkbox" class="${prefix}_tier_${i}" value="${t}">
                        ${t} (x${TIER_VALUES[t].toLocaleString('fr-FR')})
                    </label>
                `).join(' ')}
                &nbsp;|&nbsp;
                <label>Mult. libre :
                    <input type="number" id="${prefix}_custom_mult_${i}" value="1" min="1" style="width: 80px;">
                </label>
                &nbsp;<span id="${prefix}_effective_rng_${i}"></span>
            `;

            const updateRngPreview = () => {
                const cardKey = p.querySelector(`#${prefix}_slot_${i}`).value;
                const span = p.querySelector(`#${prefix}_effective_rng_${i}`);
                if (cardKey === 'none' || !CARDS_DB[cardKey]) {
                    span.textContent = '';
                    return;
                }

                let mult = parseFloat(p.querySelector(`#${prefix}_custom_mult_${i}`).value) || 1;
                p.querySelectorAll(`.${prefix}_tier_${i}:checked`).forEach(cb => {
                    mult *= TIER_VALUES[cb.value];
                });

                const effectiveRng = CARDS_DB[cardKey].rng * mult;
                span.innerHTML = `— <strong>RNG effectif :</strong> ${effectiveRng.toLocaleString('fr-FR')} (x${mult.toLocaleString('fr-FR')})`;
            };

            p.querySelector(`#${prefix}_slot_${i}`).addEventListener('change', updateRngPreview);
            p.querySelector(`#${prefix}_custom_mult_${i}`).addEventListener('input', updateRngPreview);
            p.querySelectorAll(`.${prefix}_tier_${i}`).forEach(cb => cb.addEventListener('change', updateRngPreview));

            box.appendChild(p);
        }
    }

    function onRandomizeTeams() {
        const mode = document.getElementById('randomTierMode').value;
        const sizeChoice = document.getElementById('randomTeamSize').value;
        const keys = Object.keys(CARDS_DB);
        if (keys.length === 0) return;

        const count = sizeChoice === 'auto'
            ? Math.floor(Math.random() * 4) + 1
            : parseInt(sizeChoice, 10);

        ['t1', 't2'].forEach(prefix => {
            for (let i = 0; i < 4; i++) {
                document.getElementById(`${prefix}_slot_${i}`).value = 'none';
                document.getElementById(`${prefix}_custom_mult_${i}`).value = '1';
                document.querySelectorAll(`.${prefix}_tier_${i}`).forEach(cb => { cb.checked = false; });
            }
        });

        if (mode === 'balanced') {
            const targetLog = 7 + Math.random() * 2;
            const targetEffectiveRng = Math.pow(10, targetLog);

            ['t1', 't2'].forEach(prefix => {
                for (let i = 0; i < count; i++) {
                    const pickedKey = keys[Math.floor(Math.random() * keys.length)];
                    setupBalancedCard(prefix, i, pickedKey, targetEffectiveRng);
                }
            });
        } else if (mode === 'bracket') {
            const sortedKeys = [...keys].sort((a, b) => CARDS_DB[a].rng - CARDS_DB[b].rng);
            const pivot = Math.floor(Math.random() * sortedKeys.length);
            const bracket = sortedKeys.slice(Math.max(0, pivot - 2), Math.min(sortedKeys.length, pivot + 3));

            ['t1', 't2'].forEach(prefix => {
                for (let i = 0; i < count; i++) {
                    const pickedKey = bracket[Math.floor(Math.random() * bracket.length)];
                    document.getElementById(`${prefix}_slot_${i}`).value = pickedKey;
                }
            });
        } else {
            ['t1', 't2'].forEach(prefix => {
                for (let i = 0; i < count; i++) {
                    const pickedKey = keys[Math.floor(Math.random() * keys.length)];
                    document.getElementById(`${prefix}_slot_${i}`).value = pickedKey;
                }
            });
        }

        ['t1', 't2'].forEach(prefix => {
            for (let i = 0; i < 4; i++) {
                document.getElementById(`${prefix}_slot_${i}`).dispatchEvent(new Event('change'));
            }
        });
    }

    function setupBalancedCard(prefix, slotIndex, cardKey, targetRng) {
        const slotEl = document.getElementById(`${prefix}_slot_${slotIndex}`);
        slotEl.value = cardKey;

        const baseRng = CARDS_DB[cardKey].rng;
        let neededMult = targetRng / baseRng;
        if (neededMult <= 1) return;

        const tierEntries = [
            { key: 'void', val: TIER_VALUES.void },
            { key: 'awakened', val: TIER_VALUES.awakened },
            { key: 'corrupted', val: TIER_VALUES.corrupted },
            { key: 'fabled', val: TIER_VALUES.fabled },
            { key: 'shiny', val: TIER_VALUES.shiny }
        ];

        let appliedMult = 1;
        tierEntries.forEach(t => {
            if ((neededMult / (appliedMult * t.val)) >= 0.3) {
                const cb = document.querySelector(`.${prefix}_tier_${slotIndex}[value="${t.key}"]`);
                if (cb) {
                    cb.checked = true;
                    appliedMult *= t.val;
                }
            }
        });

        const remainingMult = Math.max(1, Math.round(neededMult / appliedMult));
        if (remainingMult > 1 && remainingMult <= 20) {
            document.getElementById(`${prefix}_custom_mult_${slotIndex}`).value = remainingMult;
        }
    }

    function getSelectedBlueprints(prefix) {
        const bps = [];
        for (let i = 0; i < 4; i++) {
            const val = document.getElementById(`${prefix}_slot_${i}`).value;
            if (val !== 'none' && CARDS_DB[val]) {
                let mult = parseFloat(document.getElementById(`${prefix}_custom_mult_${i}`).value) || 1;
                const checkedBoxes = document.querySelectorAll(`.${prefix}_tier_${i}:checked`);
                const appliedTiers = [];

                checkedBoxes.forEach(cb => {
                    mult *= TIER_VALUES[cb.value];
                    appliedTiers.push(cb.value);
                });

                const bpCopy = JSON.parse(JSON.stringify(CARDS_DB[val]));
                bpCopy.rng = bpCopy.rng * mult;
                bpCopy.rngMultiplier = mult;
                bpCopy.appliedTiers = appliedTiers;
                bpCopy.compiled_fabled_abilities = CARDS_DB[val].compiled_fabled_abilities;
                bps.push(bpCopy);
            }
        }
        return bps;
    }

    function getHpColor(currentHp, maxHp) {
        if (maxHp <= 0) return '#ff3333';
        const pct = Math.max(0, Math.min(1, currentHp / maxHp));
        const hue = Math.round(pct * 120);
        return `hsl(${hue}, 100%, 42%)`;
    }

    function formatLogEntry(log) {
        let color = '#dcdcdc';

        if (log.includes('[Buff]') || log.includes('[Permutation]')) color = '#38bdf8';
        else if (log.includes('[Bouclier]') || log.includes('[Barrière]')) color = '#facc15';
        else if (log.includes('[Dégâts]')) color = '#fb923c';
        else if (log.includes('(burn)')) color = '#f43f5e';
        else if (log.includes('[Mort]')) color = '#ef4444; font-weight: bold;';
        else if (log.includes('[Résurrection]') || log.includes('[Soin]')) color = '#4ade80; font-weight: bold;';
        else if (log.includes('[Annulation]') || log.includes('[Interception]') || log.includes('[Statut]')) color = '#c084fc';
        else if (log.includes('Tour de')) color = '#ffffff; text-decoration: underline;';
        else if (log.includes('Début du combat') || log.includes('Fin du combat')) color = '#a3e635; font-weight: bold;';

        return `<li style="color: ${color}; margin-bottom: 2px;">${log}</li>`;
    }

    function renderBoard(state) {
        const board = document.getElementById('boardState');
        const formatTeam = (team, name) => `
            <h4>${name}</h4>
            <ul>
                ${team.map(c => {
                    const hpColor = getHpColor(c.currentHp, c.maxHp);
                    const shieldTotal = c.shields.reduce((a, b) => a + b.amount, 0);
                    const barrierCount = (c.barriers || []).filter(b => b.duration_turns > 0).length;
                    const isStunned = Boolean(c.statuses?.stun > 0);

                    return `
                        <li>
                            <strong>${c.name}</strong> [RNG :${c.rng.toLocaleString('fr-FR')}] — 
                            PV : <strong style="color: ${hpColor};">${c.currentHp}/${c.maxHp}</strong> | 
                            ATK : <strong>${c.damage}</strong>${shieldTotal > 0 ? ` | <span style="color: #facc15;">Bouclier : ${shieldTotal}</span>` : ''}
                            ${barrierCount > 0 ? ' | <span style="color: #67e8f9;">Barrière Active</span>' : ''}
                            ${isStunned ? ' | <span style="color: #c084fc;">(ÉTOURDI)</span>' : ''}
                            ${c.isDead ? ' <strong style="color: #ef4444;">(MORT)</strong>' : ''}
                        </li>
                    `;
                }).join('')}
            </ul>
        `;

        board.innerHTML = `
            <p><strong>Tour :</strong> ${state.turn} | <strong>Au tour de :</strong> ${state.activeSide}</p>
            ${formatTeam(state.teams.team1, 'Équipe 1')}
            ${formatTeam(state.teams.team2, 'Équipe 2')}
        `;

        const logsList = document.getElementById('battleLogs');
        logsList.innerHTML = state.logs.map(formatLogEntry).join('');

        const logsContainer = document.getElementById('battleLogsContainer');
        if (logsContainer) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }

    function onStartBattle() {
        const t1 = getSelectedBlueprints('t1');
        const t2 = getSelectedBlueprints('t2');

        if (t1.length === 0 || t2.length === 0) {
            alert('Chaque équipe doit posséder au moins 1 carte !');
            return;
        }

        currentBattleState = window.BattleEngine.initBattle(t1, t2);
        document.getElementById('btnNextTurn').disabled = false;
        renderBoard(currentBattleState);
    }

    function onNextTurn() {
        if (!currentBattleState || currentBattleState.isFinished) return;
        window.BattleEngine.stepTurn(currentBattleState);
        renderBoard(currentBattleState);
        if (currentBattleState.isFinished) {
            document.getElementById('btnNextTurn').disabled = true;
        }
    }

    function onResetBattle() {
        currentBattleState = null;
        document.getElementById('btnNextTurn').disabled = true;
        document.getElementById('boardState').innerHTML = '<p><em>En attente du lancement...</em></p>';
        document.getElementById('battleLogs').innerHTML = '';
    }

    window.addEventListener('DOMContentLoaded', init);
})();