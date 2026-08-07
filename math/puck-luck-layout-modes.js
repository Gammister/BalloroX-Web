(function initPuckLuckMath(root, factory) {
  const fieldConfiguration1 = typeof module === "object" && module.exports
    ? require("./field-configuration-1.js")
    : root?.BalloroFieldConfiguration1;
  const fieldConfiguration2 = typeof module === "object" && module.exports
    ? require("./field-configuration-2.js")
    : root?.BalloroFieldConfiguration2;
  const fieldConfiguration3 = typeof module === "object" && module.exports
    ? require("./field-configuration-3.js")
    : root?.BalloroFieldConfiguration3;
  const fieldConfiguration4 = typeof module === "object" && module.exports
    ? require("./field-configuration-4.js")
    : root?.BalloroFieldConfiguration4;
  const fieldConfiguration5 = typeof module === "object" && module.exports
    ? require("./field-configuration-5.js")
    : root?.BalloroFieldConfiguration5;
  const api = factory(
    fieldConfiguration1, fieldConfiguration2, fieldConfiguration3, fieldConfiguration4, fieldConfiguration5
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PuckLuckMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMathApi(
  fieldConfiguration1,
  fieldConfiguration2,
  fieldConfiguration3,
  fieldConfiguration4,
  fieldConfiguration5
) {
  "use strict";

  if (!fieldConfiguration1) throw new Error("Balloro field configuration #1 is unavailable");
  if (!fieldConfiguration2) throw new Error("Balloro field configuration #2 is unavailable");
  if (!fieldConfiguration3) throw new Error("Balloro field configuration #3 is unavailable");
  if (!fieldConfiguration4) throw new Error("Balloro field configuration #4 is unavailable");
  if (!fieldConfiguration5) throw new Error("Balloro field configuration #5 is unavailable");

  const TARGET_RTP = 0.9745;
  const BONUS_PRESENTATION_TARGET_RATE = 0.03;
  const EMPTY_BONUS_PRESENTATION_MULTIPLIER = 0;
  const BONUS_FREQUENCY_MULTIPLIER = 2.5;
  const BONUS_WIN_PROBABILITY_LIFT = 0.07;
  const DUAL_BONUS_WIN_PROBABILITY_LIFT = 0.09;
  const SESSION_EVENT_MIN_PROBABILITY = 0.025;
  const ONE_OF_TWO_STAR_PROBABILITY = 0.85;
  const TWO_OF_THREE_STAR_PROBABILITY = 0.85;
  const CONFIGURATOR_1_LAYOUT_MODE = "configurator_1";
  const CONFIGURATOR_2_LAYOUT_MODE = "configurator_2";
  const CONFIGURATOR_3_LAYOUT_MODE = "configurator_3";
  const CONFIGURATOR_4_LAYOUT_MODE = "configurator_4";
  const CONFIGURATOR_5_LAYOUT_MODE = "configurator_5";
  const CONFIGURATOR_LAYOUT_MODE = CONFIGURATOR_5_LAYOUT_MODE;
  const CONFIGURATOR_LAYOUT_MODES = Object.freeze([
    CONFIGURATOR_1_LAYOUT_MODE,
    CONFIGURATOR_2_LAYOUT_MODE,
    CONFIGURATOR_3_LAYOUT_MODE,
    CONFIGURATOR_4_LAYOUT_MODE,
    CONFIGURATOR_5_LAYOUT_MODE
  ]);
  const FIELD_CONFIGURATIONS = Object.freeze({
    [CONFIGURATOR_1_LAYOUT_MODE]: fieldConfiguration1,
    [CONFIGURATOR_2_LAYOUT_MODE]: fieldConfiguration2,
    [CONFIGURATOR_3_LAYOUT_MODE]: fieldConfiguration3,
    [CONFIGURATOR_4_LAYOUT_MODE]: fieldConfiguration4,
    [CONFIGURATOR_5_LAYOUT_MODE]: fieldConfiguration5
  });
  const LAYOUT_MODES = [
    "current",
    "dynamic_diagonal_width",
    "plinko_zone_style",
    CONFIGURATOR_1_LAYOUT_MODE,
    CONFIGURATOR_2_LAYOUT_MODE,
    CONFIGURATOR_3_LAYOUT_MODE,
    CONFIGURATOR_4_LAYOUT_MODE,
    CONFIGURATOR_5_LAYOUT_MODE
  ];
  const LAYOUT_LABELS = {
    current: "Current",
    dynamic_diagonal_width: "Dynamic Diagonal Width",
    plinko_zone_style: "Plinko Zone Style",
    configurator_1: "Configurator #1",
    configurator_2: "Configurator #2",
    configurator_3: "Configurator #3",
    configurator_4: "Configurator #4",
    configurator_5: "Configurator #5"
  };
  const RISK_LEVELS = ["low", "normal", "high"];
  const LINE_COUNTS = [5, 6, 7, 8, 9, 10];
  const PUCK_COUNTS = [1, 2, 3];
  const FIXED_TIMESTEP = 1 / 120;
  const BASE_PUCK_RADIUS_5 = 0.1;
  const FIXED_LAUNCH_FORCE = 1250;
  const POCKET_HIT_PROBABILITIES = Object.freeze({
    5: 0.045, 6: 0.042, 7: 0.038, 8: 0.034, 9: 0.030, 10: 0.026
  });
  const BONUS_REPOCKET_PROBABILITIES = Object.freeze({ 1: 0.035, 2: 0.006 });
  const MAX_BONUS_REPOCKET_GENERATION = 2;
  const POCKET_RELEASE_COUNT = 3;
  const MULTI_PLUS_PROBABILITIES = Object.freeze({
    5: 0.060, 6: 0.052, 7: 0.044, 8: 0.036, 9: 0.030, 10: 0.025
  });
  const MULTI_PLUS_EXTRA_CELLS = Object.freeze({ 5: 4, 6: 8, 7: 12, 8: 12, 9: 8, 10: 12 });
  const SECRET_ROOM_MULTI_PLUS_EXTRA_CELLS = Object.freeze({ 5: 1, 6: 1, 7: 2, 8: 2, 9: 3, 10: 4 });
  const SECRET_ROOM_IDS = ["top", "right", "bottom", "left"];
  const CATEGORIES = ["empty", "outer", "middle", "center", "multi_plus"];
  const PROFILE_VERSION = "BalloroX V24 / Integration Audit";
  const BASE_LINE_PAYTABLES = {
    5: { empty: 0, outer: 0.55, middle: 1.25, center: 2.20 },
    6: { empty: 0, outer: 0.65, middle: 1.50, center: 3.00 },
    7: { empty: 0, outer: 0.80, middle: 1.90, center: 4.50 },
    8: { empty: 0, outer: 1.00, middle: 2.40, center: 7.00 },
    9: { empty: 0, outer: 1.25, middle: 3.10, center: 12.00 },
    10: { empty: 0, outer: 1.50, middle: 4.20, center: 20.00 }
  };
  const LAYOUT_PAYTABLE_SCALE = {
    current: 1.04,
    dynamic_diagonal_width: 1,
    plinko_zone_style: 0.98,
    configurator_1: 1,
    configurator_2: 1,
    configurator_3: 1,
    configurator_4: 1,
    configurator_5: 1
  };
  const LINE_PAYTABLE_SCALE = { 5: 1, 6: 1, 7: 1.25, 8: 1.25, 9: 1.5, 10: 1.5 };
  const DYNAMIC_X_PAYTABLES = Object.freeze({
    5: { empty: 0, outer: 0.55, middle: 1.30, center: 2 },
    6: { empty: 0, outer: 0.65, middle: 1.50, center: 3 },
    7: { empty: 0, outer: 0.60, middle: 1.50, center: 6 },
    8: { empty: 0, outer: 1.00, middle: 2.40, center: 9 },
    9: { empty: 0, outer: 1.30, middle: 3.20, center: 18 },
    10: { empty: 0, outer: 1.30, middle: 3.60, center: 30 }
  });
  const CONFIGURATOR_PAYTABLES = Object.freeze({
    5: { empty: 0, outer: 1.50, middle: 2.00, center: 2.50 },
    6: { empty: 0, outer: 1.80, middle: 2.40, center: 3.00 },
    7: { empty: 0, outer: 1.40, middle: 2.20, center: 6 },
    8: { empty: 0, outer: 1.10, middle: 2.70, center: 9 },
    9: { empty: 0, outer: 1.30, middle: 3.20, center: 18 },
    10: { empty: 0, outer: 1.30, middle: 3.60, center: 30 }
  });
  const PREMIUM_CELL_PROBABILITY_FLOOR = 1e-7;
  const PAYTABLES = Object.fromEntries(LAYOUT_MODES.map((layoutMode) => [layoutMode,
    Object.fromEntries(LINE_COUNTS.map((lines) => [lines,
      CONFIGURATOR_LAYOUT_MODES.includes(layoutMode)
        ? { ...CONFIGURATOR_PAYTABLES[lines] }
        : layoutMode === "dynamic_diagonal_width"
          ? { ...DYNAMIC_X_PAYTABLES[lines] }
        : Object.fromEntries(Object.entries(BASE_LINE_PAYTABLES[lines]).map(([key, value]) =>
          [key, key === "empty" ? 0
            : Math.round(value * LAYOUT_PAYTABLE_SCALE[layoutMode] * LINE_PAYTABLE_SCALE[lines] * 100) / 100]))
    ]))
  ]));
  const LINE_PROFILES = {
    5: { bonusShare: 0.05 }, 6: { bonusShare: 0.06 }, 7: { bonusShare: 0.07 },
    8: { bonusShare: 0.08 }, 9: { bonusShare: 0.10 }, 10: { bonusShare: 0.12 }
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function isConfiguratorLayoutMode(layoutMode) {
    return CONFIGURATOR_LAYOUT_MODES.includes(layoutMode);
  }
  function round2(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function createRng(seed) {
    let value = (seed >>> 0) || 0x6d2b79f5;
    return {
      next() {
        value = (value + 0x6d2b79f5) >>> 0;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
      },
      uint32() { return Math.floor(this.next() * 4294967296) >>> 0; },
      int(max) { return Math.floor(this.next() * max); }
    };
  }
  function riskForLines(lines) { return lines <= 6 ? "low" : lines <= 8 ? "normal" : "high"; }
  function configId(layoutMode, lines, pucks) { return `${layoutMode}-lines-${lines}-${pucks}`; }
  function puckRadius(lines, baseRadius = BASE_PUCK_RADIUS_5) { return baseRadius * 5 / lines; }
  function secretRoomMultiplier() { return 0; }
  function secretRoomHitProbability(lines) {
    return POCKET_HIT_PROBABILITIES[lines] || POCKET_HIT_PROBABILITIES[5];
  }
  function secretRoomWinProbability() { return 0; }
  function bonusRepocketProbability(generation) {
    return BONUS_REPOCKET_PROBABILITIES[generation] || 0;
  }
  function expectedTerminalCountFromBonusBall(generation = 1) {
    const repocketProbability = bonusRepocketProbability(generation);
    if (repocketProbability <= 0 || generation > MAX_BONUS_REPOCKET_GENERATION) return 1;
    return (1 - repocketProbability)
      + repocketProbability * POCKET_RELEASE_COUNT * expectedTerminalCountFromBonusBall(generation + 1);
  }
  function expectedTerminalCountPerInitialBall(lines) {
    const pocketProbability = secretRoomHitProbability(lines);
    return (1 - pocketProbability)
      + pocketProbability * POCKET_RELEASE_COUNT * expectedTerminalCountFromBonusBall(1);
  }
  function multiPlusProbability(lines) {
    return MULTI_PLUS_PROBABILITIES[lines] || MULTI_PLUS_PROBABILITIES[5];
  }
  function multiPlusExtraCellCount(lines) {
    return MULTI_PLUS_EXTRA_CELLS[lines] || MULTI_PLUS_EXTRA_CELLS[5];
  }
  function multiPlusHitLift(lines, extraCellCount, baseMultiplierCellCount) {
    if (extraCellCount <= 0) return 0;
    return clamp((extraCellCount / Math.max(1, baseMultiplierCellCount)) * 0.35, 0.12, 0.22);
  }
  function secretRoomMultiPlusExtraCellCount(lines) {
    return SECRET_ROOM_MULTI_PLUS_EXTRA_CELLS[lines] || SECRET_ROOM_MULTI_PLUS_EXTRA_CELLS[5];
  }

  function secretRoomPocket(lines, zoneId) {
    const radius = puckRadius(lines);
    const positions = {
      top: { x: -1, y: -1, contact_x: -1 + radius, contact_y: -1 + radius },
      right: { x: 1, y: -1, contact_x: 1 - radius, contact_y: -1 + radius },
      bottom: { x: 1, y: 1, contact_x: 1 - radius, contact_y: 1 - radius },
      left: { x: -1, y: 1, contact_x: -1 + radius, contact_y: 1 - radius }
    };
    const position = positions[zoneId] || positions.top;
    return {
      zone_id: zoneId,
      ...position,
      col: clamp(Math.floor(((position.contact_x + 1) / 2) * lines), 0, lines - 1),
      row: clamp(Math.floor(((position.contact_y + 1) / 2) * lines), 0, lines - 1)
    };
  }

  function centerIndicesFor(lines) {
    return lines % 2 === 0 ? [lines / 2 - 1, lines / 2] : [Math.floor(lines / 2)];
  }

  function roomCell(lines, uIndex, vIndex) {
    const size = 2 / lines;
    const u0 = uIndex * size;
    const u1 = u0 + size;
    const v0 = -1 + vIndex * size;
    const v1 = v0 + size;
    return {
      key: `${uIndex}_${vIndex}`,
      u_index: uIndex,
      v_index: vIndex,
      u0, u1, v0, v1,
      u: (u0 + u1) / 2,
      v: (v0 + v1) / 2
    };
  }

  function secretRoomBaseMultiplierCell(lines) {
    const size = 2 / lines;
    const uIndex = Math.max(0, Math.round(0.5 / size - 0.5));
    const vIndex = Math.max(0, Math.min(lines - 1, Math.round(1 / size - 0.5)));
    return roomCell(lines, uIndex, vIndex);
  }

  function secretRoomMultiplierCells(lines, multiPlusActive = false) {
    const base = secretRoomBaseMultiplierCell(lines);
    if (!multiPlusActive) return [base];
    const cells = [base];
    const used = new Set([base.key]);
    const candidates = [];
    const maxUIndex = Math.ceil(1 / (2 / lines));
    for (let uIndex = 0; uIndex < maxUIndex; uIndex += 1) {
      for (let vIndex = 0; vIndex < lines; vIndex += 1) {
        const cell = roomCell(lines, uIndex, vIndex);
        if (used.has(cell.key)) continue;
        if (cell.u + Math.abs(cell.v) > 0.94) continue;
        candidates.push({
          cell,
          distanceToBase: Math.hypot(cell.u - base.u, cell.v - base.v),
          centerBias: Math.hypot(cell.u - 0.5, cell.v)
        });
      }
    }
    candidates.sort((first, second) => first.distanceToBase - second.distanceToBase
      || first.centerBias - second.centerBias
      || first.cell.u_index - second.cell.u_index
      || first.cell.v_index - second.cell.v_index);
    candidates.slice(0, secretRoomMultiPlusExtraCellCount(lines)).forEach(({ cell }) => {
      used.add(cell.key);
      cells.push(cell);
    });
    return cells;
  }

  function axisOrbit(col, row, lines) {
    const points = [
      [col, row], [lines - 1 - col, row],
      [col, lines - 1 - row], [lines - 1 - col, lines - 1 - row]
    ];
    return [...new Map(points.map(([x, y]) => [`${x}_${y}`, { col: x, row: y }])).values()];
  }

  function rotationalOrbit(col, row, lines) {
    const points = [
      [col, row], [lines - 1 - row, col],
      [lines - 1 - col, lines - 1 - row], [row, lines - 1 - col]
    ];
    return [...new Map(points.map(([x, y]) => [`${x}_${y}`, { col: x, row: y }])).values()];
  }

  function dihedralOrbit(col, row, lines) {
    const points = [
      ...axisOrbit(col, row, lines),
      ...rotationalOrbit(col, row, lines),
      ...axisOrbit(row, col, lines),
      ...rotationalOrbit(row, col, lines)
    ];
    return [...new Map(points.map((cell) => [`${cell.col}_${cell.row}`, cell])).values()];
  }

  function dynamicMultiplierCells(lines) {
    const selected = new Set();
    const firstBandIndex = 2;
    const lastBandIndex = lines - 3;
    const inExpandingBand = (value) => value >= firstBandIndex && value <= lastBandIndex;
    for (let row = 0; row < lines; row += 1) for (let col = 0; col < lines; col += 1) {
      const insideRedBoundary = col > 0 && col < lines - 1 && row > 0 && row < lines - 1;
      if (insideRedBoundary && (inExpandingBand(col) || inExpandingBand(row))) {
        selected.add(`${col}_${row}`);
      }
    }
    return selected;
  }

  function buildSectorDefinitions(lines, layoutMode = "current") {
    if (!LAYOUT_MODES.includes(layoutMode)) throw new Error(`Unknown layout mode: ${layoutMode}`);
    const sectors = { empty: [], outer: [], middle: [], center: [] };
    if (isConfiguratorLayoutMode(layoutMode)) {
      const configuredCells = FIELD_CONFIGURATIONS[layoutMode].layouts[lines];
      if (!configuredCells || configuredCells.length !== lines * lines) {
        throw new Error(`Invalid ${LAYOUT_LABELS[layoutMode]} layout for ${lines} lines`);
      }
      const stateCategories = ["empty", "outer", "middle", "center", "empty"];
      configuredCells.forEach((state, index) => {
        const row = Math.floor(index / lines);
        const col = index % lines;
        sectors[stateCategories[state] || "empty"].push({ index, row, col });
      });
      return sectors;
    }
    const centerIndices = centerIndicesFor(lines);
    const distanceToCenterZone = (value) => Math.min(...centerIndices.map((center) => Math.abs(value - center)));
    const maxRing = Math.max(distanceToCenterZone(0), distanceToCenterZone(lines - 1));
    const dynamicCells = layoutMode === "dynamic_diagonal_width" ? dynamicMultiplierCells(lines) : null;
    const plinkoRadius = Math.ceil((lines - 4) / 2);
    for (let row = 0; row < lines; row += 1) {
      for (let col = 0; col < lines; col += 1) {
        const sector = { index: row * lines + col, row, col };
        const onDiagonal = centerIndices.includes(col) || centerIndices.includes(row);
        const dx = distanceToCenterZone(col);
        const dy = distanceToCenterZone(row);
        const centerDistance = dx + dy;
        const isMultiplier = layoutMode === "current" ? onDiagonal
          : layoutMode === "dynamic_diagonal_width" ? dynamicCells.has(`${col}_${row}`)
            : onDiagonal || centerDistance <= plinkoRadius;
        if (!isMultiplier) {
          sectors.empty.push(sector);
          continue;
        }
        const ring = Math.max(dx, dy);
        const expandedSevenLineCenter = layoutMode === "dynamic_diagonal_width"
          && lines === 7 && dx <= 1 && dy <= 1;
        let category;
        if (ring === 0 || expandedSevenLineCenter) category = "center";
        else if (layoutMode === "plinko_zone_style") {
          category = centerDistance <= Math.max(1, Math.floor(plinkoRadius * 0.55))
            ? "middle" : "outer";
        } else category = ring === maxRing ? "outer" : "middle";
        sectors[category].push(sector);
      }
    }
    if (!sectors.empty.length) sectors.empty.push({ index: -1, row: -1, col: -1 });
    return sectors;
  }

  function buildMultiPlusSectors(lines, layoutMode = "current", sectors = null) {
    if (isConfiguratorLayoutMode(layoutMode)) {
      return FIELD_CONFIGURATIONS[layoutMode].layouts[lines]
        .map((state, index) => ({ state, index, row: Math.floor(index / lines), col: index % lines }))
        .filter((sector) => sector.state === 4)
        .map(({ index, row, col }) => ({ index, row, col }));
    }
    if (layoutMode === "plinko_zone_style") return [];
    const definitions = sectors || buildSectorDefinitions(lines, layoutMode);
    const occupied = new Set();
    for (const category of ["outer", "middle", "center"]) {
      definitions[category].forEach((sector) => occupied.add(`${sector.col}_${sector.row}`));
    }
    const launchIndex = lines * lines - 1;
    const centers = centerIndicesFor(lines);
    const minCenter = Math.min(...centers);
    const maxCenter = Math.max(...centers);
    const distanceToCenterBox = (value) => (value < minCenter ? minCenter - value
      : value > maxCenter ? value - maxCenter : 0);
    const selected = new Map();
    const targetCount = multiPlusExtraCellCount(lines);
    if (layoutMode === "dynamic_diagonal_width") {
      const center = (lines - 1) / 2;
      const centerIndices = centerIndicesFor(lines);
      const candidates = [];
      const seenOrbits = new Set();
      for (let row = 0; row < lines; row += 1) {
        for (let col = 0; col < lines; col += 1) {
          const index = row * lines + col;
          const key = `${col}_${row}`;
          if (index === launchIndex || occupied.has(key)) continue;
          const orbit = dihedralOrbit(col, row, lines).map((cell) => ({
            ...cell,
            index: cell.row * lines + cell.col
          }));
          const orbitKey = orbit.map((cell) => `${cell.col}_${cell.row}`).sort().join("|");
          if (seenOrbits.has(orbitKey)) continue;
          seenOrbits.add(orbitKey);
          if (!orbit.every((cell) => cell.index !== launchIndex
            && !occupied.has(`${cell.col}_${cell.row}`))) continue;
          candidates.push({
            orbit,
            orbitKey,
            diagonalDistance: Math.min(...centerIndices.map((centerIndex) =>
              Math.min(Math.abs(col - centerIndex), Math.abs(row - centerIndex)))),
            centerDistance: Math.hypot(col - center, row - center)
          });
        }
      }
      candidates.sort((first, second) => first.diagonalDistance - second.diagonalDistance
        || first.centerDistance - second.centerDistance
        || first.orbitKey.localeCompare(second.orbitKey));
      let states = new Map([[0, []]]);
      candidates.forEach((candidate) => {
        const next = new Map(states);
        states.forEach((combination, count) => {
          const nextCount = count + candidate.orbit.length;
          if (nextCount <= targetCount && !next.has(nextCount)) {
            next.set(nextCount, [...combination, candidate]);
          }
        });
        states = next;
      });
      const combination = states.get(targetCount);
      if (!combination) {
        throw new Error(`Cannot build ${targetCount} symmetric EX MULTI cells for ${lines} lines`);
      }
      combination.forEach((candidate) => candidate.orbit.forEach((cell) =>
        selected.set(`${cell.col}_${cell.row}`, cell)));
      return [...selected.values()].sort((first, second) => first.index - second.index);
    }
    for (let ring = 1; ring < lines; ring += 1) {
      const ringCells = [];
      const ringOrbits = [];
      const seenOrbits = new Set();
      for (let row = 0; row < lines; row += 1) {
        for (let col = 0; col < lines; col += 1) {
          const index = row * lines + col;
          const key = `${col}_${row}`;
          if (index === launchIndex || occupied.has(key)) continue;
          const ringDistance = Math.max(distanceToCenterBox(col), distanceToCenterBox(row));
          if (ringDistance !== ring) continue;
          ringCells.push({ index, row, col });
          const orbit = axisOrbit(col, row, lines).map((cell) => ({
            ...cell,
            index: cell.row * lines + cell.col
          }));
          const orbitKey = orbit.map((cell) => `${cell.col}_${cell.row}`).sort().join("|");
          if (seenOrbits.has(orbitKey)) continue;
          seenOrbits.add(orbitKey);
          const orbitIsAvailable = orbit.every((cell) => {
            const cellKey = `${cell.col}_${cell.row}`;
            const cellRingDistance = Math.max(distanceToCenterBox(cell.col), distanceToCenterBox(cell.row));
            return cell.index !== launchIndex && !occupied.has(cellKey) && cellRingDistance === ring;
          });
          if (!orbitIsAvailable) continue;
          const closestDistance = Math.min(...orbit.map((cell) =>
            Math.hypot(cell.col - (lines - 1) / 2, cell.row - (lines - 1) / 2)));
          ringOrbits.push({ orbit, closestDistance, orbitKey });
        }
      }
      if (!ringCells.length) continue;
      if (!selected.size) {
        ringCells.forEach((cell) => selected.set(`${cell.col}_${cell.row}`, cell));
        if (selected.size >= targetCount) {
          return [...selected.values()].sort((first, second) => first.index - second.index);
        }
        continue;
      }
      if (!ringOrbits.length) continue;
      ringOrbits.sort((first, second) => first.closestDistance - second.closestDistance
        || first.orbitKey.localeCompare(second.orbitKey));
      for (const { orbit } of ringOrbits) {
        orbit.forEach((cell) => selected.set(`${cell.col}_${cell.row}`, cell));
        if (selected.size >= targetCount) break;
      }
      if (selected.size >= targetCount) {
        return [...selected.values()].sort((first, second) => first.index - second.index);
      }
    }
    return [...selected.values()].sort((first, second) => first.index - second.index);
  }

  function solveConfiguration(layoutMode, _risk, lines, pucks) {
    const risk = riskForLines(lines);
    const profile = LINE_PROFILES[lines];
    const sectors = buildSectorDefinitions(lines, layoutMode);
    const multiplierCellCount = sectors.outer.length + sectors.middle.length + sectors.center.length;
    const categoryShares = {
      outer: sectors.outer.length / multiplierCellCount,
      middle: sectors.middle.length / multiplierCellCount,
      center: sectors.center.length / multiplierCellCount
    };
    const lineFactor = Math.pow(5 / lines, 0.08);
    const puckFactor = 1 + (pucks - 2) * 0.035;
    const desiredBonusShare = clamp(profile.bonusShare * lineFactor * puckFactor, 0.025, 0.18);
    const baseBonusProbability = desiredBonusShare / (9 * (1 - desiredBonusShare));
    const bonusProbability = Math.max(
      SESSION_EVENT_MIN_PROBABILITY,
      baseBonusProbability * BONUS_FREQUENCY_MULTIPLIER
    );
    const bonusFactor = 1 + 9 * bonusProbability;
    const pocketHitProbability = secretRoomHitProbability(lines);
    const terminalCountFactor = expectedTerminalCountPerInitialBall(lines);
    const multiPlusSectors = buildMultiPlusSectors(lines, layoutMode, sectors);
    const multiPlusRoundProbability = multiPlusProbability(lines);
    const multipliers = {
      ...PAYTABLES[layoutMode][lines],
      multi_plus: PAYTABLES[layoutMode][lines].middle,
      secret: 0
    };
    const sectorMultiplier = (sector, category) => sector.multiplier ?? multipliers[category];
    const categoryAverageMultiplier = (category) => sectors[category].length
      ? sectors[category].reduce((sum, sector) => sum + sectorMultiplier(sector, category), 0)
        / sectors[category].length
      : multipliers[category];
    const categoryAverageMultipliers = {
      outer: categoryAverageMultiplier("outer"),
      middle: categoryAverageMultiplier("middle"),
      center: categoryAverageMultiplier("center")
    };
    const regularWeightedSum = sectors.outer.length * categoryAverageMultipliers.outer
      + sectors.middle.length * categoryAverageMultipliers.middle
      + sectors.center.length * categoryAverageMultipliers.center;
    const multiPlusExtraHitLift = multiPlusHitLift(lines, multiPlusSectors.length, multiplierCellCount);
    const weightedRounded = regularWeightedSum / multiplierCellCount;
    const terminalEvPerHit = weightedRounded
      + multiPlusRoundProbability * multiPlusExtraHitLift * multipliers.multi_plus;
    const baselineBonusFactor = 1 + 9 * baseBonusProbability;
    const usesPhysicalStopMix = layoutMode === "dynamic_diagonal_width"
      || isConfiguratorLayoutMode(layoutMode);
    const usesConfiguredMultiPlusCells = isConfiguratorLayoutMode(layoutMode);
    const buildClosestPhysicalProbabilities = (targetTerminalEv, { multiPlusActive = false } = {}) => {
      const configuredMultiPlusCount = usesConfiguredMultiPlusCells && multiPlusActive
        ? multiPlusSectors.length : 0;
      const extraValuePerHit = usesConfiguredMultiPlusCells ? 0
        : multiPlusRoundProbability * multiPlusExtraHitLift * multipliers.multi_plus;
      const allGroups = [
        { category: "empty", count: sectors.empty.filter((sector) => sector.index >= 0).length
          - configuredMultiPlusCount,
          value: 0, floor: 0 },
        { category: "outer", count: sectors.outer.length,
          value: categoryAverageMultipliers.outer + extraValuePerHit, floor: 0 },
        { category: "middle", count: sectors.middle.length,
          value: categoryAverageMultipliers.middle + extraValuePerHit, floor: 0 },
        { category: "center", count: sectors.center.length,
          value: categoryAverageMultipliers.center + extraValuePerHit,
          floor: PREMIUM_CELL_PROBABILITY_FLOOR },
        { category: "multi_plus", count: configuredMultiPlusCount,
          value: multipliers.multi_plus, floor: 0 }
      ];
      const groups = allGroups.filter((group) => group.count > 0);
      const fixed = new Map();
      let solution = null;
      for (let iteration = 0; iteration < groups.length; iteration += 1) {
        const free = groups.filter((group) => !fixed.has(group.category));
        let remainingMass = 1;
        let remainingEv = targetTerminalEv;
        groups.forEach((group) => {
          if (!fixed.has(group.category)) return;
          const perCellProbability = fixed.get(group.category);
          remainingMass -= group.count * perCellProbability;
          remainingEv -= group.count * group.value * perCellProbability;
        });
        const s0 = free.reduce((sum, group) => sum + group.count, 0);
        const s1 = free.reduce((sum, group) => sum + group.count * group.value, 0);
        const s2 = free.reduce((sum, group) => sum + group.count * group.value * group.value, 0);
        const determinant = s0 * s2 - s1 * s1;
        if (free.length < 2 || Math.abs(determinant) < 1e-15) break;
        const intercept = (remainingMass * s2 - remainingEv * s1) / determinant;
        const slope = (remainingEv * s0 - remainingMass * s1) / determinant;
        const candidate = new Map(fixed);
        free.forEach((group) => candidate.set(group.category, intercept + slope * group.value));
        const violation = free
          .map((group) => ({ group, value: candidate.get(group.category) }))
          .filter((entry) => entry.value < entry.group.floor - 1e-15)
          .sort((first, second) => (first.value - first.group.floor)
            - (second.value - second.group.floor))[0];
        if (!violation) {
          solution = candidate;
          break;
        }
        fixed.set(violation.group.category, violation.group.floor);
      }
      if (!solution) {
        throw new Error(`Unsolvable closest physical stop mix for ${configId(layoutMode, lines, pucks)}`);
      }
      return {
        probabilities: {
          empty: (solution.get("empty") || 0) * allGroups.find((group) => group.category === "empty").count,
          outer: (solution.get("outer") || 0) * allGroups.find((group) => group.category === "outer").count,
          middle: (solution.get("middle") || 0) * allGroups.find((group) => group.category === "middle").count,
          center: (solution.get("center") || 0) * allGroups.find((group) => group.category === "center").count,
          multi_plus: (solution.get("multi_plus") || 0)
            * allGroups.find((group) => group.category === "multi_plus").count
        },
        perCellProbabilities: Object.fromEntries(allGroups.map((group) =>
          [group.category, group.count > 0 ? solution.get(group.category) : 0]))
      };
    };
    const physicalSolution = usesPhysicalStopMix
      ? buildClosestPhysicalProbabilities(TARGET_RTP / (terminalCountFactor * bonusFactor))
      : null;
    const multiPlusPhysicalSolution = usesConfiguredMultiPlusCells
      ? buildClosestPhysicalProbabilities(
        TARGET_RTP / (terminalCountFactor * bonusFactor),
        { multiPlusActive: true }
      )
      : null;
    const baselinePhysicalSolution = usesPhysicalStopMix
      ? buildClosestPhysicalProbabilities(TARGET_RTP / (terminalCountFactor * baselineBonusFactor))
      : null;
    const baselineMultiPlusPhysicalSolution = usesConfiguredMultiPlusCells
      ? buildClosestPhysicalProbabilities(
        TARGET_RTP / (terminalCountFactor * baselineBonusFactor),
        { multiPlusActive: true }
      )
      : null;
    const probabilities = physicalSolution?.probabilities || (() => {
      const hit = TARGET_RTP / (terminalCountFactor * terminalEvPerHit * bonusFactor);
      return {
        empty: 1 - hit,
        outer: hit * categoryShares.outer,
        middle: hit * categoryShares.middle,
        center: hit * categoryShares.center,
        multi_plus: 0
      };
    })();
    const baselineProbabilities = baselinePhysicalSolution?.probabilities || null;
    const calibratedHit = 1 - probabilities.empty;
    const baselineHit = baselineProbabilities
      ? 1 - baselineProbabilities.empty
      : TARGET_RTP / (terminalCountFactor * terminalEvPerHit * baselineBonusFactor);
    if (!(calibratedHit > 0 && calibratedHit < 1)) {
      throw new Error(`Unsolvable hit probability for ${configId(layoutMode, lines, pucks)}`);
    }
    const multiPlusAddedProbability = usesConfiguredMultiPlusCells
      ? multiPlusPhysicalSolution.probabilities.multi_plus
      : calibratedHit * multiPlusExtraHitLift;
    const multiPlusEmptyProbability = usesConfiguredMultiPlusCells
      ? multiPlusPhysicalSolution.probabilities.empty
      : probabilities.empty - multiPlusAddedProbability;
    const multiPlusProbabilities = usesConfiguredMultiPlusCells
      ? multiPlusPhysicalSolution.probabilities
      : {
        empty: Math.max(0, multiPlusEmptyProbability),
        outer: probabilities.outer,
        middle: probabilities.middle,
        center: probabilities.center,
        multi_plus: multiPlusAddedProbability
      };
    if (!(multiPlusEmptyProbability >= -1e-12 && multiPlusProbabilities.empty < 1)) {
      throw new Error(`Unsolvable EX MULTI hit probability for ${configId(layoutMode, lines, pucks)}: ${multiPlusEmptyProbability}`);
    }
    const terminalEvFor = (outcomeProbabilities) =>
      outcomeProbabilities.outer * categoryAverageMultipliers.outer
      + outcomeProbabilities.middle * categoryAverageMultipliers.middle
      + outcomeProbabilities.center * categoryAverageMultipliers.center
      + (outcomeProbabilities.multi_plus || 0) * multipliers.multi_plus;
    const shiftHitProbability = (source, amount) => {
      const originalHit = 1 - source.empty;
      const shiftedHit = originalHit + amount;
      const scale = shiftedHit / originalHit;
      return Object.fromEntries(Object.entries(source).map(([category, probability]) => [
        category,
        category === "empty" ? source.empty - amount : probability * scale
      ]));
    };
    const noBonusNoMultiProbability = (1 - bonusProbability) * (1 - multiPlusRoundProbability);
    const bonusOnlyProbability = bonusProbability * (1 - multiPlusRoundProbability);
    const multiOnlyProbability = (1 - bonusProbability) * multiPlusRoundProbability;
    const dualBonusProbability = bonusProbability * multiPlusRoundProbability;
    const normalEvPerHit = terminalEvFor(probabilities) / (1 - probabilities.empty);
    const multiPlusEvPerHit = terminalEvFor(multiPlusProbabilities) / (1 - multiPlusProbabilities.empty);
    const rawPlainPenalty = (
      bonusOnlyProbability * 10 * BONUS_WIN_PROBABILITY_LIFT * normalEvPerHit
      + multiOnlyProbability * BONUS_WIN_PROBABILITY_LIFT * multiPlusEvPerHit
      + dualBonusProbability * 10 * DUAL_BONUS_WIN_PROBABILITY_LIFT * multiPlusEvPerHit
    ) / (noBonusNoMultiProbability * normalEvPerHit);
    const reassuranceScale = Math.min(
      1,
      probabilities.empty / BONUS_WIN_PROBABILITY_LIFT,
      multiPlusProbabilities.empty / DUAL_BONUS_WIN_PROBABILITY_LIFT,
      (1 - probabilities.empty) * 0.8 / rawPlainPenalty
    );
    const bonusWinLift = BONUS_WIN_PROBABILITY_LIFT * reassuranceScale;
    const dualBonusWinLift = DUAL_BONUS_WIN_PROBABILITY_LIFT * reassuranceScale;
    const plainWinPenalty = (
      bonusOnlyProbability * 10 * bonusWinLift * normalEvPerHit
      + multiOnlyProbability * bonusWinLift * multiPlusEvPerHit
      + dualBonusProbability * 10 * dualBonusWinLift * multiPlusEvPerHit
    ) / (noBonusNoMultiProbability * normalEvPerHit);
    const plainProbabilities = shiftHitProbability(probabilities, -plainWinPenalty);
    const bonusProbabilities = shiftHitProbability(probabilities, bonusWinLift);
    const reassuredMultiPlusProbabilities = shiftHitProbability(multiPlusProbabilities, bonusWinLift);
    const dualBonusProbabilities = shiftHitProbability(multiPlusProbabilities, dualBonusWinLift);
    const plainTerminalEv = terminalEvFor(plainProbabilities);
    const bonusTerminalEv = terminalEvFor(bonusProbabilities);
    const multiPlusTerminalEv = terminalEvFor(reassuredMultiPlusProbabilities);
    const dualBonusTerminalEv = terminalEvFor(dualBonusProbabilities);
    const baseTerminalEv = noBonusNoMultiProbability * plainTerminalEv
      + bonusOnlyProbability * bonusTerminalEv
      + multiOnlyProbability * multiPlusTerminalEv
      + dualBonusProbability * dualBonusTerminalEv;
    const bonusExtraTerminalEv = 9 * bonusProbability * (
      (1 - multiPlusRoundProbability) * bonusTerminalEv
      + multiPlusRoundProbability * dualBonusTerminalEv
    );
    const payoutWeightedTerminalEv = baseTerminalEv + bonusExtraTerminalEv;
    const baseRtp = terminalCountFactor * baseTerminalEv;
    const bonusRtp = terminalCountFactor * bonusExtraTerminalEv;
    const calculatedRtp = terminalCountFactor * payoutWeightedTerminalEv;
    const pocketRoundProbability = 1 - (1 - pocketHitProbability) ** pucks;
    const zeroProbabilityForBonusBall = (generation, terminalZeroProbability, hitProbability = calibratedHit) => {
      const repocketProbability = bonusRepocketProbability(generation);
      if (repocketProbability <= 0 || generation > MAX_BONUS_REPOCKET_GENERATION) {
        return terminalZeroProbability;
      }
      const childZero = zeroProbabilityForBonusBall(generation + 1, terminalZeroProbability, hitProbability);
      return (1 - repocketProbability) * terminalZeroProbability
        + repocketProbability * childZero ** POCKET_RELEASE_COUNT;
    };
    const initialZeroProbability = (terminalZeroProbability, hitProbability = calibratedHit) => {
      const releaseZero = zeroProbabilityForBonusBall(1, terminalZeroProbability, hitProbability);
      return (1 - pocketHitProbability) * terminalZeroProbability
        + pocketHitProbability * releaseZero ** POCKET_RELEASE_COUNT;
    };
    const baselineNormalZero = initialZeroProbability(1 - baselineHit, baselineHit);
    const baselineMultiPlusZero = initialZeroProbability(
      usesConfiguredMultiPlusCells
        ? baselineMultiPlusPhysicalSolution.probabilities.empty
        : 1 - baselineHit * (1 + multiPlusExtraHitLift),
      baselineHit
    );
    const calibratedNormalZero = initialZeroProbability(plainProbabilities.empty);
    const calibratedBonusZero = initialZeroProbability(bonusProbabilities.empty);
    const calibratedMultiPlusZero = initialZeroProbability(reassuredMultiPlusProbabilities.empty);
    const calibratedDualBonusZero = initialZeroProbability(dualBonusProbabilities.empty);
    const baselineRoundHit = 1 - ((1 - multiPlusRoundProbability) * baselineNormalZero ** pucks
      + multiPlusRoundProbability * baselineMultiPlusZero ** pucks);
    const calibratedRoundHit = 1 - (
      noBonusNoMultiProbability * calibratedNormalZero ** pucks
      + bonusOnlyProbability * calibratedBonusZero ** pucks
      + multiOnlyProbability * calibratedMultiPlusZero ** pucks
      + dualBonusProbability * calibratedDualBonusZero ** pucks
    );
    const paidBonusRoundHit = 1 - (
      (1 - multiPlusRoundProbability) * calibratedBonusZero ** pucks
      + multiPlusRoundProbability * calibratedDualBonusZero ** pucks
    );
    const baselinePaidBonusWinFrequency = baseBonusProbability * baselineRoundHit;
    const paidBonusWinFrequency = bonusProbability * paidBonusRoundHit;
    const pocketConfig = {
      hit_probability_per_puck: pocketHitProbability,
      round_probability: pocketRoundProbability,
      release_count: POCKET_RELEASE_COUNT,
      repocket_probabilities: { ...BONUS_REPOCKET_PROBABILITIES },
      max_repocket_generation: MAX_BONUS_REPOCKET_GENERATION,
      expected_terminal_balls_per_initial_ball: terminalCountFactor,
      multiplier: 0,
      base_multiplier: 0,
      boosted_multiplier: 0,
      excluded_from_bonus_multiplier: false,
      multiplier_cells: [],
      multi_plus_multiplier_cells: [],
      zones: SECRET_ROOM_IDS.map((zoneId) => secretRoomPocket(lines, zoneId))
    };
    return {
      id: configId(layoutMode, lines, pucks), layout_mode: layoutMode,
      layout_label: LAYOUT_LABELS[layoutMode], risk, lines, pucks,
      profile_version: PROFILE_VERSION,
      target_rtp: TARGET_RTP,
      calculated_rtp: calculatedRtp,
      multiplier_table: multipliers,
      outcome_probabilities: plainProbabilities,
      bonus_outcome_probabilities: bonusProbabilities,
      sector_definitions: sectors,
      pocket: pocketConfig,
      secret_room: pocketConfig,
      multi_plus: {
        probability: multiPlusRoundProbability,
        sectors: multiPlusSectors,
        extra_cell_count: multiPlusSectors.length,
        multiplier: multipliers.multi_plus,
        hit_lift: usesConfiguredMultiPlusCells
          ? Math.max(0, (1 - reassuredMultiPlusProbabilities.empty) - calibratedHit)
          : multiPlusExtraHitLift,
        outcome_probabilities: reassuredMultiPlusProbabilities,
        bonus_outcome_probabilities: dualBonusProbabilities,
        secret_room_extra_cell_count: 0
      },
      star_placement: { count: pucks, unique_sectors: true, exclude_launch_sector: true },
      puck_radius: puckRadius(lines),
      base_puck_radius_5: BASE_PUCK_RADIUS_5,
      fixed_launch_force: FIXED_LAUNCH_FORCE,
      launch_angle_range_degrees: [-34, 34],
      fixed_timestep: FIXED_TIMESTEP,
      minimum_bounces: 4,
      pucks_collide: false,
      bonus_probability: bonusProbability,
      base_bonus_probability: baseBonusProbability,
      bonus_frequency_multiplier: BONUS_FREQUENCY_MULTIPLIER,
      baseline_paid_bonus_win_frequency: baselinePaidBonusWinFrequency,
      paid_bonus_win_frequency: paidBonusWinFrequency,
      paid_bonus_win_frequency_multiplier: paidBonusWinFrequency / baselinePaidBonusWinFrequency,
      base_game_rtp_contribution: baseRtp,
      bonus_rtp_contribution: bonusRtp,
      base_desired_bonus_share: desiredBonusShare,
      desired_bonus_share: bonusRtp / calculatedRtp,
      layout_metrics: {
        multiplier_cell_count: multiplierCellCount,
        multiplier_cell_density: multiplierCellCount / (lines * lines),
        empty_cell_count: sectors.empty.filter((sector) => sector.index >= 0).length,
        empty_cell_density: sectors.empty.filter((sector) => sector.index >= 0).length / (lines * lines),
        visible_multiplier_density: multiplierCellCount / (lines * lines),
        visible_multiplier_density_with_multi_plus: (multiplierCellCount + multiPlusSectors.length) / (lines * lines),
        multi_plus_extra_cell_count: multiPlusSectors.length,
        secret_room_multiplier_cell_count: 0,
        secret_room_multiplier_cell_count_with_multi_plus: 0,
        center_zone_cell_count: sectors.center.length,
        middle_zone_cell_count: sectors.middle.length,
        outer_zone_cell_count: sectors.outer.length,
        average_visible_multiplier_value: (
          sectors.outer.length * categoryAverageMultipliers.outer
          + sectors.middle.length * categoryAverageMultipliers.middle
          + sectors.center.length * categoryAverageMultipliers.center
        ) / multiplierCellCount,
        max_visible_multiplier_value: Math.max(multipliers.outer, multipliers.middle, multipliers.center)
      },
      solver: { displayed_paytable: multipliers, target_hit_probability: calibratedHit,
        baseline_hit_probability: baselineHit, calibrated_hit_probability: calibratedHit,
        category_shares: categoryShares,
        outcome_category_shares: {
          outer: plainProbabilities.outer / (1 - plainProbabilities.empty),
          middle: plainProbabilities.middle / (1 - plainProbabilities.empty),
          center: plainProbabilities.center / (1 - plainProbabilities.empty)
        },
        physical_stop_mix: usesPhysicalStopMix,
        per_cell_probabilities: Object.fromEntries(["empty", "outer", "middle", "center"].map((category) => {
          const count = category === "empty"
            ? sectors.empty.filter((sector) => sector.index >= 0).length : sectors[category].length;
          return [category, count ? plainProbabilities[category] / count : 0];
        })),
        multi_plus_per_cell_probabilities: Object.fromEntries([
          ["empty", sectors.empty.filter((sector) => sector.index >= 0).length - multiPlusSectors.length],
          ["outer", sectors.outer.length], ["middle", sectors.middle.length],
          ["center", sectors.center.length], ["multi_plus", multiPlusSectors.length]
        ].map(([category, count]) => [category,
          count ? reassuredMultiPlusProbabilities[category] / count : 0])),
        category_average_multipliers: categoryAverageMultipliers,
        baseline_center_probability: baselineProbabilities?.center || 0,
        terminal_expected_value: baseTerminalEv,
        payout_weighted_terminal_expected_value: payoutWeightedTerminalEv,
        regular_base_rtp_target: baseRtp,
        terminal_count_factor: terminalCountFactor,
        pocket_hit_probability_per_puck: pocketHitProbability,
        bonus_repocket_probabilities: { ...BONUS_REPOCKET_PROBABILITIES },
        initial_zero_probability: calibratedNormalZero,
        initial_zero_probability_with_bonus: calibratedBonusZero,
        initial_zero_probability_with_multi_plus: calibratedMultiPlusZero,
        initial_zero_probability_with_both_bonuses: calibratedDualBonusZero,
        bonus_win_probability_lift: bonusWinLift,
        dual_bonus_win_probability_lift: dualBonusWinLift,
        plain_win_probability_penalty: plainWinPenalty,
        reassurance_distribution: "proportional_wins",
        multi_plus_probability: multiPlusRoundProbability,
        multi_plus_hit_lift: multiPlusExtraHitLift,
        multi_plus_active_hit_probability: 1 - reassuredMultiPlusProbabilities.empty }
    };
  }

  function buildConfigurations() {
    const configs = [];
    for (const layoutMode of LAYOUT_MODES) {
      for (const lines of LINE_COUNTS) for (const pucks of PUCK_COUNTS) {
        configs.push(solveConfiguration(layoutMode, riskForLines(lines), lines, pucks));
      }
    }
    return configs;
  }
  const CONFIGURATIONS = buildConfigurations();
  const CONFIG_BY_ID = Object.fromEntries(CONFIGURATIONS.map((config) => [config.id, config]));
  function getConfiguration(_risk, lines, pucks, layoutMode = "current") {
    const config = CONFIG_BY_ID[configId(layoutMode, Number(lines), Number(pucks))];
    if (!config) throw new Error(`Unknown Puck Luck configuration: ${layoutMode}/${risk}/${lines}/${pucks}`);
    return config;
  }

  function outcomeProbabilitiesFor(config, bonusActive, multiPlusActive) {
    if (bonusActive && multiPlusActive) return config.multi_plus.bonus_outcome_probabilities;
    if (bonusActive) return config.bonus_outcome_probabilities;
    if (multiPlusActive) return config.multi_plus.outcome_probabilities;
    return config.outcome_probabilities;
  }

  function sampleCategory(rng, probabilities) {
    const roll = rng.next();
    let cursor = probabilities.empty;
    if (roll < cursor) return "empty";
    cursor += probabilities.outer;
    if (roll < cursor) return "outer";
    cursor += probabilities.middle;
    if (roll < cursor) return "middle";
    cursor += probabilities.center;
    if (roll < cursor) return "center";
    return (probabilities.multi_plus || 0) > 0 ? "multi_plus" : "center";
  }
  function pickSector(rng, sectors) { return sectors[rng.int(sectors.length)]; }
  function samplePartialStarCount(rng, pucks) {
    const roll = rng.next();
    if (pucks === 2) return roll < ONE_OF_TWO_STAR_PROBABILITY ? 1 : 0;
    if (pucks === 3) {
      if (roll < TWO_OF_THREE_STAR_PROBABILITY) return 2;
      return roll < 0.95 ? 1 : 0;
    }
    return 0;
  }
  function placeStars(rng, config) {
    const launchIndex = config.lines * config.lines - 1;
    const available = [];
    for (let index = 0; index < config.lines * config.lines; index += 1) if (index !== launchIndex) available.push(index);
    const stars = [];
    for (let i = 0; i < config.pucks; i += 1) {
      const offset = rng.int(available.length);
      const index = available.splice(offset, 1)[0];
      stars.push({ index, row: Math.floor(index / config.lines), col: index % config.lines });
    }
    return stars;
  }

  function createTerminalResult(rng, config, probabilities, metadata = {}) {
    const safeEmptySectors = config.sector_definitions.empty.filter((sector) => sector.index >= 0);
    const multiPlusSectorKeys = new Set(config.multi_plus.sectors.map((sector) => `${sector.col}_${sector.row}`));
    const activeSafeEmptySectors = metadata.multiPlusActive
      ? safeEmptySectors.filter((sector) => !multiPlusSectorKeys.has(`${sector.col}_${sector.row}`))
      : safeEmptySectors;
    const category = sampleCategory(rng, probabilities);
    const sectorPool = category === "empty" ? activeSafeEmptySectors
      : category === "multi_plus" ? config.multi_plus.sectors
        : config.sector_definitions[category];
    const sector = pickSector(rng, sectorPool);
    return {
      ...metadata,
      category,
      sector,
      multiplier: sector.multiplier ?? config.multiplier_table[category],
      empty: category === "empty",
      secret_room: false,
      pocket_release: (metadata.release_generation || 0) > 0,
      visual_seed: rng.uint32(),
      launch_angle_degrees: config.launch_angle_range_degrees[0]
        + rng.next() * (config.launch_angle_range_degrees[1] - config.launch_angle_range_degrees[0]),
      launch_force: config.fixed_launch_force,
      required_bounces: config.minimum_bounces + rng.int(4)
    };
  }

  function createPocketResult(rng, config, probabilities, metadata = {}) {
    const zoneId = SECRET_ROOM_IDS[rng.int(SECRET_ROOM_IDS.length)];
    const pocket = secretRoomPocket(config.lines, zoneId);
    const releaseGeneration = (metadata.release_generation || 0) + 1;
    const releaseResults = Array.from({ length: POCKET_RELEASE_COUNT }, (_, releaseIndex) =>
      createBonusResult(rng, config, probabilities, {
        multiPlusActive: metadata.multiPlusActive,
        release_generation: releaseGeneration,
        release_index: releaseIndex,
        result_path: `${metadata.result_path || metadata.puck_index || 0}.${releaseIndex}`
      }));
    return {
      ...metadata,
      category: "pocket",
      sector: { col: pocket.col, row: pocket.row },
      multiplier: 0,
      empty: false,
      secret_room: true,
      secret_room_win: false,
      secret_zone_id: zoneId,
      secret_pocket: pocket,
      secret_room_multiplier_cell: null,
      pocket_release: (metadata.release_generation || 0) > 0,
      release_generation: metadata.release_generation || 0,
      release_results: releaseResults,
      visual_seed: rng.uint32(),
      launch_angle_degrees: 0,
      launch_force: config.fixed_launch_force,
      required_bounces: config.minimum_bounces
    };
  }

  function createBonusResult(rng, config, probabilities, metadata = {}) {
    const generation = metadata.release_generation || 1;
    const repocketProbability = generation <= MAX_BONUS_REPOCKET_GENERATION
      ? bonusRepocketProbability(generation) : 0;
    return rng.next() < repocketProbability
      ? createPocketResult(rng, config, probabilities, metadata)
      : createTerminalResult(rng, config, probabilities, metadata);
  }

  function resultMultiplierSum(result) {
    if (!result?.secret_room) return result?.multiplier || 0;
    return (result.release_results || []).reduce((sum, child) => sum + resultMultiplierSum(child), 0);
  }

  function flattenResultTree(results) {
    const flattened = [];
    const visit = (result) => {
      flattened.push(result);
      (result.release_results || []).forEach(visit);
    };
    results.forEach(visit);
    return flattened;
  }

  function createRound({ risk: _risk, lines, pucks, layoutMode = "current", betPerPuck = 1, seed = 1 }) {
    const risk = riskForLines(lines);
    const config = getConfiguration(risk, lines, pucks, layoutMode);
    const rng = createRng((seed ^ hashString(config.id)) >>> 0);
    const stars = placeStars(rng, config);
    const paidBonusTriggered = rng.next() < config.bonus_probability;
    const multiPlusTriggered = rng.next() < config.multi_plus.probability;
    const multiPlusAssignedPuck = multiPlusTriggered ? rng.int(pucks) : -1;
    const baselineCollectedCount = paidBonusTriggered ? pucks : samplePartialStarCount(rng, pucks);
    const activeOutcomeProbabilities = outcomeProbabilitiesFor(
      config, paidBonusTriggered, multiPlusTriggered
    );
    const puckResults = Array.from({ length: pucks }, (_, puckIndex) => {
      const metadata = {
        puck_index: puckIndex,
        result_path: `${puckIndex}`,
        release_generation: 0,
        multiPlusActive: multiPlusTriggered,
        multi_plus: multiPlusTriggered && puckIndex === multiPlusAssignedPuck
      };
      return rng.next() < config.pocket.hit_probability_per_puck
        ? createPocketResult(rng, config, activeOutcomeProbabilities, metadata)
        : createTerminalResult(rng, config, activeOutcomeProbabilities, metadata);
    });
    const baseMultiplierSum = puckResults.reduce((sum, result) => sum + resultMultiplierSum(result), 0);
    const emptyBonusChance = 0;
    const emptyBonusTriggered = false;
    const bonusTriggered = paidBonusTriggered;
    const collectedCount = bonusTriggered ? pucks : baselineCollectedCount;
    const starResults = stars.map((star, index) => ({ ...star, collected: index < collectedCount }));
    const bonusMultiplier = paidBonusTriggered ? 10 : 1;
    const totalBet = betPerPuck * pucks;
    const baseWin = betPerPuck * baseMultiplierSum;
    const finalWin = baseWin * bonusMultiplier;
    const resultTree = flattenResultTree(puckResults);
    const pocketResults = resultTree.filter((result) => result.secret_room);
    const recursivePocketResults = pocketResults.filter((result) => result.release_generation > 0);
    return {
      config_id: config.id, layout_mode: layoutMode, risk, lines, pucks, seed: seed >>> 0,
      bet_per_puck: betPerPuck,
      total_bet: totalBet,
      star_positions: starResults,
      puck_results: puckResults,
      result_tree_size: resultTree.length,
      bonus_ball_count: resultTree.filter((result) => result.release_generation > 0).length,
      recursive_pocket_count: recursivePocketResults.length,
      maximum_release_generation: Math.max(0, ...resultTree.map((result) => result.release_generation || 0)),
      multi_plus_triggered: multiPlusTriggered,
      multi_plus_assigned_puck: multiPlusAssignedPuck,
      multi_plus_extra_cell_count: config.multi_plus.extra_cell_count,
      secret_room_multi_plus_extra_cell_count: 0,
      secret_room_triggered: pocketResults.length > 0,
      secret_room_puck_indices: puckResults.filter((result) => result.secret_room).map((result) => result.puck_index),
      secret_room_zone_ids: puckResults.filter((result) => result.secret_room).map((result) => result.secret_zone_id),
      secret_room_puck_index: puckResults.find((result) => result.secret_room)?.puck_index ?? -1,
      secret_room_zone_id: puckResults.find((result) => result.secret_room)?.secret_zone_id ?? null,
      stars_collected: collectedCount,
      bonus_triggered: bonusTriggered,
      paid_bonus_triggered: paidBonusTriggered,
      empty_bonus_triggered: emptyBonusTriggered,
      empty_bonus_chance: emptyBonusChance,
      bonus_multiplier: bonusMultiplier,
      base_win_multiplier_sum: baseMultiplierSum,
      final_win_multiplier_sum: baseMultiplierSum * bonusMultiplier,
      base_win: baseWin,
      final_win: finalWin,
      rtp_contribution: finalWin / totalBet,
      authoritative: true
    };
  }

  function enumerateOutcomes(config) {
    const addProbability = (distribution, value, probability) => {
      if (probability <= 0) return;
      distribution.set(value, (distribution.get(value) || 0) + probability);
    };
    const mixDistributions = (first, firstWeight, second, secondWeight) => {
      const mixed = new Map();
      first.forEach((probability, value) => addProbability(mixed, value, probability * firstWeight));
      second.forEach((probability, value) => addProbability(mixed, value, probability * secondWeight));
      return mixed;
    };
    const convolve = (first, second) => {
      const combined = new Map();
      first.forEach((firstProbability, firstValue) => {
        second.forEach((secondProbability, secondValue) => {
          addProbability(combined, firstValue + secondValue, firstProbability * secondProbability);
        });
      });
      return combined;
    };
    const sumCopies = (distribution, count) => {
      let sum = new Map([[0, 1]]);
      for (let index = 0; index < count; index += 1) sum = convolve(sum, distribution);
      return sum;
    };
    const terminalDistribution = (multiPlusActive, bonusActive) => {
      const probabilities = outcomeProbabilitiesFor(config, bonusActive, multiPlusActive);
      const distribution = new Map();
      CATEGORIES.forEach((category) => {
        const probability = probabilities[category] || 0;
        const sectors = config.sector_definitions[category] || [];
        if (sectors.length && category !== "empty") {
          const sectorProbability = probability / sectors.length;
          sectors.forEach((sector) => {
            const multiplier = sector.multiplier ?? config.multiplier_table[category] ?? 0;
            addProbability(distribution, Math.round(multiplier * 100), sectorProbability);
          });
        } else {
          const value = Math.round((config.multiplier_table[category] || 0) * 100);
          addProbability(distribution, value, probability);
        }
      });
      return distribution;
    };
    const bonusDistribution = (multiPlusActive, generation, terminal) => {
      const repocketProbability = generation <= MAX_BONUS_REPOCKET_GENERATION
        ? bonusRepocketProbability(generation) : 0;
      if (repocketProbability <= 0) return terminal;
      const child = bonusDistribution(multiPlusActive, generation + 1, terminal);
      return mixDistributions(terminal, 1 - repocketProbability,
        sumCopies(child, POCKET_RELEASE_COUNT), repocketProbability);
    };
    const results = [];
    for (const multiPlusActive of [false, true]) {
      const multiPlusProbability = multiPlusActive
        ? config.multi_plus.probability : 1 - config.multi_plus.probability;
      for (const bonus of [false, true]) {
        const bonusProbability = bonus ? config.bonus_probability : 1 - config.bonus_probability;
        const bonusMultiplier = bonus ? 10 : 1;
        const terminal = terminalDistribution(multiPlusActive, bonus);
        const releaseBall = bonusDistribution(multiPlusActive, 1, terminal);
        const initial = mixDistributions(terminal, 1 - config.pocket.hit_probability_per_puck,
          sumCopies(releaseBall, POCKET_RELEASE_COUNT), config.pocket.hit_probability_per_puck);
        const roundDistribution = sumCopies(initial, config.pucks);
        roundDistribution.forEach((probability, baseValueCents) => {
          const baseSum = baseValueCents / 100;
          const finalSum = baseSum * bonusMultiplier;
          results.push({
            categories: [], bonus, multi_plus: multiPlusActive,
            probability: probability * multiPlusProbability * bonusProbability,
            base_multiplier_sum: baseSum,
            final_multiplier_sum: finalSum,
            payout_ratio: finalSum / config.pucks
          });
        });
      }
    }
    return results;
  }

  function analyticMetrics(config) {
    const terminalMoments = (multiPlusActive, bonusActive) => {
      const probabilities = outcomeProbabilitiesFor(config, bonusActive, multiPlusActive);
      let mean = 0;
      let second = 0;
      let maximum = 0;
      CATEGORIES.forEach((category) => {
        const probability = probabilities[category] || 0;
        const sectors = config.sector_definitions[category] || [];
        if (sectors.length && category !== "empty") {
          const sectorProbability = probability / sectors.length;
          sectors.forEach((sector) => {
            const multiplier = sector.multiplier ?? config.multiplier_table[category] ?? 0;
            mean += sectorProbability * multiplier;
            second += sectorProbability * multiplier * multiplier;
            if (sectorProbability > 0) maximum = Math.max(maximum, multiplier);
          });
        } else {
          const multiplier = config.multiplier_table[category] || 0;
          mean += probability * multiplier;
          second += probability * multiplier * multiplier;
          if (probability > 0) maximum = Math.max(maximum, multiplier);
        }
      });
      return { mean, second, zero: probabilities.empty, maximum };
    };
    const sumMoments = (moments, count) => ({
      mean: count * moments.mean,
      second: count * moments.second + count * (count - 1) * moments.mean * moments.mean,
      zero: moments.zero ** count,
      maximum: count * moments.maximum
    });
    const mixMoments = (first, firstWeight, second, secondWeight) => ({
      mean: first.mean * firstWeight + second.mean * secondWeight,
      second: first.second * firstWeight + second.second * secondWeight,
      zero: first.zero * firstWeight + second.zero * secondWeight,
      maximum: Math.max(first.maximum, second.maximum)
    });
    const bonusBallMoments = (terminal, generation) => {
      const repocketProbability = generation <= MAX_BONUS_REPOCKET_GENERATION
        ? bonusRepocketProbability(generation) : 0;
      if (repocketProbability <= 0) return terminal;
      const release = sumMoments(bonusBallMoments(terminal, generation + 1), POCKET_RELEASE_COUNT);
      return mixMoments(terminal, 1 - repocketProbability, release, repocketProbability);
    };
    const initialBallMoments = (multiPlusActive, bonusActive) => {
      const terminal = terminalMoments(multiPlusActive, bonusActive);
      const release = sumMoments(bonusBallMoments(terminal, 1), POCKET_RELEASE_COUNT);
      return mixMoments(terminal, 1 - config.pocket.hit_probability_per_puck,
        release, config.pocket.hit_probability_per_puck);
    };
    const normalRound = sumMoments(initialBallMoments(false, false), config.pucks);
    const bonusRound = sumMoments(initialBallMoments(false, true), config.pucks);
    const multiPlusRound = sumMoments(initialBallMoments(true, false), config.pucks);
    const dualBonusRound = sumMoments(initialBallMoments(true, true), config.pucks);
    const bonusProbability = config.bonus_probability;
    const multiPlusProbability = config.multi_plus.probability;
    const noBonusNoMultiProbability = (1 - bonusProbability) * (1 - multiPlusProbability);
    const bonusOnlyProbability = bonusProbability * (1 - multiPlusProbability);
    const multiOnlyProbability = (1 - bonusProbability) * multiPlusProbability;
    const dualBonusProbability = bonusProbability * multiPlusProbability;
    const mean = (
      noBonusNoMultiProbability * normalRound.mean
      + bonusOnlyProbability * 10 * bonusRound.mean
      + multiOnlyProbability * multiPlusRound.mean
      + dualBonusProbability * 10 * dualBonusRound.mean
    ) / config.pucks;
    const secondMoment = (
      noBonusNoMultiProbability * normalRound.second
      + bonusOnlyProbability * 100 * bonusRound.second
      + multiOnlyProbability * multiPlusRound.second
      + dualBonusProbability * 100 * dualBonusRound.second
    ) / (config.pucks * config.pucks);
    const zeroProbability = noBonusNoMultiProbability * normalRound.zero
      + bonusOnlyProbability * bonusRound.zero
      + multiOnlyProbability * multiPlusRound.zero
      + dualBonusProbability * dualBonusRound.zero;
    const variance = Math.max(0, secondMoment - mean * mean);
    const aboveBetEstimate = simulateConfiguration(config, 30000,
      hashString(`${config.id}:above-bet-analytic`), { captureHistogram: false });
    return {
      rtp: mean,
      hit_frequency: 1 - zeroProbability,
      win_above_bet_frequency: aboveBetEstimate.simulated_win_above_bet_frequency,
      bonus_frequency: config.bonus_probability,
      max_win_multiplier: Math.max(bonusRound.maximum, dualBonusRound.maximum) * 10 / config.pucks,
      variance,
      standard_deviation: Math.sqrt(variance),
      top20: []
    };
  }

  function simulateConfiguration(config, totalRuns = 1000000, seed = hashString(config.id), options = {}) {
    const captureHistogram = options.captureHistogram !== false;
    const rng = createRng(seed);
    let payoutSum = 0, basePayoutSum = 0, bonusExtraSum = 0, hitCount = 0, aboveBetCount = 0, bonusCount = 0;
    let multiPlusCount = 0;
    let mean = 0, m2 = 0, maxWin = 0;
    const categoryHits = { empty: 0, outer: 0, middle: 0, center: 0, multi_plus: 0, secret: 0 };
    const starCellHits = new Array(config.lines * config.lines).fill(0);
    const outcomeHistogram = Object.create(null);
    for (let run = 0; run < totalRuns; run += 1) {
      for (let star = 0; star < config.pucks; star += 1) starCellHits[rng.int(starCellHits.length - 1)] += 1;
      const bonus = rng.next() < config.bonus_probability;
      const multiPlus = rng.next() < config.multi_plus.probability;
      if (multiPlus) multiPlusCount += 1;
      const probabilities = outcomeProbabilitiesFor(config, bonus, multiPlus);
      const categories = [];
      const sampleTerminal = () => {
        const category = sampleCategory(rng, probabilities);
        categoryHits[category] += 1;
        categories.push(category[0]);
        const sectors = config.sector_definitions[category] || [];
        if (!sectors.length || category === "empty") return config.multiplier_table[category];
        const sector = sectors[rng.int(sectors.length)];
        return sector.multiplier ?? config.multiplier_table[category];
      };
      const sampleBonusBall = (generation) => {
        const repocketProbability = generation <= MAX_BONUS_REPOCKET_GENERATION
          ? bonusRepocketProbability(generation) : 0;
        if (repocketProbability > 0 && rng.next() < repocketProbability) {
          categoryHits.secret += 1;
          categories.push(`p${generation}`);
          let releaseSum = 0;
          for (let index = 0; index < POCKET_RELEASE_COUNT; index += 1) {
            releaseSum += sampleBonusBall(generation + 1);
          }
          return releaseSum;
        }
        return sampleTerminal();
      };
      let base = 0;
      for (let puck = 0; puck < config.pucks; puck += 1) {
        if (rng.next() < config.pocket.hit_probability_per_puck) {
          categoryHits.secret += 1;
          categories.push("P");
          for (let index = 0; index < POCKET_RELEASE_COUNT; index += 1) {
            base += sampleBonusBall(1);
          }
          continue;
        }
        base += sampleTerminal();
      }
      const final = base * (bonus ? 10 : 1);
      const payoutRatio = final / config.pucks;
      payoutSum += payoutRatio;
      basePayoutSum += base / config.pucks;
      bonusExtraSum += (final - base) / config.pucks;
      if (final > 0) hitCount += 1;
      if (payoutRatio > 1) aboveBetCount += 1;
      if (bonus) bonusCount += 1;
      if (payoutRatio > maxWin) maxWin = payoutRatio;
      const delta = payoutRatio - mean;
      mean += delta / (run + 1);
      m2 += delta * (payoutRatio - mean);
      if (captureHistogram) {
        const key = `${categories.join("")}|${bonus ? "B" : "N"}|${final.toFixed(2)}`;
        outcomeHistogram[key] = (outcomeHistogram[key] || 0) + 1;
      }
    }
    return {
      total_runs: totalRuns,
      seed: seed >>> 0,
      simulated_rtp: payoutSum / totalRuns,
      simulated_base_rtp: basePayoutSum / totalRuns,
      simulated_bonus_rtp: bonusExtraSum / totalRuns,
      simulated_hit_frequency: hitCount / totalRuns,
      simulated_win_above_bet_frequency: aboveBetCount / totalRuns,
      simulated_bonus_frequency: bonusCount / totalRuns,
      simulated_multi_plus_frequency: multiPlusCount / totalRuns,
      simulated_max_win_multiplier: maxWin,
      simulated_variance: totalRuns > 1 ? m2 / (totalRuns - 1) : 0,
      category_hits: categoryHits,
      star_cell_hits: starCellHits,
      outcome_histogram: outcomeHistogram
    };
  }

  return {
    TARGET_RTP, BONUS_PRESENTATION_TARGET_RATE, EMPTY_BONUS_PRESENTATION_MULTIPLIER,
    BONUS_FREQUENCY_MULTIPLIER, BONUS_WIN_PROBABILITY_LIFT,
    DUAL_BONUS_WIN_PROBABILITY_LIFT, SESSION_EVENT_MIN_PROBABILITY,
    ONE_OF_TWO_STAR_PROBABILITY, TWO_OF_THREE_STAR_PROBABILITY,
    PROFILE_VERSION, PAYTABLES, PREMIUM_CELL_PROBABILITY_FLOOR, LAYOUT_MODES, LAYOUT_LABELS,
    CONFIGURATOR_LAYOUT_MODE, CONFIGURATOR_1_LAYOUT_MODE, CONFIGURATOR_2_LAYOUT_MODE,
    CONFIGURATOR_3_LAYOUT_MODE, CONFIGURATOR_4_LAYOUT_MODE, CONFIGURATOR_5_LAYOUT_MODE,
    CONFIGURATOR_LAYOUT_MODES, FIELD_CONFIGURATIONS,
    FIELD_CONFIGURATION_1: fieldConfiguration1, FIELD_CONFIGURATION_2: fieldConfiguration2,
    FIELD_CONFIGURATION_3: fieldConfiguration3, FIELD_CONFIGURATION_4: fieldConfiguration4,
    FIELD_CONFIGURATION_5: fieldConfiguration5,
    RISK_LEVELS, LINE_COUNTS, PUCK_COUNTS, FIXED_TIMESTEP, BASE_PUCK_RADIUS_5,
    FIXED_LAUNCH_FORCE, POCKET_HIT_PROBABILITIES, BONUS_REPOCKET_PROBABILITIES,
    MAX_BONUS_REPOCKET_GENERATION, POCKET_RELEASE_COUNT,
    MULTI_PLUS_PROBABILITIES, MULTI_PLUS_EXTRA_CELLS,
    SECRET_ROOM_MULTI_PLUS_EXTRA_CELLS, SECRET_ROOM_IDS,
    CONFIGURATIONS, createRng, hashString, riskForLines, puckRadius, secretRoomMultiplier,
    secretRoomHitProbability, secretRoomWinProbability, bonusRepocketProbability,
    expectedTerminalCountFromBonusBall, expectedTerminalCountPerInitialBall,
    multiPlusProbability, multiPlusExtraCellCount,
    multiPlusHitLift,
    secretRoomMultiPlusExtraCellCount, secretRoomMultiplierCells, secretRoomPocket, getConfiguration,
    createRound, enumerateOutcomes, analyticMetrics, simulateConfiguration, solveConfiguration,
    samplePartialStarCount,
    buildSectorDefinitions, buildMultiPlusSectors, dynamicMultiplierCells
  };
});
