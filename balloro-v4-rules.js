"use strict";

// V4 is an isolated opt-in variant. The V2 and V3 tables remain unchanged.
window.BalloroV4Rules = Object.freeze((() => {
  const base = window.BalloroV3Rules;
  const centerMultipliers = Object.freeze({ 5: 40, 7: 70, 9: 100 });
  const rings = Object.freeze({
    5: Object.freeze([centerMultipliers[5], 2, 0.3]),
    7: Object.freeze([centerMultipliers[7], 5, 0.3, 0.1]),
    9: Object.freeze([centerMultipliers[9], 10, 0.5, 0.2, 0.1])
  });
  // Keep the existing selection weights during the uncalibrated payout test.
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
    5: Object.freeze({ "bottom-left": Object.freeze([2]), "bottom-right": Object.freeze([5]) }),
    7: Object.freeze({ "bottom-left": Object.freeze([5]), "bottom-right": Object.freeze([10]) }),
    9: Object.freeze({ "bottom-left": Object.freeze([10, 10]), "bottom-right": Object.freeze([20, 20]) }) });

  function roomCellMultiplier(lines, id, col, row) {
    if (!base.roomCellTier(lines, id, col, row)) return 0;
    const center = base.roomCenterCell(lines, id);
    if (col === center.col && row === center.row) return base.roomMultipliers[lines][id];
    const ring = Math.max(Math.abs(col - center.col), Math.abs(row - center.row));
    const values = roomSideMultipliers[lines][id];
    return values[Math.min(ring - 1, values.length - 1)];
  }

  function hasMultiplierFire(lines, col, row, roomId = null) {
    const center = roomId ? base.roomCenterCell(lines, roomId)
      : { col: (lines - 1) / 2, row: (lines - 1) / 2 };
    return col === center.col && row === center.row;
  }

  return { ...base, pocketCells, pocketKindAt, yellowMultiplier: 10, centerMultipliers, rings, cellTier, cellMultiplier,
    roomSideMultipliers, roomCellMultiplier, hasMultiplierFire,
    neutralTierWeights, releaseTierWeights };
})());
