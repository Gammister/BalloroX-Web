(function initTrajectoryPlanner(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PuckLuckTrajectoryPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTrajectoryPlanner() {
  "use strict";

  const FIXED_TIMESTEP = 1 / 120;
  const REFERENCE_HALF_PX = 300;
  const NORMALIZED_FORCE = 1250 / REFERENCE_HALF_PX;
  const STOP_SPEED = 0.08;
  const ANGLE_MIN = -48;
  const ANGLE_MAX = 48;
  const POCKET_CAPTURE_RADIUS_MULTIPLIER = 1.6;
  const POCKET_CENTERS = Object.freeze([
    Object.freeze({ id: "top", x: -1, y: -1 }),
    Object.freeze({ id: "right", x: 1, y: -1 }),
    Object.freeze({ id: "bottom", x: 1, y: 1 }),
    Object.freeze({ id: "left", x: -1, y: 1 })
  ]);

  function round(value, digits = 6) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
  }
  function normalizeAngle(value) {
    let angle = value;
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
  function foldCoordinate(unfolded, min, max) {
    const width = max - min;
    const q = (unfolded - min) / width;
    const tile = Math.floor(q);
    const fraction = q - tile;
    const even = ((tile % 2) + 2) % 2 === 0;
    return { value: even ? min + fraction * width : max - fraction * width, tile, direction: even ? 1 : -1 };
  }
  function targetImages(target, min, max) {
    const width = max - min;
    const t = (target - min) / width;
    const images = [];
    for (let n = -8; n <= 1; n += 1) {
      images.push(min + (2 * n + t) * width);
      images.push(min + (2 * n + 1 - t) * width);
    }
    return [...new Set(images.map((value) => round(value, 10)))];
  }
  function geometricSum(ratio, count) {
    if (Math.abs(1 - ratio) < 1e-12) return count;
    return (1 - ratio ** count) / (1 - ratio);
  }
  function solveDamping(requiredSum, frameCount) {
    if (requiredSum <= 1 || requiredSum >= frameCount) return null;
    let low = 0;
    let high = 0.999999999;
    for (let i = 0; i < 80; i += 1) {
      const middle = (low + high) / 2;
      if (geometricSum(middle, frameCount) < requiredSum) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  function sectorCenter(lines, sector) {
    return {
      x: -1 + (sector.col + 0.5) * 2 / lines,
      y: -1 + (sector.row + 0.5) * 2 / lines
    };
  }
  function sectorFromPoint(lines, x, y) {
    return {
      col: Math.max(0, Math.min(lines - 1, Math.floor((x + 1) * lines / 2))),
      row: Math.max(0, Math.min(lines - 1, Math.floor((y + 1) * lines / 2)))
    };
  }
  function countCrossings(startQ, endQ) {
    return Math.abs(Math.floor(endQ) - Math.floor(startQ));
  }

  function pointToSegmentDistance(point, start, end) {
    const dx = end[1] - start[1];
    const dy = end[2] - start[2];
    const lengthSquared = dx * dx + dy * dy;
    const projection = lengthSquared > 0
      ? Math.max(0, Math.min(1, ((point.x - start[1]) * dx + (point.y - start[2]) * dy) / lengthSquared))
      : 0;
    return Math.hypot(start[1] + dx * projection - point.x, start[2] + dy * projection - point.y);
  }

  function segmentCircleFirstIntersection(start, end, center, radius) {
    const dx = end[1] - start[1];
    const dy = end[2] - start[2];
    const fx = start[1] - center.x;
    const fy = start[2] - center.y;
    const a = dx * dx + dy * dy;
    if (fx * fx + fy * fy <= radius * radius) return 0;
    if (a <= 1e-14) return null;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    const root = Math.sqrt(discriminant);
    const first = (-b - root) / (2 * a);
    const second = (-b + root) / (2 * a);
    if (first >= 0 && first <= 1) return first;
    return second >= 0 && second <= 1 ? second : null;
  }

  function minimumPocketDistance(frames, pockets = POCKET_CENTERS) {
    if (!frames?.length || !pockets?.length) return Infinity;
    let minimum = Infinity;
    for (const pocket of pockets) {
      let armed = Math.hypot(frames[0][1] - pocket.x, frames[0][2] - pocket.y) > 1e-6;
      for (let index = 1; index < frames.length; index += 1) {
        if (!armed) {
          if (Math.hypot(frames[index][1] - pocket.x, frames[index][2] - pocket.y) > 1e-6) armed = true;
          continue;
        }
        minimum = Math.min(minimum, pointToSegmentDistance(pocket, frames[index - 1], frames[index]));
      }
    }
    return minimum;
  }

  function trajectoryClearsPockets(frames, puckRadius, pockets = POCKET_CENTERS,
    clearanceMultiplier = POCKET_CAPTURE_RADIUS_MULTIPLIER) {
    if (!frames?.length || !pockets?.length) return true;
    const clearance = puckRadius * clearanceMultiplier;
    return pockets.every((pocket) => {
      let armed = Math.hypot(frames[0][1] - pocket.x, frames[0][2] - pocket.y) > clearance;
      for (let index = 1; index < frames.length; index += 1) {
        if (!armed) {
          if (Math.hypot(frames[index][1] - pocket.x, frames[index][2] - pocket.y) > clearance) armed = true;
          continue;
        }
        if (pointToSegmentDistance(pocket, frames[index - 1], frames[index]) <= clearance) return false;
      }
      return true;
    });
  }

  const VISUAL_PHYSICS = Object.freeze({
    launch_force_multiplier: 1.25,
    visual_launch_force: 9000,
    friction_multiplier: 1.15,
    max_round_duration_seconds: 3.2,
    preferred_round_duration_seconds: [1.8, 2.8],
    min_bounces: 4,
    max_bounces: 8
  });

  function buildCandidate({
    lines,
    puckRadius,
    targetSector,
    targetPoint,
    xImage,
    yImage,
    launchForce,
    desiredDuration,
    startPoint = null,
    allowAnyDirection = false,
    angleCenter = -135,
    angleMin = ANGLE_MIN,
    angleMax = ANGLE_MAX
  }) {
    const min = -1 + puckRadius;
    const max = 1 - puckRadius;
    const width = max - min;
    const defaultStart = 1 - puckRadius * 1.8;
    const startX = Math.max(min, Math.min(max, startPoint?.x ?? defaultStart));
    const startY = Math.max(min, Math.min(max, startPoint?.y ?? defaultStart));
    const dx = xImage - startX;
    const dy = yImage - startY;
    if (!allowAnyDirection && (dx >= 0 || dy >= 0)) return null;
    const length = Math.hypot(dx, dy);
    if (length <= 1e-9) return null;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const angleOffset = normalizeAngle(angle - angleCenter);
    if (angleOffset < angleMin || angleOffset > angleMax) return null;
    const startQX = (startX - min) / width;
    const startQY = (startY - min) / width;
    const xQ = (xImage - min) / width;
    const yQ = (yImage - min) / width;
    const expectedBounces = countCrossings(startQX, xQ) + countCrossings(startQY, yQ);
    if (expectedBounces < VISUAL_PHYSICS.min_bounces || expectedBounces > VISUAL_PHYSICS.max_bounces) return null;
    const normalizedForce = launchForce / REFERENCE_HALF_PX;
    const requiredSum = length / (normalizedForce * FIXED_TIMESTEP);
    const frameCount = Math.max(Math.ceil(requiredSum) + 12, Math.round(desiredDuration / FIXED_TIMESTEP));
    if (frameCount * FIXED_TIMESTEP > VISUAL_PHYSICS.max_round_duration_seconds) return null;
    const damping = solveDamping(requiredSum, frameCount);
    if (!damping) return null;
    const finalSpeed = normalizedForce * damping ** frameCount;
    const duration = frameCount * FIXED_TIMESTEP;
    const score = Math.abs(duration - desiredDuration) + Math.abs(angleOffset) * 0.001 + expectedBounces * 0.004 + finalSpeed;
    return { lines, puckRadius, targetSector, min, max, startX, startY, dx, dy, length, angle, angleOffset,
      expectedBounces, requiredSum, frameCount, damping, finalSpeed, duration, score, normalizedForce, targetPoint };
  }

  function recordCandidate(candidate) {
    const frames = [];
    const unitX = candidate.dx / candidate.length;
    const unitY = candidate.dy / candidate.length;
    const startX = candidate.startX ?? candidate.start;
    const startY = candidate.startY ?? candidate.start;
    let previousXTile = foldCoordinate(startX, candidate.min, candidate.max).tile;
    let previousYTile = foldCoordinate(startY, candidate.min, candidate.max).tile;
    let bounceCount = 0;
    const bouncePoints = [];
    for (let frame = 0; frame <= candidate.frameCount; frame += 1) {
      const distance = candidate.normalizedForce * FIXED_TIMESTEP * geometricSum(candidate.damping, frame);
      const ratio = Math.min(1, distance / candidate.length);
      const unfoldedX = startX + candidate.dx * ratio;
      const unfoldedY = startY + candidate.dy * ratio;
      const foldedX = foldCoordinate(unfoldedX, candidate.min, candidate.max);
      const foldedY = foldCoordinate(unfoldedY, candidate.min, candidate.max);
      if (frame > 0) {
        const xCrossings = Math.abs(foldedX.tile - previousXTile);
        const yCrossings = Math.abs(foldedY.tile - previousYTile);
        if (xCrossings || yCrossings) {
          bounceCount += xCrossings + yCrossings;
          bouncePoints.push([round(frame * FIXED_TIMESTEP, 4), round(foldedX.value), round(foldedY.value), bounceCount]);
        }
      }
      previousXTile = foldedX.tile;
      previousYTile = foldedY.tile;
      const speed = candidate.normalizedForce * candidate.damping ** frame;
      frames.push([
        round(frame * FIXED_TIMESTEP, 4),
        round(foldedX.value),
        round(foldedY.value),
        round(speed * unitX * foldedX.direction),
        round(speed * unitY * foldedY.direction),
        bounceCount
      ]);
    }
    const finalFrame = frames[frames.length - 1];
    const target = candidate.targetPoint;
    const correction = Math.hypot(finalFrame[1] - target.x, finalFrame[2] - target.y) * REFERENCE_HALF_PX;
    const finalSector = sectorFromPoint(candidate.lines, finalFrame[1], finalFrame[2]);
    const valid = bounceCount >= VISUAL_PHYSICS.min_bounces
      && bouncePoints.length >= VISUAL_PHYSICS.min_bounces
      && finalSector.col === candidate.targetSector.col
      && finalSector.row === candidate.targetSector.row
      && correction <= 1
      && candidate.finalSpeed <= STOP_SPEED;
    return { frames, bouncePoints, bounceCount, correction, finalSector, valid };
  }

  function planTrajectory({
    lines,
    puckRadius,
    targetSector,
    seed = 1,
    launchForce = VISUAL_PHYSICS.visual_launch_force,
    landingPoint = null,
    candidateOffset = 0,
    desiredDuration = null,
    startPoint = null,
    allowAnyDirection = false,
    angleCenter = -135,
    angleMin = ANGLE_MIN,
    angleMax = ANGLE_MAX
  }) {
    const min = -1 + puckRadius;
    const max = 1 - puckRadius;
    const target = landingPoint || sectorCenter(lines, targetSector);
    const durationTarget = desiredDuration || (VISUAL_PHYSICS.preferred_round_duration_seconds[0]
      + ((seed >>> 8) % 1000) / 1000 * (VISUAL_PHYSICS.preferred_round_duration_seconds[1] - VISUAL_PHYSICS.preferred_round_duration_seconds[0]));
    const defaultStart = 1 - puckRadius * 1.8;
    const startX = startPoint?.x ?? defaultStart;
    const startY = startPoint?.y ?? defaultStart;
    const xImages = targetImages(target.x, min, max)
      .filter((value) => allowAnyDirection || value < startX);
    const yImages = targetImages(target.y, min, max)
      .filter((value) => allowAnyDirection || value < startY);
    const candidates = [];
    for (const xImage of xImages) for (const yImage of yImages) {
      const candidate = buildCandidate({
        lines,
        puckRadius,
        targetSector,
        targetPoint: target,
        xImage,
        yImage,
        launchForce,
        desiredDuration: durationTarget,
        startPoint,
        allowAnyDirection,
        angleCenter,
        angleMin,
        angleMax
      });
      if (candidate) candidates.push(candidate);
    }
    candidates.sort((a, b) => a.score - b.score);
    const variantCount = Math.min(8, candidates.length);
    const offset = variantCount ? ((seed >>> 0) + candidateOffset) % variantCount : 0;
    const ordered = candidates.slice(offset, variantCount).concat(candidates.slice(0, offset), candidates.slice(variantCount));
    for (const candidate of ordered) {
      const replay = recordCandidate(candidate);
      if (!replay.valid) continue;
      return {
        valid: true,
        start_point: { x: round(startX), y: round(startY) },
        target_sector: { ...targetSector },
        landing_point: { x: round(target.x), y: round(target.y) },
        final_sector: replay.finalSector,
        puck_radius: puckRadius,
        launch_force: launchForce,
        launch_angle_degrees: round(candidate.angleOffset, 4),
        seed: seed >>> 0,
        damping_per_step: round(candidate.damping, 10),
        fixed_timestep: FIXED_TIMESTEP,
        bounce_count: replay.bounceCount,
        duration: round(candidate.duration, 4),
        final_speed: round(candidate.finalSpeed),
        final_correction_px: 0,
        numerical_closure_error_px: round(replay.correction),
        candidate_count: candidates.length,
        bounce_points: replay.bouncePoints,
        frames: replay.frames
      };
    }
    return {
      valid: false,
      target_sector: { ...targetSector },
      puck_radius: puckRadius,
      launch_force: launchForce,
      seed: seed >>> 0,
      candidate_count: candidates.length,
      unreachable_reason: candidates.length ? "no_candidate_within_one_pixel" : "no_angle_with_four_wall_hits"
    };
  }

  function findStarCandidates(trajectory, lines, puckRadius) {
    const threshold = puckRadius + puckRadius * 0.56;
    const bestByCell = new Map();
    for (let index = 1; index < trajectory.frames.length - 1; index += 1) {
      const frame = trajectory.frames[index];
      const sector = sectorFromPoint(lines, frame[1], frame[2]);
      const center = sectorCenter(lines, sector);
      const distance = Math.hypot(frame[1] - center.x, frame[2] - center.y);
      const key = `${sector.col}_${sector.row}`;
      const current = bestByCell.get(key);
      if (distance <= threshold && (!current || distance < current.distance)) {
        const progress = index / (trajectory.frames.length - 1);
        const bounceCount = frame[5];
        let phase = "before_first_bounce";
        if (progress >= 0.85) phase = "final_slowdown";
        else if (bounceCount >= 4) phase = "late";
        else if (bounceCount >= 2) phase = "after_2_3_bounces";
        else if (bounceCount === 1) phase = "after_1_bounce";
        bestByCell.set(key, {
          x: frame[1], y: frame[2], col: sector.col, row: sector.row,
          frame_index: index, t: frame[0], distance, bounce_count: bounceCount, phase
        });
      }
    }
    return [...bestByCell.values()].sort((a, b) => a.t - b.t);
  }

  function landingPointForVariant(lines, puckRadius, targetSector, seed, variantIndex) {
    const cell = 2 / lines;
    const center = sectorCenter(lines, targetSector);
    const margin = puckRadius + 2 / REFERENCE_HALF_PX;
    const available = Math.max(0, cell / 2 - margin);
    let value = (seed ^ Math.imul(variantIndex + 1, 0x9e3779b1)) >>> 0;
    const random = () => {
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      return (value >>> 0) / 4294967296;
    };
    const bucketRoll = variantIndex % 50;
    let x = 0;
    let y = 0;
    let bucket = "broad";
    if (bucketRoll === 0) {
      bucket = "center";
      x = (random() - 0.5) * available * 0.12;
      y = (random() - 0.5) * available * 0.12;
    } else if (bucketRoll % 2 === 0) {
      bucket = "edge";
      const angle = random() * Math.PI * 2;
      const radius = available * (0.88 + random() * 0.11);
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    } else {
      x = (random() * 2 - 1) * available * 0.94;
      y = (random() * 2 - 1) * available * 0.94;
    }
    return { x: center.x + x, y: center.y + y, bucket };
  }

  function descriptorFromTrajectory(trajectory, id) {
    const last = trajectory.frames[trajectory.frames.length - 1];
    return {
      id,
      target_sector: trajectory.target_sector,
      landing_point: trajectory.landing_point,
      landing_bucket: trajectory.landing_bucket,
      puck_radius: trajectory.puck_radius,
      launch_force: trajectory.launch_force,
      launch_angle_degrees: trajectory.launch_angle_degrees,
      seed: trajectory.seed,
      damping_per_step: trajectory.damping_per_step,
      fixed_timestep: trajectory.fixed_timestep,
      bounce_count: trajectory.bounce_count,
      duration: trajectory.duration,
      final_speed: trajectory.final_speed,
      final_correction_px: trajectory.final_correction_px,
      numerical_closure_error_px: trajectory.numerical_closure_error_px,
      candidate_count: trajectory.candidate_count,
      bounce_points: trajectory.bounce_points,
      final_frame: last
    };
  }

  function hydrateTrajectory(descriptor) {
    const target = descriptor.landing_point;
    const min = -1 + descriptor.puck_radius;
    const max = 1 - descriptor.puck_radius;
    const start = 1 - descriptor.puck_radius * 1.8;
    const angle = (-135 + descriptor.launch_angle_degrees) * Math.PI / 180;
    const unitX = Math.cos(angle);
    const unitY = Math.sin(angle);
    const normalizedForce = descriptor.launch_force / REFERENCE_HALF_PX;
    const frameCount = Math.round(descriptor.duration / descriptor.fixed_timestep);
    const totalDistance = normalizedForce * descriptor.fixed_timestep * geometricSum(descriptor.damping_per_step, frameCount);
    const candidate = {
      lines: descriptor.lines,
      puckRadius: descriptor.puck_radius,
      targetSector: descriptor.target_sector,
      targetPoint: target,
      min, max, start,
      dx: unitX * totalDistance,
      dy: unitY * totalDistance,
      length: totalDistance,
      normalizedForce,
      damping: descriptor.damping_per_step,
      frameCount,
      finalSpeed: descriptor.final_speed
    };
    const replay = recordCandidate(candidate);
    return { ...descriptor, valid: replay.valid, final_sector: replay.finalSector, frames: replay.frames, bounce_points: replay.bouncePoints };
  }

  function selectTrajectoryDescriptor(variants, seed, recentIds = [], usage = {}, recentHistorySize = 20) {
    if (!variants.length) return null;
    const recent = new Set(recentIds.slice(-recentHistorySize));
    const fresh = variants.filter((item) => !recent.has(item.id));
    const pool = fresh.length ? fresh : variants;
    const minimumUsage = Math.min(...pool.map((item) => usage[item.id] || 0));
    const preferred = pool.filter((item) => (usage[item.id] || 0) <= minimumUsage + 1);
    let value = (seed >>> 0) || 0x6d2b79f5;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    return preferred[(value >>> 0) % preferred.length];
  }

  return { FIXED_TIMESTEP, REFERENCE_HALF_PX, NORMALIZED_FORCE, VISUAL_PHYSICS,
    POCKET_CAPTURE_RADIUS_MULTIPLIER, POCKET_CENTERS, segmentCircleFirstIntersection,
    minimumPocketDistance, trajectoryClearsPockets,
    planTrajectory, sectorCenter,
    sectorFromPoint, findStarCandidates, landingPointForVariant, descriptorFromTrajectory, hydrateTrajectory,
    selectTrajectoryDescriptor };
});
