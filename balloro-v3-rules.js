"use strict";

// V3 is deliberately opt-in. V2 and the legacy rules are not modified by this table.
window.BalloroV3Rules = Object.freeze((() => {
  const rings = Object.freeze({
    5: Object.freeze([45, 2.1, 0.3]),
    7: Object.freeze([70, 2.1, 0.3, 0.1]),
    9: Object.freeze([100, 1.9, 0.2, 0.1, 0.1])
  });
  const roomMultipliers = Object.freeze({
    5: Object.freeze({ "bottom-left": 20, "bottom-right": 120 }),
    7: Object.freeze({ "bottom-left": 35, "bottom-right": 180 }),
    9: Object.freeze({ "bottom-left": 50, "bottom-right": 250 })
  });
  const roomSideMultipliers = Object.freeze({
    5: Object.freeze({ "bottom-left": Object.freeze([1.8]), "bottom-right": Object.freeze([3]) }),
    7: Object.freeze({ "bottom-left": Object.freeze([2]), "bottom-right": Object.freeze([3.5]) }),
    9: Object.freeze({ "bottom-left": Object.freeze([2.2, 1.6]), "bottom-right": Object.freeze([4, 3]) })
  });
  // Per paid V3 shot, not a session quota or a player-specific RTP correction.
  const pocketWeights = Object.freeze({ blue: 0.04, lemon: 0.03, crown: 0.02, diamond: 0.003 });
  const neutralTierWeights = Object.freeze({
    5: Object.freeze({ red: 0.004, yellow: 0.1857, green: 0.8103 }),
    7: Object.freeze({ red: 0.003, yellow: 0.2144, green: 0.7826 }),
    9: Object.freeze({ red: 0.002, yellow: 0.2537, green: 0.7443 })
  });
  const releaseTierWeights = Object.freeze({ red: 0.002, yellow: 0.12, green: 0.868, pocket: 0.01 });
  const roomCenterWeight = 0.04;
  const launchIntervalMs = 1000;
  const quickLaunchIntervalMs = 500;
  const resultDelayMs = 300;
  const resultFadeMs = 2000;

  function pocketCells(lines) {
    const last = lines - 1;
    return {
      diamond: { col: last, row: last },
      crown: { col: 0, row: last },
      lemon: { col: last, row: 0 },
      blue: { col: 0, row: 0 }
    };
  }

  function pocketKindAt(lines, col, row) {
    const cells = pocketCells(lines);
    return Object.keys(cells).find((kind) => cells[kind].col === col && cells[kind].row === row) || null;
  }

  function cellMultiplier(lines, col, row) {
    const values = rings[lines];
    if (!values || col < 0 || row < 0 || col >= lines || row >= lines) return 0;
    if (pocketKindAt(lines, col, row)) return 0;
    const mid = (lines - 1) / 2;
    const distance = Math.max(Math.abs(col - mid), Math.abs(row - mid));
    return values[Math.min(distance, values.length - 1)];
  }

  function roomCenterCell(lines, id) {
    const size = Math.max(2, Math.round(lines * 0.4));
    const index = Math.floor((size - 1) / 2);
    return { size, col: index + (id === "bottom-right" && size % 2 === 0 ? 1 : 0),
      row: index + (id === "bottom-left" && size % 2 === 0 ? 1 : 0) };
  }

  function roomCellTier(lines, id, col, row) {
    const center = roomCenterCell(lines, id);
    if (col < 0 || row < 0 || col >= center.size || row >= center.size) return null;
    return col === center.col && row === center.row ? "red"
      : id === "bottom-left" ? "yellow" : "red";
  }

  function roomCellMultiplier(lines, id, col, row) {
    if (!roomCellTier(lines, id, col, row)) return 0;
    const center = roomCenterCell(lines, id);
    if (col === center.col && row === center.row) return roomMultipliers[lines][id];
    const ring = Math.max(Math.abs(col - center.col), Math.abs(row - center.row));
    const values = roomSideMultipliers[lines][id];
    return values[Math.min(ring - 1, values.length - 1)];
  }

  return { rings, roomMultipliers, roomSideMultipliers, roomCenterCell, roomCellTier,
    roomCellMultiplier,
    pocketCells, pocketKindAt, cellMultiplier,
    pocketWeights, neutralTierWeights, releaseTierWeights, roomCenterWeight,
    launchIntervalMs, quickLaunchIntervalMs, resultDelayMs, resultFadeMs, yellowMultiplier: 5 };
})());
