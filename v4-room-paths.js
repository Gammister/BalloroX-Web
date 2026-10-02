'use strict';

// Shared deterministic room replay. V4 stores only physical launch parameters;
// the selected replay is reconstructed once per room shot.
(function(root) {
  function simulate(angle, force, damping, radius) {
    let u = 0.82, v = 0.82;
    const radians = angle * Math.PI / 180;
    let vu = -Math.cos(radians) * force / 300;
    let vv = -Math.sin(radians) * force / 300;
    const boundary = 1 - Math.max(0.08, Math.min(0.22, radius / 0.4));
    const frames = [];
    for (let step = 1; step < 2400; step += 1) {
      u += vu / 120; v += vv / 120;
      let hit = 0;
      if (u < -boundary || u > boundary) { u = Math.max(-boundary, Math.min(boundary, u)); vu *= -0.88; hit = 1; }
      if (v < -boundary || v > boundary) { v = Math.max(-boundary, Math.min(boundary, v)); vv *= -0.88; hit = 1; }
      vu *= damping; vv *= damping;
      frames.push([u, v, vu, vv, hit]);
      if (step / 120 >= 0.35 && Math.hypot(vu, vv) <= 0.1) break;
    }
    return frames;
  }
  const api = Object.freeze({ simulate });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BalloroV4RoomPaths = api;
})(typeof window !== 'undefined' ? window : null);
