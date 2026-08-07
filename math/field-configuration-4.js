(function initBalloroFieldConfiguration4(root, factory) {
  const configuration = factory();
  if (typeof module === "object" && module.exports) module.exports = configuration;
  if (root) root.BalloroFieldConfiguration4 = configuration;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFieldConfiguration4() {
  "use strict";

  const sourceLayouts = {
    5: [
      1, 4, 4, 4, 1,
      4, 1, 0, 1, 4,
      4, 0, 2, 0, 4,
      4, 1, 0, 1, 4,
      1, 4, 4, 4, 1
    ],
    6: [
      1, 4, 4, 4, 4, 1,
      4, 1, 0, 0, 1, 4,
      4, 0, 2, 2, 0, 4,
      4, 0, 2, 2, 0, 4,
      4, 1, 0, 0, 1, 4,
      1, 4, 4, 4, 4, 1
    ],
    7: [
      1, 4, 4, 4, 4, 4, 1,
      4, 1, 0, 0, 0, 1, 4,
      4, 0, 1, 2, 1, 0, 4,
      4, 0, 2, 3, 2, 0, 4,
      4, 0, 1, 2, 1, 0, 4,
      4, 1, 0, 0, 0, 1, 4,
      1, 4, 4, 4, 4, 4, 1
    ],
    8: [
      1, 4, 4, 4, 4, 4, 4, 1,
      4, 1, 0, 0, 0, 0, 1, 4,
      4, 0, 2, 0, 0, 2, 0, 4,
      4, 0, 0, 2, 3, 0, 0, 4,
      4, 0, 0, 3, 2, 0, 0, 4,
      4, 0, 2, 0, 0, 2, 0, 4,
      4, 1, 0, 0, 0, 0, 1, 4,
      1, 4, 4, 4, 4, 4, 4, 1
    ],
    9: [
      1, 4, 4, 4, 4, 4, 4, 4, 1,
      4, 2, 0, 0, 0, 0, 0, 2, 4,
      4, 0, 2, 0, 0, 0, 2, 0, 4,
      4, 0, 0, 2, 2, 3, 0, 0, 4,
      4, 0, 0, 2, 3, 2, 0, 0, 4,
      4, 0, 0, 3, 2, 2, 0, 0, 4,
      4, 0, 2, 0, 0, 0, 2, 0, 4,
      4, 2, 0, 0, 0, 0, 0, 2, 4,
      1, 4, 4, 4, 4, 4, 4, 4, 1
    ],
    10: [
      1, 4, 4, 4, 4, 4, 4, 4, 4, 1,
      4, 2, 0, 0, 0, 0, 0, 0, 2, 4,
      4, 0, 2, 0, 0, 0, 0, 2, 0, 4,
      4, 0, 0, 2, 0, 0, 2, 0, 0, 4,
      4, 0, 0, 0, 3, 3, 0, 0, 0, 4,
      4, 0, 0, 0, 3, 3, 0, 0, 0, 4,
      4, 0, 0, 2, 0, 0, 2, 0, 0, 4,
      4, 0, 2, 0, 0, 0, 0, 2, 0, 4,
      4, 2, 0, 0, 0, 0, 0, 0, 2, 4,
      1, 4, 4, 4, 4, 4, 4, 4, 4, 1
    ]
  };
  const layouts = Object.freeze(Object.fromEntries(Object.entries(sourceLayouts).map(([lines, cells]) => [
    lines,
    Object.freeze(Array.from({ length: Number(lines) ** 2 }, (_, index) => Number(cells[index]) || 0))
  ])));

  return Object.freeze({
    schema: "balloro-x3000-field-configuration",
    version: 2,
    id: 4,
    selectedLine: 10,
    layouts
  });
});
