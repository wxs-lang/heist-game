// Line of sight and vision cones: the geometry every guard and camera
// reads before it decides it can see the thief.
import { VISION } from './config.js';

/** True when the segment (x1,y1)-(x2,y2) touches no wall rect. */
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, walls[i])) return false;
  }
  return true;
}

// Slab test: does the segment enter the rect's interior?
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 <= r.x || x1 >= r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 <= r.y || y1 >= r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** Smallest absolute angle between two headings, 0..PI. */
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/**
 * How strongly a watcher at (wx,wy) facing `angle` sees the thief:
 * 0 when out of range, outside the cone or behind a wall, rising toward 1
 * as the thief closes in. `range` and `halfAngle` describe the cone.
 */
export function watchStrength(wx, wy, angle, range, halfAngle, tx, ty, walls) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (dist > 1 && angleDifference(Math.atan2(dy, dx), angle) > halfAngle) return 0;
  if (!hasLineOfSight(wx, wy, tx, ty, walls)) return 0;
  return 1 - (dist / range) * 0.65;
}

/** Alarm fill per second for a guard watching with this strength. */
export function guardFillPerSecond(strength, sneaking) {
  const fill = VISION.guardFillFar + (VISION.guardFillNear - VISION.guardFillFar) * strength;
  return sneaking ? fill * VISION.sneakFactor : fill;
}

/** Alarm fill per second for a camera watching with this strength. */
export function cameraFillPerSecond(strength, sneaking) {
  const fill = VISION.cameraFill * (0.4 + 0.6 * strength);
  return sneaking ? fill * VISION.sneakFactor : fill;
}
