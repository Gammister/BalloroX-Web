/* Presentation only. Never selects an outcome or changes a payout. */
window.BalloroMultiplierPresentation = Object.freeze({
  tier(value, purple = false, yellowBoost = false) {
    return purple ? 'purple' : value >= 10 ? 'red'
      : value >= 1 ? 'yellow' : 'green';
  },
  color(value, purple = false, yellowBoost = false) {
    return { purple: '#ca68ff', red: '#ff4b4b', yellow: '#ffd53d', green: '#64e66d' }[this.tier(value, purple, yellowBoost)];
  },
  premium(result) {
    const value = (Number(result?.multiplier) || 0)
      * (result?.x10Boosted || result?.purpleBoost ? 10 : 1);
    return value >= 10;
  }
});
