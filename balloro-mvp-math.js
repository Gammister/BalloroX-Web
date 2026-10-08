/* Frozen approved MVP V1 / value-aware V2 probabilities over existing physical shots. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BalloroMvpMath = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const targetRtp = 0.9745;
  const kinds = ['blue', 'lemon', 'crown', 'diamond'];
  // Applied game rule. Zero means unlimited in calculator experiments only.
  // Counts include the first entry and are inherited, independently, by every
  // green child. Purple is a boolean lineage bonus, never a stacking exponent.
  const pocketVisitLimit = 2;
  function visitLimit(value) {
    if (!Number.isInteger(value) || value < 0 || value > 10) throw Error('Pocket entry limit must be an integer from 0 to 10');
    return value;
  }
  const canEnterPocket = (counts, kind, limit = pocketVisitLimit) =>
    kinds.includes(kind) && (!limit || kinds.reduce((n, k) => n + (counts?.[k] || 0), 0) < limit);
  function enterPocket(counts, kind, limit = pocketVisitLimit) {
    if (!canEnterPocket(counts, kind, limit)) throw Error(`Pocket entry limit reached: ${kind}`);
    return { ...counts, [kind]: (counts?.[kind] || 0) + 1 };
  }
  function releaseStage(stage, counts, limit = pocketVisitLimit) {
    if (!limit) return stage;
    const entries = stage.entries.filter(e => !e.pool[0].kind || canEnterPocket(counts, e.pool[0].kind, limit));
    const total = entries.reduce((s, e) => s + e.probability, 0);
    if (!(total > 0)) throw Error('No legal recorded release outcomes after pocket limit');
    return { ...stage, entries: entries.map(e => ({ ...e, probability: e.probability / total })) };
  }
  const parameters = Object.freeze({
    5: { pockets: [.05, .035, .014, .003], mainRed: .00025, roomCenter: .003,
      micro: { '.3': 1 }, releaseYellow: { blue: .08, lemon: .065, diamond: .35 } },
    7: { pockets: [.05, .027, .01, .003], mainRed: .00012, roomCenter: .0015,
      micro: { '.1': .7, '.3': .3 }, releaseYellow: { blue: .035, lemon: .025, diamond: .2 } },
    9: { pockets: [.12, .021, .006, .003], mainRed: .00006, roomCenter: .0008,
      micro: { '.1': .4, '.2': .35, '.5': .25 }, releaseMicro: { blue: { '.5': 1 } },
      releaseYellow: { blue: .003, lemon: .012, diamond: .12 } }
  });
  const releaseRed = { 5: .00004, 7: .00002, 9: .00001 };
  const chainProbability = .006;
  const chainMix = { blue: .5, lemon: .3, crown: .15, diamond: .05 };
  const yellowHitProbability = .35;
  // V2 spends a comparable, gently decreasing RTP budget on each fire prize.
  // Probabilities are global, never adjusted from a player's previous results.
  const fireBudget = .08, fireExponent = 1.15;
  const fireChance = value => fireBudget / value ** fireExponent;
  function freeze(object) {
    Object.values(object).forEach(value => { if (value && typeof value === 'object') freeze(value); });
    return Object.freeze(object);
  }
  freeze(parameters);
  // V1 is frozen; V2 changes outcome rates, not the bonus-chain mechanics.
  const enabled = () => true;
  function solve(matrix, vector) {
    const a = matrix.map((row, i) => [...row, vector[i]]), n = a.length;
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let row = col + 1; row < n; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
      [a[col], a[pivot]] = [a[pivot], a[col]];
      if (Math.abs(a[col][col]) < 1e-12) throw Error('Non-terminating bonus expectation');
      const scale = a[col][col];
      a[col] = a[col].map(value => value / scale);
      for (let row = 0; row < n; row++) if (row !== col) {
        const factor = a[row][col];
        a[row] = a[row].map((value, i) => value - factor * a[col][i]);
      }
    }
    return a.map(row => row[n]);
  }
  const outcomeKey = item => item.kind ? `pocket:${item.kind}` : `pay:${item.value}`;
  function group(items) {
    const groups = {};
    items.forEach(item => (groups[outcomeKey(item)] ||= []).push(item));
    return groups;
  }
  function stage(items, weights) {
    const groups = group(items);
    for (const [key, weight] of Object.entries(weights)) {
      if (!Number.isFinite(weight) || weight < 0) throw Error(`Invalid probability ${key}`);
      if (weight > 0 && !groups[key]?.length) throw Error(`No existing paths for required outcome ${key}`);
    }
    const eligible = Object.entries(weights).filter(([key, weight]) => weight > 0);
    const total = eligible.reduce((sum, [, weight]) => sum + weight, 0);
    if (!(total > 0)) throw Error('Empty mathematical shot stage');
    const entries = eligible.map(([key, weight]) => ({ key, probability: weight / total, pool: groups[key] }));
    return { entries, totalPaths: items.length };
  }
  function terminalDistribution(s, purple, yellow = false) {
    const result = new Map();
    for (const entry of s.entries) {
      const item = entry.pool[0];
      if (item.kind) continue;
      const value = item.value * (purple ? 10 : 1);
      if (yellow) {
        result.set(value, (result.get(value) || 0) + entry.probability * (1 - yellowHitProbability));
        result.set(value * 10, (result.get(value * 10) || 0) + entry.probability * yellowHitProbability);
      } else result.set(value, (result.get(value) || 0) + entry.probability);
    }
    return result;
  }
  function createModel(lines, catalog, rules, oldRules, options = {}) {
    const baseline = parameters[lines];
    // V2 retains physical pools, with value-aware fire and pocket rates.
    // Its 9-line 1.1x inner ring needs a lower share to fund the larger prizes.
    const v2 = rules.mathVersion === 'v2';
    const maxPocketVisits = visitLimit(options.maxPocketVisits ?? (v2 ? pocketVisitLimit : 0));
    const p = v2 ? freeze({ ...baseline,
      pockets: [.05, baseline.pockets[1], .018, .003],
      mainRed: fireChance(rules.centerMultipliers[lines]),
      ...(lines === 9 ? {micro:{'.1':.5,'.2':.35,'1.1':.15},releaseMicro:{blue:{'1.1':1}}}: {})
    }) : baseline;
    if (!p) throw Error(`Unsupported MVP lines ${lines}`);
    const describe = (item, id, roomId = null) => ({ ...item, id,
      kind: roomId ? null : rules.pocketKindAt(lines, item.col, item.row),
      value: roomId ? rules.roomCellMultiplier(lines, roomId, item.col, item.row)
        : rules.cellMultiplier(lines, item.col, item.row) });
    const flatten = (groups, prefix, roomId = null) => Object.entries(groups).flatMap(([tier, pool]) =>
      pool.map((item, i) => describe(item, `${prefix}/${tier}/${i}`, roomId)));
    const neutralItems = flatten(catalog.neutral, `${lines}/main`);
    const release = {}, rooms = {};
    for (const kind of ['blue', 'lemon', 'diamond']) {
      const oldCell = oldRules.pocketCells(lines)[kind], cell = rules.pocketCells(lines)[kind];
      const mid = (lines - 1) / 2;
      const turn = Math.atan2(cell.row - mid, cell.col - mid) - Math.atan2(oldCell.row - mid, oldCell.col - mid);
      const cos = Math.round(Math.cos(turn)), sin = Math.round(Math.sin(turn));
      const items = flatten(catalog.release[kind], `${lines}/release/${kind}`).map(item => {
        const dx = item.col - mid, dy = item.row - mid;
        return describe({ ...item, a: item.a + turn * 180 / Math.PI,
          col: Math.round(mid + dx * cos - dy * sin), row: Math.round(mid + dx * sin + dy * cos) }, item.id);
      }).filter(item => item.kind !== kind);
      // A source-pocket endpoint is disallowed: the existing exit latch cannot
      // re-arm at rest. Do not select a path that would become a zero-return miss.
      const weights = {};
      const y = p.releaseYellow[kind], red = v2 ? fireChance(rules.centerMultipliers[lines]) / 8 : releaseRed[lines];
      for (const [value, share] of Object.entries(p.releaseMicro?.[kind] || p.micro)) weights[`pay:${Number(value)}`] = (1 - y - red) * share;
      weights[`pay:${rules.rings[lines][1]}`] = y;
      weights[`pay:${rules.centerMultipliers[lines]}`] = red;
      Object.keys(weights).forEach(key => { weights[key] *= 1 - chainProbability; });
      const available = kinds.filter(next => next !== kind && items.some(item => item.kind === next));
      const sum = available.reduce((total, next) => total + chainMix[next], 0);
      for (const next of available) weights[`pocket:${next}`] = chainProbability * chainMix[next] / sum;
      release[kind] = stage(items, weights);
    }
    for (const id of ['bottom-left', 'bottom-right']) {
      const items = flatten(catalog.rooms[id], `${lines}/room/${id}`, id);
      const chance = v2 ? fireChance(rules.roomMultipliers[lines][id]) / (p.pockets[2] / 2) : p.roomCenter;
      rooms[id] = stage(items, { [`pay:${rules.roomMultipliers[lines][id]}`]: chance,
        [`pay:${rules.roomSideMultipliers[lines][id][0]}`]: 1 - chance });
    }
    const room = { entries: Object.values(rooms).flatMap(s => s.entries.map(entry => ({ ...entry, probability: entry.probability / 2 }))) };
    const states = [false, true].flatMap(purple => kinds.map(kind => ({ kind, purple: purple || kind === 'diamond' })));
    const index = (kind, purple) => kinds.indexOf(kind) + (purple ? 4 : 0);
    const terminal = states.map(({ kind, purple }) => terminalDistribution(kind === 'crown' ? room : release[kind], purple, kind === 'lemon'));
    const matrix = states.map(({ kind, purple }, i) => {
      const row = Array(8).fill(0); row[i] = 1;
      if (kind === 'crown') return row;
      for (const entry of release[kind].entries) {
        const next = entry.pool[0].kind;
        if (next) row[index(next, purple || next === 'diamond')] -= (kind === 'blue' ? 3 : 1) * entry.probability;
      }
      return row;
    });
    const reward = terminal.map((dist, i) => [...dist].reduce((sum, [value, probability]) => sum + value * probability, 0)
      * (states[i].kind === 'blue' ? 3 : 1));
    let mean = solve(matrix, reward);
    const rawSecond = terminal.map((dist, i) => {
      const n = states[i].kind === 'blue' ? 3 : 1;
      return n * [...dist].reduce((sum, [value, probability]) => sum + value * value * probability, 0)
        + (n - 1) / n * mean[i] * mean[i];
    });
    let second = solve(matrix, rawSecond);
    let maximum = null;
    const bonusModel = { lines, release, rooms, room, states, terminal, maxPocketVisits, inheritsYellow: v2 };
    if (v2 && !maxPocketVisits) {
      const stats = unlimitedBonusMoments(bonusModel);
      mean = states.map(s => stats(s.kind, s.purple).mean);
      second = states.map(s => stats(s.kind, s.purple).second);
    }
    if (maxPocketVisits) {
      const stats = boundedBonusAnalysis(bonusModel);
      mean = states.map(s => stats(s.kind, enterPocket({}, s.kind, maxPocketVisits), s.purple).mean);
      second = states.map(s => stats(s.kind, enterPocket({}, s.kind, maxPocketVisits), s.purple).second);
      const support = kinds.map(kind => stats(kind, enterPocket({}, kind, maxPocketVisits)));
      maximum = { single: Math.max(...support.map(s => s.single)), total: Math.max(...support.map(s => s.total)),
        terminalBalls: Math.max(...support.map(s => s.terminalBalls)) };
    }
    const pocketProbability = p.pockets.reduce((sum, value) => sum + value, 0);
    const bonusContribution = p.pockets.reduce((sum, probability, i) => sum + probability * mean[index(kinds[i], false)], 0);
    const greenMean = Object.entries(p.micro).reduce((sum, [value, share]) => sum + Number(value) * share, 0);
    const yellowProbability = ((targetRtp - bonusContribution) / (1 - pocketProbability)
      - p.mainRed * rules.centerMultipliers[lines] - (1 - p.mainRed) * greenMean)
      / (rules.rings[lines][1] - greenMean);
    if (!(yellowProbability > 0 && yellowProbability < 1 - p.mainRed)) throw Error('RTP target outside allowed outcomes');
    const weights = {};
    for (const [value, share] of Object.entries(p.micro)) weights[`pay:${Number(value)}`] =
      (1 - pocketProbability) * (1 - p.mainRed - yellowProbability) * share;
    weights[`pay:${rules.rings[lines][1]}`] = (1 - pocketProbability) * yellowProbability;
    weights[`pay:${rules.centerMultipliers[lines]}`] = (1 - pocketProbability) * p.mainRed;
    const items = [...neutralItems];
    for (const [i, kind] of kinds.entries()) {
      const cell = rules.pocketCells(lines)[kind];
      const poolKind = oldRules.pocketKindAt(lines, cell.col, cell.row);
      items.push(...catalog.pockets[poolKind].map((item, j) => describe(item, `${lines}/main/pocket-${kind}/${j}`)));
      weights[`pocket:${kind}`] = p.pockets[i];
    }
    const main = stage(items, weights);
    const mainTerminal = terminalDistribution(main, false);
    const theoreticalRtp = [...mainTerminal].reduce((sum, [value, probability]) => sum + value * probability, 0) + bonusContribution;
    const secondMoment = [...mainTerminal].reduce((sum, [value, probability]) => sum + value * value * probability, 0)
      + p.pockets.reduce((sum, probability, i) => sum + probability * second[index(kinds[i], false)], 0);
    return { lines, version: rules.mathVersion || 'v1', targetRtp, main, release, rooms, room, states, matrix, terminal, mean, second, maxPocketVisits, inheritsYellow: v2,
      theoreticalRtp, secondMoment, variance: secondMoment - theoreticalRtp * theoreticalRtp,
      yellowProbability, pocketProbability, bonusContribution, parameters: p, maximum };
  }
  // Acyclic dynamic program: every transition consumes one remaining pocket
  // entry. Renormalisation is the SAME operation used by runtime saved paths.
  // No artificial recursion cut-off, duplicate bonus reward or Monte Carlo.
  // A carried yellow mask is one uniformly selected set of `lines` cells.
  // Green children share it, so their conditional means are correlated.
  // Store E[payout | mask] as c + sum(a[cell] * selected[cell]) and integrate
  // the exact one-/two-cell inclusion probabilities, not independent boosts.
  function maskMoments(model, c, a) {
    const size = model.lines * model.lines - 4, q = model.lines / size;
    const q2 = model.lines * (model.lines - 1) / (size * (size - 1));
    const values = Object.values(a), sum = values.reduce((s, v) => s + v, 0);
    const squares = values.reduce((s, v) => s + v * v, 0);
    return { mean: c + q * sum, second: c * c + 2 * c * q * sum + q * squares + q2 * (sum * sum - squares) };
  }
  function addAffine(a, other, weight) {
    for (const [cell, value] of Object.entries(other)) a[cell] = (a[cell] || 0) + weight * value;
  }
  function terminalStats(model, kind, purple, yellow, e, event) {
    const p = e.pool[0], base = p.value * (purple ? 10 : 1);
    const randomMask = yellow && kind !== 'lemon' && kind !== 'crown';
    const hitChance = kind === 'lemon' ? yellowHitProbability : randomMask ? model.lines / (model.lines ** 2 - 4) : 0;
    const a = {};
    if (randomMask) for (const item of e.pool) {
      const cell = `${item.col},${item.row}`;
      a[cell] = (a[cell] || 0) + 9 * base / e.pool.length;
    }
    const hit = event && (event.value === p.value || event.fire && (
      event.fire === 'main' ? kind !== 'crown' && p.col === (model.lines - 1) / 2 && p.row === (model.lines - 1) / 2
        : kind === 'crown' && p.id.includes(`/room/${event.fire}/`) && p.col === event.col && p.row === event.row));
    return { mean: base * (1 + 9 * hitChance), second: base * base * (1 + 99 * hitChance),
      c: kind === 'lemon' ? base * (1 + 9 * hitChance) : base, a,
      single: base * (hitChance > 0 ? 10 : 1), total: base * (hitChance > 0 ? 10 : 1), terminalBalls: 1, miss: hit ? 0 : 1 };
  }
  function boundedBonusAnalysis(model, event = null) {
    const limit = visitLimit(model.maxPocketVisits), memo = new Map();
    if (!limit) throw Error('Bounded analysis requires a finite entry limit');
    const analyse = (kind, counts, inheritedPurple = false, inheritedYellow = false) => {
      const purple = Boolean(inheritedPurple || kind === 'diamond');
      const yellow = Boolean(model.inheritsYellow && inheritedYellow);
      const key = `${kind}/${purple}/${yellow}/${kinds.map(k => counts[k] || 0).join(',')}`;
      if (memo.has(key)) return memo.get(key);
      const stage = kind === 'crown' ? model.room : releaseStage(model.release[kind], counts, limit);
      let childMean = 0, childSecond = 0, childMiss = 0, single = 0, total = 0, terminalBalls = 0, c = 0;
      const a = {};
      for (const e of stage.entries) {
        const p = e.pool[0]; let next;
        if (p.kind) next = analyse(p.kind, enterPocket(counts, p.kind, limit), purple, yellow || kind === 'lemon');
        else next = terminalStats(model, kind, purple, yellow, e, event);
        childMean += e.probability * next.mean; childSecond += e.probability * next.second;
        childMiss += e.probability * next.miss; single = Math.max(single, next.single); total = Math.max(total, next.total);
        terminalBalls = Math.max(terminalBalls, next.terminalBalls);
        // Lemon chooses a fresh mask; its outgoing mask is independent of the
        // incoming one. A lemon child likewise replaces its inherited mask.
        const carriesIncoming = yellow && kind !== 'lemon' && p.kind !== 'lemon';
        c += e.probability * (carriesIncoming ? next.c : next.mean);
        if (carriesIncoming) addAffine(a, next.a, e.probability);
      }
      const n = kind === 'blue' ? 3 : 1;
      const conditionalSquare = yellow && kind !== 'lemon' ? maskMoments(model, c, a).second : childMean * childMean;
      const result = { mean: n * childMean, second: n * childSecond + n * (n - 1) * conditionalSquare,
        c: n * c, a: Object.fromEntries(Object.entries(a).map(([k, v]) => [k, n * v])),
        single, total: n * total, terminalBalls: n * terminalBalls, miss: event?.kind === kind ? 0 : childMiss ** n };
      memo.set(key, result); return result;
    };
    return analyse;
  }
  // Unlimited experiments: exact absorbing branching-process moments. The
  // 16 states distinguish purple and carried yellow. Conditional affine means
  // account for the shared mask before solving the second-moment equations.
  function unlimitedBonusMoments(model) {
    const states = [false, true].flatMap(yellow => [false, true].flatMap(purple => kinds.map(kind => ({ kind, purple: purple || kind === 'diamond', yellow }))));
    const index = (kind, purple, yellow) => kinds.indexOf(kind) + (purple ? 4 : 0) + (yellow ? 8 : 0);
    const matrices = [], rewards = [], terminalSeconds = [];
    for (const [i, s] of states.entries()) {
      const row = Array(16).fill(0); row[i] = 1;
      const n = s.kind === 'blue' ? 3 : 1, stage = s.kind === 'crown' ? model.room : model.release[s.kind];
      let reward = 0, second = 0;
      for (const e of stage.entries) {
        const p = e.pool[0];
        if (p.kind) row[index(p.kind, s.purple || p.kind === 'diamond', s.yellow || s.kind === 'lemon')] -= n * e.probability;
        else { const t = terminalStats(model, s.kind, s.purple, s.yellow, e); reward += n * e.probability * t.mean; second += n * e.probability * t.second; }
      }
      matrices.push(row); rewards.push(reward); terminalSeconds.push(second);
    }
    const means = solve(matrices, rewards), affineMatrix = [], constants = [], coefficients = [];
    const cells = Array.from({ length: model.lines ** 2 }, (_, j) => `${j % model.lines},${Math.floor(j / model.lines)}`);
    for (const [i, s] of states.entries()) {
      const row = Array(16).fill(0); row[i] = 1;
      const a = {}; let c = 0;
      if (!s.yellow || s.kind === 'lemon') c = means[i];
      else {
        const n = s.kind === 'blue' ? 3 : 1, stage = s.kind === 'crown' ? model.room : model.release[s.kind];
        for (const e of stage.entries) {
          const p = e.pool[0], w = n * e.probability;
          if (p.kind) {
            const j = index(p.kind, s.purple || p.kind === 'diamond', true);
            if (p.kind === 'lemon') c += w * means[j]; else row[j] -= w;
          } else { const t = terminalStats(model, s.kind, s.purple, true, e); c += w * t.c; addAffine(a, t.a, w); }
        }
      }
      affineMatrix.push(row); constants.push(c); coefficients.push(a);
    }
    const cs = solve(affineMatrix, constants), as = states.map(() => ({}));
    for (const cell of cells) {
      const column = solve(affineMatrix, coefficients.map(a => a[cell] || 0));
      column.forEach((v, i) => { if (v) as[i][cell] = v; });
    }
    const rhs = terminalSeconds.map((v, i) => {
      const s = states[i], n = s.kind === 'blue' ? 3 : 1;
      const square = s.yellow ? maskMoments(model, cs[i] / n, Object.fromEntries(Object.entries(as[i]).map(([k, x]) => [k, x / n]))).second : (means[i] / n) ** 2;
      return v + n * (n - 1) * square;
    });
    const seconds = solve(matrices, rhs);
    return (kind, purple = false, yellow = false) => { const i = index(kind, purple || kind === 'diamond', yellow); return { mean: means[i], second: seconds[i] }; };
  }
  function boundedCoefficients(model, event) {
    const analyse = boundedBonusAnalysis(model, event);
    return model.main.entries.map(e => {
      const p = e.pool[0];
      if (p.kind) return 1 - analyse(p.kind, enterPocket({}, p.kind, model.maxPocketVisits)).miss;
      return Number(event.value === p.value || event.fire === 'main'
        && p.col === (model.lines - 1) / 2 && p.row === (model.lines - 1) / 2);
    });
  }
  function choose(s, unit) {
    let cursor = Math.max(0, Math.min(1 - Number.EPSILON, unit));
    for (const entry of s.entries) {
      if (cursor < entry.probability) return { entry, unit: cursor / entry.probability };
      cursor -= entry.probability;
    }
    return { entry: s.entries.at(-1), unit: 1 - Number.EPSILON };
  }
  // Probability of at least one hit at each fire cell per complete paid ball.
  // A green visit has three children: no-hit is cubed, never summed as independent bonuses.
  function fireProbabilities(model, rules) {
    const mid = (model.lines - 1) / 2;
    return ['main', 'bottom-left', 'bottom-right'].map(target => {
      const cell = target === 'main' ? { col: mid, row: mid } : rules.roomCenterCell(model.lines, target);
      if (model.maxPocketVisits) {
        const coefficients = boundedCoefficients(model, { fire: target, ...cell });
        return { target, multiplier: target === 'main' ? rules.centerMultipliers[model.lines]
          : rules.roomMultipliers[model.lines][target], coefficients,
          probability: coefficients.reduce((s, c, i) => s + c * model.main.entries[i].probability, 0) };
      }
      const hit = (entry, space) => space === target && entry.pool[0].col === cell.col
        && entry.pool[0].row === cell.row && !entry.pool[0].kind;
      let noHit = Array(8).fill(1), residual = Infinity;
      for (let step = 0; step < 200 && residual > 1e-14; step++) {
        const next = model.states.map(({ kind, purple }) => {
          if (kind === 'crown') return ['bottom-left','bottom-right'].reduce((sum, id) =>
            sum + .5 * model.rooms[id].entries.reduce((s, entry) => s + (hit(entry, id) ? 0 : entry.probability), 0), 0);
          const child = model.release[kind].entries.reduce((sum, entry) => {
            const follow = entry.pool[0].kind;
            return sum + entry.probability * (follow
              ? noHit[kinds.indexOf(follow) + (purple || follow === 'diamond' ? 4 : 0)]
              : hit(entry, 'main') ? 0 : 1);
          }, 0);
          return kind === 'blue' ? child ** 3 : child;
        });
        residual = Math.max(...next.map((v, i) => Math.abs(v - noHit[i])));
        noHit = next;
      }
      if (residual > 1e-12) throw Error('Fire hit probability did not converge');
      const miss = model.main.entries.reduce((sum, entry) => {
        const kind = entry.pool[0].kind;
        return sum + entry.probability * (kind ? noHit[kinds.indexOf(kind)] : hit(entry, 'main') ? 0 : 1);
      }, 0);
      return { target, multiplier: target === 'main' ? rules.centerMultipliers[model.lines]
        : rules.roomMultipliers[model.lines][target], probability: Math.max(0, Math.min(1, 1 - miss)) };
    });
  }
  // Each coefficient is the probability of an event somewhere in the ENTIRE
  // chain conditional on the initial outcome. Repeated cells/visits count once.
  // These linear features allow percentage edits without summing bonus rewards.
  function probabilityFeatures(model) {
    const values = [...new Set([model.main, ...Object.values(model.rooms)]
      .flatMap(s => s.entries.filter(e => !e.pool[0].kind).map(e => e.pool[0].value)))].sort((a,b)=>a-b);
    const definitions = [...kinds.map(kind=>({key:`pocket:${kind}`,kind})),
      ...values.map(value=>({key:`pay:${value}`,value}))];
    return definitions.map(def => {
      if (model.maxPocketVisits) {
        const coefficients = boundedCoefficients(model, def);
        return { ...def, coefficients, probability: coefficients.reduce((s, c, i) => s + c * model.main.entries[i].probability, 0) };
      }
      let miss = Array(8).fill(1), residual = Infinity;
      for (let step=0; step<200 && residual>1e-14; step++) {
        const next = model.states.map(({kind,purple}) => {
          if (def.kind===kind) return 0;
          const s=kind==='crown'?model.room:model.release[kind];
          const child=s.entries.reduce((total,e)=>{
            const p=e.pool[0];
            return total+e.probability*(p.kind?miss[kinds.indexOf(p.kind)+(purple||p.kind==='diamond'?4:0)]
              : p.value===def.value?0:1);
          },0);
          return kind==='blue'?child**3:child;
        });
        residual=Math.max(...next.map((v,i)=>Math.abs(v-miss[i]))); miss=next;
      }
      if(residual>1e-12)throw Error('Event probability did not converge');
      const coefficients=model.main.entries.map(e=>e.pool[0].kind
        ?1-miss[kinds.indexOf(e.pool[0].kind)]:Number(e.pool[0].value===def.value));
      return {...def,coefficients,probability:coefficients.reduce((s,c,i)=>s+c*model.main.entries[i].probability,0)};
    });
  }
  function mainRewards(model) {
    return model.main.entries.map(e=>e.pool[0].kind?model.mean[kinds.indexOf(e.pool[0].kind)]:e.pool[0].value);
  }
  // Cyclic damped moment fitting, also expressed as ordinary scalar workbook
  // formulas. Positive normalized weights; inconsistent goals are reported.
  function fitPercentages(model, rtp, goals={}, cycles=350) {
    const features=probabilityFeatures(model), rewards=mainRewards(model);
    const scale=Math.max(...rewards), constraints=[{key:'RTP',coefficients:rewards.map(v=>v/scale),target:rtp/scale},
      ...features.filter(f=>Number.isFinite(goals[f.key])).map(f=>({...f,target:goals[f.key]}))];
    if(!Number.isFinite(rtp)||rtp<=0||constraints.some(c=>c.target<0||c.target>1))throw Error('Invalid percentage goals');
    const seed=model.main.entries.map((e,i)=>constraints.some(c=>c.key!=='RTP'&&
      (c.target===0&&c.coefficients[i]>1e-12||c.target===1&&c.coefficients[i]<1-1e-12))?0:e.probability);
    const seedSum=seed.reduce((s,w)=>s+w,0);
    let weights=seedSum>0?seed.map(w=>w/seedSum):model.main.entries.map(e=>e.probability);
    for(let cycle=0;cycle<cycles;cycle++)for(const c of constraints){
      const q=weights.reduce((s,w,i)=>s+w*c.coefficients[i],0);
      const variance=weights.reduce((s,w,i)=>s+w*(c.coefficients[i]-q)**2,0);
      const delta=variance>1e-16?Math.max(-4,Math.min(4,.75*(c.target-q)/variance)):0;
      const next=weights.map((w,i)=>w*Math.exp(delta*c.coefficients[i]));
      const sum=next.reduce((s,w)=>s+w,0); weights=next.map(w=>w/sum);
    }
    const actualRtp=weights.reduce((s,w,i)=>s+w*rewards[i],0);
    const actual=Object.fromEntries(features.map(f=>[f.key,weights.reduce((s,w,i)=>s+w*f.coefficients[i],0)]));
    const residual=Math.max(Math.abs(actualRtp-rtp),...Object.entries(goals).filter(([,v])=>Number.isFinite(v)).map(([k,v])=>Math.abs(actual[k]-v)));
    return {weights,actualRtp,actual,residual,converged:seedSum>0&&residual<1e-7};
  }
  return { enabled, targetRtp, kinds, parameters, chainProbability, yellowHitProbability,
    createModel, choose, terminalDistribution, fireProbabilities, solve, fireChance, fireBudget, fireExponent,
    probabilityFeatures,mainRewards,fitPercentages, pocketVisitLimit, visitLimit, canEnterPocket, enterPocket, releaseStage,
    boundedBonusAnalysis, boundedCoefficients };
});
