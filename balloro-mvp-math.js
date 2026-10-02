/* V2 MVP: fixed outcome probabilities over existing V4 shots, never player history. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BalloroMvpMath = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const targetRtp = 0.9745;
  const kinds = ['blue', 'lemon', 'crown', 'diamond'];
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
  function freeze(object) {
    Object.values(object).forEach(value => { if (value && typeof value === 'object') freeze(value); });
    return Object.freeze(object);
  }
  freeze(parameters);
  // The pre-MVP V1 build is archived. Old URLs also use the approved MVP math.
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
  function createModel(lines, catalog, rules, oldRules) {
    const p = parameters[lines];
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
      const y = p.releaseYellow[kind], red = releaseRed[lines];
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
      rooms[id] = stage(items, { [`pay:${rules.roomMultipliers[lines][id]}`]: p.roomCenter,
        [`pay:${rules.roomSideMultipliers[lines][id][0]}`]: 1 - p.roomCenter });
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
    const mean = solve(matrix, reward);
    const rawSecond = terminal.map((dist, i) => {
      const n = states[i].kind === 'blue' ? 3 : 1;
      return n * [...dist].reduce((sum, [value, probability]) => sum + value * value * probability, 0)
        + (n - 1) / n * mean[i] * mean[i];
    });
    const second = solve(matrix, rawSecond);
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
    return { lines, targetRtp, main, release, rooms, room, states, matrix, terminal, mean, second,
      theoreticalRtp, secondMoment, variance: secondMoment - theoreticalRtp * theoreticalRtp,
      yellowProbability, pocketProbability, bonusContribution, parameters: p };
  }
  function choose(s, unit) {
    let cursor = Math.max(0, Math.min(1 - Number.EPSILON, unit));
    for (const entry of s.entries) {
      if (cursor < entry.probability) return { entry, unit: cursor / entry.probability };
      cursor -= entry.probability;
    }
    return { entry: s.entries.at(-1), unit: 1 - Number.EPSILON };
  }
  return { enabled, targetRtp, kinds, parameters, chainProbability, yellowHitProbability,
    createModel, choose, terminalDistribution, solve };
});
