"use strict";

// Approved V2 only. Historical comparison rules are kept in work/version-archives.
window.BalloroPayoutVersions = Object.freeze((() => {
function createVersion() {
  const base = window.BalloroV3Rules;
  const mathVersion = 'v2';
  const centerMultipliers = Object.freeze({ 5: 10, 7: 60, 9: 85 });
  const rings = Object.freeze({
    5: Object.freeze([centerMultipliers[5], 2, 0.3]),
    7: Object.freeze([centerMultipliers[7], 5, 0.3, 0.1]),
    9: Object.freeze([centerMultipliers[9], 10, 1.1, 0.2, 0.1])
  });
  // Legacy tier selectors are retained for archive/test compatibility; the live
  // MVP selector calibrates complete bonus chains in balloro-mvp-math.js.
  const neutralTierWeights = Object.freeze({
    5: Object.freeze({ red: 0.004, yellowHigh: 0.04, yellowLow: 0.179288, greenHigh: 0.08, greenLow: 0.696712 }),
    7: Object.freeze({ red: 0.003, yellowHigh: 0.03, yellowLow: 0.169489, greenHigh: 0.08, greenLow: 0.717511 }),
    9: Object.freeze({ red: 0.002, yellowHigh: 0.02, yellowLow: 0.174814, greenHigh: 0.08, greenLow: 0.723186 })
  });
  const releaseTierWeights = Object.freeze({
    red: 0.002, yellowHigh: 0.025, yellowLow: 0.095,
    greenHigh: 0.08, greenLow: 0.788, pocket: 0.01
  });

  function pocketCells(lines) {
    const last = lines - 1;
    return { diamond: { col: 0, row: 0 }, crown: { col: last, row: last },
      blue: { col: 0, row: last }, lemon: { col: last, row: 0 } };
  }

  function pocketKindAt(lines, col, row) {
    const cells = pocketCells(lines);
    return Object.keys(cells).find(kind => cells[kind].col === col && cells[kind].row === row) || null;
  }

  function cellTier(lines, col, row) {
    if (!centerMultipliers[lines] || col < 0 || row < 0 || col >= lines || row >= lines) return null;
    if (pocketKindAt(lines, col, row)) return "pocket";
    const mid = (lines - 1) / 2;
    const dx = col - mid;
    const dy = row - mid;
    const ring = Math.max(Math.abs(dx), Math.abs(dy));
    if (ring === 0) return "red";
    if (ring === 1) return dx + dy === 0 ? "yellowHigh" : "yellowLow";
    return (Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0)
      ? "greenHigh" : "greenLow";
  }

  function cellMultiplier(lines, col, row) {
    const tier = cellTier(lines, col, row);
    if (!tier || tier === "pocket") return 0;
    const mid = (lines - 1) / 2;
    const ring = Math.max(Math.abs(col - mid), Math.abs(row - mid));
    return rings[lines][ring];
  }

  const roomSideMultipliers = Object.freeze({ ...base.roomSideMultipliers,
    5: Object.freeze({ "bottom-left": Object.freeze([2]), "bottom-right": Object.freeze([7]) }),
    7: Object.freeze({ "bottom-left": Object.freeze([5]), "bottom-right": Object.freeze([10]) }),
    9: Object.freeze({ "bottom-left": Object.freeze([10, 10]), "bottom-right": Object.freeze([15, 15]) }) });
  const roomMultipliers = Object.freeze({
    ...base.roomMultipliers,
    7: Object.freeze({ ...base.roomMultipliers[7], 'bottom-left': 30 }),
    9: Object.freeze({ ...base.roomMultipliers[9], 'bottom-left': 45 })
  });

  function roomCellMultiplier(lines, id, col, row) {
    if (!base.roomCellTier(lines, id, col, row)) return 0;
    const center = base.roomCenterCell(lines, id);
    if (col === center.col && row === center.row) return roomMultipliers[lines][id];
    const ring = Math.max(Math.abs(col - center.col), Math.abs(row - center.row));
    const values = roomSideMultipliers[lines][id];
    return values[Math.min(ring - 1, values.length - 1)];
  }

  function hasMultiplierFire(lines, col, row, roomId = null) {
    const center = roomId ? base.roomCenterCell(lines, roomId)
      : { col: (lines - 1) / 2, row: (lines - 1) / 2 };
    return col === center.col && row === center.row;
  }

  // Presentation only: compare a temporarily boosted main cell with the
  // normal center, not its currently boosted/purple value. Math uses the
  // permanent center identity above and never this decoration helper.
  function hasMultiplierTopSymbol(lines, col, row, displayedMultiplier) {
    if (hasMultiplierFire(lines, col, row)) return true;
    const baseValue = cellMultiplier(lines, col, row);
    return baseValue > 0 && displayedMultiplier > baseValue
      && displayedMultiplier >= centerMultipliers[lines];
  }

  return Object.freeze({ ...base, mathVersion, pocketCells, pocketKindAt, yellowMultiplier: 10, centerMultipliers, rings, cellTier, cellMultiplier,
    roomMultipliers,
    roomSideMultipliers, roomCellMultiplier, hasMultiplierFire, hasMultiplierTopSymbol,
    neutralTierWeights, releaseTierWeights });
}
return { v2: createVersion() };
})());
window.BalloroV4Rules = window.BalloroPayoutVersions.v2;
