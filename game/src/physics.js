// Circle-vs-wall physics shared by the thief and the guards: axis-separated
// movement, so a body slides along a wall instead of sticking to it.
function circleHitsWalls(x, y, radius, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/** Move a circle with axis separation so it slides along walls. */
export function moveCircle(body, dx, dy, radius, walls) {
  const nx = body.x + dx;
  if (!circleHitsWalls(nx, body.y, radius, walls)) body.x = nx;
  const ny = body.y + dy;
  if (!circleHitsWalls(body.x, ny, radius, walls)) body.y = ny;
}

export { circleHitsWalls };
