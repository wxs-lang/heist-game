// Guards and cameras: patrol routes, suspicion, investigation and chase.
// A guard never teleports and never knows where the thief is unless it (or
// a camera) actually saw them — or a coin rang out nearby.
import { GUARD, VISION } from './config.js';
import {
  angleDifference, cameraFillPerSecond, guardFillPerSecond, watchStrength,
} from './vision.js';
import { moveCircle } from './physics.js';

function turnToward(current, target, maxStep) {
  let d = target - current;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

function stepTowardGuard(g, tx, ty, speed, dt, walls) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return 0;
  const step = Math.min(dist, speed * dt);
  const nx = (dx / dist) * step;
  const ny = (dy / dist) * step;
  g.angle = turnToward(g.angle, Math.atan2(dy, dx), 6 * dt);
  moveCircle(g, nx, ny, GUARD.radius, walls);
  return dist;
}

function updateGuard(g, state, job, dt, walls) {
  const player = state.player;
  const strength = watchStrength(
    g.x, g.y, g.angle, VISION.guardRange, VISION.guardHalfAngle,
    player.x, player.y, walls,
  );
  let fill = 0;
  if (strength > 0) {
    g.lastSeen = { x: player.x, y: player.y };
    g.heat = Math.min(100, g.heat + strength * 95 * dt);
    fill = guardFillPerSecond(strength, player.sneaking);
  } else {
    g.heat = Math.max(0, g.heat - 13 * dt);
  }

  // A ringing coin pulls the guard off patrol to look.
  if (g.investigate && g.state !== 'chase') {
    g.state = 'investigate';
    const dist = stepTowardGuard(g, g.investigate.x, g.investigate.y, GUARD.investigateSpeed, dt, walls);
    if (dist < 14) {
      g.investigateTimer += dt;
      g.angle += dt * 1.4;
      if (g.investigateTimer > 2.5) {
        g.investigate = null;
        g.state = 'patrol';
        g.heat = Math.max(0, g.heat - 20);
      }
    }
    if (g.heat >= VISION.chaseAt && strength > 0) g.state = 'chase';
    return fill;
  }

  if (g.heat >= VISION.chaseAt && strength > 0) {
    g.state = 'chase';
    stepTowardGuard(g, player.x, player.y, GUARD.chaseSpeed, dt, walls);
    return fill;
  }

  if (g.heat >= VISION.suspectAt) {
    g.state = 'suspect';
    if (g.lastSeen) {
      const dist = stepTowardGuard(g, g.lastSeen.x, g.lastSeen.y, GUARD.suspectSpeed, dt, walls);
      if (dist < 12) {
        // Reached the last seen spot and found nothing: look around, cool off.
        g.angle += dt * 1.8;
        g.heat = Math.max(VISION.suspectAt - 1, g.heat - 9 * dt);
      }
    }
    if (g.heat < VISION.suspectAt) g.state = 'patrol';
    return fill;
  }

  // Patrol: walk the waypoints, pausing at each to look around.
  g.state = 'patrol';
  if (g.pauseTimer > 0) {
    g.pauseTimer -= dt;
    g.angle += dt * 0.9;
    return fill;
  }
  const target = g.waypoints[g.waypointIndex];
  const dist = stepTowardGuard(g, target[0], target[1], GUARD.patrolSpeed, dt, walls);
  if (dist < 8) {
    g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
    g.pauseTimer = 0.8;
  }
  return fill;
}

function updateCamera(c, state, dt, walls) {
  c.angle = c.baseAngle + Math.sin(state.jobTime * c.speed + c.phase) * c.sweep;
  const strength = watchStrength(
    c.x, c.y, c.angle, VISION.cameraRange, VISION.cameraHalfAngle,
    state.player.x, state.player.y, walls,
  );
  if (strength <= 0) return 0;
  return cameraFillPerSecond(strength, state.player.sneaking);
}

/**
 * Advance every guard and camera one step. Returns the alarm fill per
 * second the thief earned this step (0 when nobody sees them).
 */
export function updateWatchers(state, job, dt, walls) {
  let fill = 0;
  for (const g of state.guards) fill += updateGuard(g, state, job, dt, walls);
  for (const c of state.cameras) fill += updateCamera(c, state, dt, walls);
  void job;
  return fill;
}

export { angleDifference };
