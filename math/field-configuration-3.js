(function initBalloroFieldConfiguration3(root, factory) {
  const configuration = factory();
  if (typeof module === "object" && module.exports) module.exports = configuration;
  if (root) root.BalloroFieldConfiguration3 = configuration;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFieldConfiguration3() {
  "use strict";

  const sourceLayouts = {
    5: [
      1, 0, 0, 0, 1,
      0, 1, 4, 2, 0,
      0, 4, 2, 4, 0,
      0, 2, 4, 1, 0,
      1, 0, 0, 0, 1
    ],
    6: [
      1, 0, 0, 0, 0, 1,
      0, 1, 4, 4, 2, 0,
      0, 4, 2, 2, 4, 0,
      0, 4, 2, 2, 4, 0,
      0, 2, 4, 4, 1, 0,
      1, 0, 0, 0, 0, 1
    ],
    7: [
      1, 0, 0, 0, 0, 0, 1,
      0, 1, 4, 0, 4, 1, 0,
      0, 4, 2, 2, 2, 4, 0,
      0, 0, 2, 3, 2, 0, 0,
      0, 4, 2, 2, 2, 4, 0,
      0, 1, 4, 0, 4, 1, 0,
      1, 0, 0, 0, 0, 0, 1
    ],
    8: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 4, 0, 0, 4, 1, 0,
      0, 4, 2, 1, 1, 2, 4, 0,
      0, 0, 1, 2, 3, 1, 0, 0,
      0, 0, 1, 3, 2, 1, 0, 0,
      0, 4, 2, 1, 1, 2, 4, 0,
      0, 1, 4, 0, 0, 4, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ],
    9: [
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 4, 0, 0, 0, 0,
      0, 0, 1, 1, 2, 1, 1, 0, 0,
      0, 0, 1, 2, 3, 2, 1, 0, 0,
      0, 4, 2, 3, 4, 3, 2, 4, 0,
      0, 0, 1, 2, 3, 2, 1, 0, 0,
      0, 0, 1, 1, 2, 1, 1, 0, 0,
      0, 0, 0, 0, 4, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    10: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 4, 1, 1, 4, 0, 0, 0,
      0, 0, 4, 2, 2, 2, 2, 4, 0, 0,
      0, 0, 1, 2, 3, 3, 2, 1, 0, 0,
      0, 0, 1, 2, 3, 3, 2, 1, 0, 0,
      0, 0, 4, 2, 2, 2, 2, 4, 0, 0,
      0, 0, 0, 4, 1, 1, 4, 0, 0, 0,
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
    id: 3,
    selectedLine: 10,
    layouts
  });
});
