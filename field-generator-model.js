(function initBalloroFieldGeneratorModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BalloroFieldGeneratorModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFieldGeneratorModel() {
  "use strict";

  const VERSION = 2;
  const LINE_COUNTS = Object.freeze([5, 6, 7, 8, 9, 10]);
  const CELL_STATES = Object.freeze(["empty", "low", "middle", "high", "ex_multi"]);
  const NORMALIZED_FIELD_SPAN = 2;
  const WEIGHT_SCORE_SCALE = 10;

  function normalizeCellState(value) {
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= 0 && numeric < CELL_STATES.length ? numeric : 0;
  }

  function emptyLayouts() {
    return Object.fromEntries(LINE_COUNTS.map((lines) => [lines, Array(lines * lines).fill(0)]));
  }

  function normalizeLayouts(layouts) {
    const normalized = emptyLayouts();
    LINE_COUNTS.forEach((lines) => {
      const source = Array.isArray(layouts?.[lines]) ? layouts[lines] : [];
      normalized[lines] = Array.from({ length: lines * lines }, (_, index) => normalizeCellState(source[index]));
    });
    return normalized;
  }

  function cloneLayouts(layouts) {
    const normalized = normalizeLayouts(layouts);
    return Object.fromEntries(LINE_COUNTS.map((lines) => [lines, [...normalized[lines]]]));
  }

  function cycleCellState(value) {
    return (normalizeCellState(value) + 1) % CELL_STATES.length;
  }

  function countStates(cells) {
    const counts = { empty: 0, low: 0, middle: 0, high: 0, ex_multi: 0 };
    (Array.isArray(cells) ? cells : []).forEach((value) => {
      counts[CELL_STATES[normalizeCellState(value)]] += 1;
    });
    return counts;
  }

  function calculateWeightBudget({
    cells,
    referenceCells,
    lines,
    multipliers,
    puckRadius,
    multiPlusProbability = 0,
    targetRtp = 0.9745
  } = {}) {
    const size = Number(lines);
    if (!LINE_COUNTS.includes(size)) throw new Error("Unsupported line count");

    const normalizedCells = Array.from({ length: size * size }, (_, index) =>
      normalizeCellState(Array.isArray(cells) ? cells[index] : 0));
    const normalizedReference = Array.from({ length: size * size }, (_, index) =>
      normalizeCellState(Array.isArray(referenceCells) ? referenceCells[index] : 0));
    const cellSize = NORMALIZED_FIELD_SPAN / size;
    const radius = Number.isFinite(Number(puckRadius)) && Number(puckRadius) > 0
      ? Number(puckRadius) : cellSize / 4;
    const puckDiameter = radius * 2;

    // A physical target grows with both its cell span and the ball's swept diameter.
    const effectiveCaptureArea = cellSize * (cellSize + puckDiameter);
    const geometryPoints = effectiveCaptureArea * WEIGHT_SCORE_SCALE;
    const lowMultiplier = Math.max(0, Number(multipliers?.low ?? multipliers?.outer) || 0);
    const middleMultiplier = Math.max(0, Number(multipliers?.middle) || 0);
    const highMultiplier = Math.max(0, Number(multipliers?.high ?? multipliers?.center) || 0);
    const exProbability = Math.max(0, Math.min(1, Number(multiPlusProbability) || 0));
    const weightsByState = Object.freeze([
      0,
      lowMultiplier * geometryPoints,
      middleMultiplier * geometryPoints,
      highMultiplier * geometryPoints,
      middleMultiplier * geometryPoints * exProbability
    ]);
    const scoreCells = (source) => source.reduce((sum, state) => sum + weightsByState[state], 0);
    const usedPoints = scoreCells(normalizedCells);
    const limitPoints = scoreCells(normalizedReference);
    const ratio = limitPoints > 0 ? usedPoints / limitPoints : 0;
    const percent = ratio * 100;
    const level = percent > 100 ? "red" : percent >= 85 ? "yellow" : "green";

    return {
      lines: size,
      counts: countStates(normalizedCells),
      weightsByState,
      weights: {
        empty: weightsByState[0],
        low: weightsByState[1],
        middle: weightsByState[2],
        high: weightsByState[3],
        ex_multi: weightsByState[4]
      },
      usedPoints,
      limitPoints,
      remainingPoints: limitPoints - usedPoints,
      ratio,
      percent,
      level,
      estimatedRtp: Math.max(0, Number(targetRtp) || 0) * ratio,
      targetRtp: Math.max(0, Number(targetRtp) || 0),
      cellSize,
      puckRadius: radius,
      puckDiameter,
      effectiveCaptureArea,
      multiPlusProbability: exProbability
    };
  }

  function findMergedBlocks(cells, lines) {
    const size = Number(lines);
    if (!Number.isInteger(size) || size < 2) return [];
    const source = Array.isArray(cells) ? cells : [];
    const normalized = Array.from({ length: size * size }, (_, index) => normalizeCellState(source[index]));
    const occupied = new Set();
    const blocks = [];

    for (let row = 0; row < size - 1; row += 1) {
      for (let column = 0; column < size - 1; column += 1) {
        const topLeft = row * size + column;
        const indexes = [topLeft, topLeft + 1, topLeft + size, topLeft + size + 1];
        const state = normalized[topLeft];
        if (state === 0 || indexes.some((index) => occupied.has(index))) continue;
        if (!indexes.every((index) => normalized[index] === state)) continue;
        indexes.forEach((index) => occupied.add(index));
        blocks.push({ row, column, state, indexes });
      }
    }

    return blocks;
  }

  function createSnapshot(id, layouts, selectedLine, createdAt = new Date().toISOString()) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) throw new Error("Configuration id must be positive");
    const line = LINE_COUNTS.includes(Number(selectedLine)) ? Number(selectedLine) : LINE_COUNTS[0];
    return { id: numericId, createdAt, selectedLine: line, layouts: cloneLayouts(layouts) };
  }

  function normalizeSnapshot(snapshot) {
    const id = Number(snapshot?.id);
    if (!Number.isInteger(id) || id < 1) return null;
    const selectedLine = LINE_COUNTS.includes(Number(snapshot?.selectedLine))
      ? Number(snapshot.selectedLine) : LINE_COUNTS[0];
    return {
      id,
      createdAt: typeof snapshot.createdAt === "string" ? snapshot.createdAt : "",
      selectedLine,
      layouts: normalizeLayouts(snapshot.layouts)
    };
  }

  function normalizeStore(store) {
    const configurations = Array.isArray(store?.configurations)
      ? store.configurations.map(normalizeSnapshot).filter(Boolean).sort((a, b) => a.id - b.id)
      : [];
    const highestId = configurations.reduce((max, item) => Math.max(max, item.id), 0);
    const requestedNextId = Number(store?.nextId);
    return {
      version: VERSION,
      nextId: Number.isInteger(requestedNextId) && requestedNextId > highestId
        ? requestedNextId : highestId + 1,
      selectedLine: LINE_COUNTS.includes(Number(store?.selectedLine))
        ? Number(store.selectedLine) : LINE_COUNTS[0],
      layouts: normalizeLayouts(store?.layouts),
      configurations
    };
  }

  return {
    VERSION,
    LINE_COUNTS,
    CELL_STATES,
    emptyLayouts,
    normalizeLayouts,
    cloneLayouts,
    cycleCellState,
    countStates,
    calculateWeightBudget,
    findMergedBlocks,
    createSnapshot,
    normalizeSnapshot,
    normalizeStore
  };
});
