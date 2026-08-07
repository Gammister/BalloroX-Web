(function initPuckLuckGameplayTest(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PuckLuckGameplayTest = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createGameplayTestApi() {
  "use strict";

  function estimateRoundDuration(outcome, trajectoryLibrary) {
    if (!trajectoryLibrary?.library?.[outcome.lines]) return 0;
    let duration = 0;
    outcome.puck_results.forEach((result, index) => {
      const cellId = `${result.sector.col}_${result.sector.row}`;
      const variants = trajectoryLibrary.library[outcome.lines][cellId] || [];
      if (!variants.length) return;
      const variantIndex = (result.visual_seed + index * 2654435761) % variants.length;
      duration = Math.max(duration, variants[variantIndex].duration || 0);
    });
    return duration;
  }

  function runGameplayTest({ math, trajectoryLibrary, layoutMode, risk, lines, pucks, rounds, seed = 1 }) {
    const config = math.getConfiguration(risk, lines, pucks, layoutMode);
    let totalDuration = 0;
    let hits = 0;
    let aboveBet = 0;
    let payoutSum = 0;
    let bigWins = 0;
    let bonuses = 0;
    let currentMissStreak = 0;
    let longestMissStreak = 0;
    let missStreaks = 0;

    for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
      const round = math.createRound({
        layoutMode, risk, lines, pucks, betPerPuck: 1,
        seed: (seed + Math.imul(roundIndex + 1, 0x9e3779b1)) >>> 0
      });
      const payoutRatio = round.final_win / round.total_bet;
      const hit = round.final_win > 0;
      payoutSum += payoutRatio;
      totalDuration += estimateRoundDuration(round, trajectoryLibrary);
      if (hit) {
        hits += 1;
        if (currentMissStreak > 0) missStreaks += 1;
        currentMissStreak = 0;
      } else {
        currentMissStreak += 1;
        longestMissStreak = Math.max(longestMissStreak, currentMissStreak);
      }
      if (payoutRatio > 1) aboveBet += 1;
      if (payoutRatio >= 10) bigWins += 1;
      if (round.bonus_triggered) bonuses += 1;
    }
    if (currentMissStreak > 0) missStreaks += 1;

    return {
      layout_mode: layoutMode,
      risk, lines, pucks,
      rounds_played: rounds,
      average_round_duration: totalDuration / rounds,
      hit_frequency: hits / rounds,
      win_above_bet_frequency: aboveBet / rounds,
      miss_streaks: missStreaks,
      longest_miss_streak: longestMissStreak,
      average_payout: payoutSum / rounds,
      big_win_count: bigWins,
      bonus_count: bonuses,
      visible_multiplier_density: config.layout_metrics.visible_multiplier_density,
      player_perceived_empty_density: config.layout_metrics.empty_cell_density
    };
  }

  const HEADERS = [
    "layout_mode", "risk", "lines", "pucks", "rounds_played", "average_round_duration",
    "hit_frequency", "win_above_bet_frequency", "miss_streaks", "longest_miss_streak",
    "average_payout", "big_win_count", "bonus_count", "visible_multiplier_density",
    "player_perceived_empty_density"
  ];

  function toCsv(rows) {
    const escape = (value) => /[",\n]/.test(String(value))
      ? `"${String(value).replaceAll('"', '""')}"` : String(value);
    return [HEADERS, ...rows.map((row) => HEADERS.map((header) => row[header]))]
      .map((row) => row.map(escape).join(",")).join("\n") + "\n";
  }

  return { HEADERS, estimateRoundDuration, runGameplayTest, toCsv };
});
