(function initBalloroFieldConfiguration2(root, factory) {
  const configuration = factory();
  if (typeof module === "object" && module.exports) module.exports = configuration;
  if (root) root.BalloroFieldConfiguration2 = configuration;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFieldConfiguration2() {
  "use strict";

  const sourceLayouts = {
    5: [
      0, 0, 0, 0, 0,
      0, 2, 2, 1, 1,
      0, 2, 2, 1, 1,
      0, 1, 1, 4, 4,
      0, 1, 1, 4, 4
    ],
    6: [
      0, 0, 0, 0, 0, 0,
      0, 2, 2, 0, 1, 1,
      0, 2, 2, 0, 1, 1,
      0, 0, 0, 4, 4, 0,
      0, 1, 1, 4, 4, 0,
      0, 1, 1, 0, 0, 0
    ],
    7: [
      0, 0, 0, 0, 0, 0, 0,
      0, 3, 0, 2, 2, 1, 1,
      0, 0, 0, 2, 2, 1, 1,
      0, 2, 2, 4, 4, 0, 0,
      0, 2, 2, 4, 4, 0, 0,
      0, 1, 1, 0, 0, 4, 4,
      0, 1, 1, 0, 0, 4, 4
    ],
    8: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 3, 0, 2, 2, 0, 1, 1,
      0, 0, 2, 2, 2, 0, 1, 1,
      0, 2, 2, 0, 0, 0, 0, 0,
      0, 2, 2, 0, 4, 4, 0, 0,
      0, 0, 0, 0, 4, 4, 0, 0,
      0, 1, 1, 0, 0, 0, 4, 4,
      0, 1, 1, 0, 0, 0, 4, 4
    ],
    9: [
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 3, 3, 0, 2, 2, 0, 1, 1,
      0, 3, 3, 0, 2, 2, 0, 1, 1,
      0, 0, 0, 4, 4, 0, 0, 0, 0,
      0, 2, 2, 4, 4, 0, 0, 0, 0,
      0, 2, 2, 0, 0, 4, 4, 0, 0,
      0, 0, 0, 0, 0, 4, 4, 0, 0,
      0, 1, 1, 0, 0, 0, 4, 4, 0,
      0, 1, 1, 0, 0, 0, 4, 4, 0
    ],
    10: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 3, 3, 0, 0, 2, 2, 0, 1, 1,
      0, 3, 3, 0, 0, 2, 2, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 4, 4, 0, 0, 0, 0,
      0, 2, 2, 0, 4, 4, 0, 0, 0, 0,
      0, 2, 2, 0, 0, 0, 4, 4, 0, 0,
      0, 0, 0, 0, 0, 0, 4, 4, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 4, 4, 0,
      0, 1, 1, 0, 0, 0, 0, 4, 4, 0
    ]
  };
  const layouts = Object.freeze(Object.fromEntries(Object.entries(sourceLayouts).map(([lines, cells]) => [
    lines,
    Object.freeze(Array.from({ length: Number(lines) ** 2 }, (_, index) => Number(cells[index]) || 0))
  ])));

  return Object.freeze({
    schema: "balloro-x3000-field-configuration",
    version: 2,
    id: 2,
    selectedLine: 10,
    layouts
  });
});
