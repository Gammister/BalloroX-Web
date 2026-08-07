(function initBalloroFieldConfiguration1(root, factory) {
  const configuration = factory();
  if (typeof module === "object" && module.exports) module.exports = configuration;
  if (root) root.BalloroFieldConfiguration1 = configuration;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFieldConfiguration1() {
  "use strict";

  const sourceLayouts = {
    5: [
      0, 4, 4, 4, 0,
      4, 1, 1, 1, 4,
      4, 1, 2, 1, 4,
      4, 1, 1, 1, 4,
      0, 4, 4, 4, 0
    ],
    6: [
      0, 4, 4, 4, 0, 0,
      4, 1, 1, 1, 0, 0,
      4, 1, 2, 1, 1, 4,
      4, 1, 1, 2, 1, 4,
      0, 0, 1, 1, 1, 4,
      0, 0, 4, 4, 4, 0
    ],
    7: [
      0, 0, 4, 0, 0, 0, 0,
      0, 4, 1, 1, 4, 4, 0,
      4, 1, 2, 2, 2, 4, 0,
      0, 1, 2, 3, 2, 1, 0,
      0, 4, 2, 2, 2, 1, 4,
      0, 4, 4, 1, 1, 4, 0,
      0, 0, 0, 0, 4, 0, 0
    ],
    8: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 4, 4, 4, 0, 0, 0,
      0, 4, 1, 2, 2, 1, 0, 0,
      0, 4, 2, 3, 1, 2, 4, 0,
      0, 4, 2, 1, 3, 2, 4, 0,
      0, 0, 1, 2, 2, 1, 4, 0,
      0, 0, 0, 4, 4, 4, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ],
    9: [
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 4, 4, 4, 0, 0, 0,
      0, 0, 0, 1, 2, 1, 0, 0, 0,
      0, 4, 1, 2, 3, 2, 1, 4, 0,
      0, 4, 2, 3, 2, 3, 2, 4, 0,
      0, 4, 1, 2, 3, 2, 1, 4, 0,
      0, 0, 0, 1, 2, 1, 0, 0, 0,
      0, 0, 0, 4, 4, 4, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    10: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 4, 4, 1, 1, 4, 4, 0, 0,
      0, 0, 4, 2, 2, 2, 2, 4, 0, 0,
      0, 0, 1, 2, 3, 3, 2, 1, 0, 0,
      0, 0, 1, 2, 3, 3, 2, 1, 0, 0,
      0, 0, 4, 2, 2, 2, 2, 4, 0, 0,
      0, 0, 4, 4, 1, 1, 4, 4, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]
  };
  const layouts = Object.freeze(Object.fromEntries(Object.entries(sourceLayouts).map(([lines, cells]) => [
    lines,
    Object.freeze(Array.from({ length: Number(lines) ** 2 }, (_, index) => Number(cells[index]) || 0))
  ])));

  return Object.freeze({
    schema: "balloro-x3000-field-configuration",
    version: 2,
    id: 1,
    selectedLine: 5,
    layouts
  });
});
