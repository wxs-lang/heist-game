// The world: one heist job's live state. Fixed-step simulation only —
// no drawing here — so the same seed and inputs always replay the same job.
import {
  CHANCES, COIN, GUARD, JOBS, LEVEL_BONUS, STEP, THIEF, VISION,
} from './config.js';
import { updateWatchers } from './guards.js';
import { moveCircle } from './physics.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_COIN = 'coin';
export const EVENT_CRACK = 'crack';
export const EVENT_CAUGHT = 'caught';
export const EVENT_LEVEL = 'level';
export const EVENT_WIN = 'win';
export const EVENT_GAMEOVER = 'gameover';
export const EVENT_ALARM = 'alarm';

function cloneLoot(job) {
  return job.loot.map((item) => ({ ...item, taken: false }));
}

function cloneGuards(job) {
  return job.guards.map((g) => ({
    waypoints: g.waypoints,
    x: g.waypoints[0][0],
    y: g.waypoints[0][1],
    angle: 0,
    waypointIndex: 1,
    pauseTimer: 0,
    state: 'patrol',
    heat: 0,
    lastSeen: null,
    investigate: null,
    investigateTimer: 0,
  }));
}

function cloneCameras(job) {
  return job.cameras.map((c) => ({ ...c, angle: c.baseAngle }));
}

/** Walls that block movement right now (a cracked vault door stops blocking). */
export function solidWalls(job, vaultOpen) {
  return job.walls.filter((w) => !(w.door === 'vault' && vaultOpen));
}

function clampToFloor(body, radius) {
  body.x = Math.max(14 + radius, Math.min(1266 - radius, body.x));
  body.y = Math.max(78 + radius, Math.min(706 - radius, body.y));
}

export function createWorld(random) {
  const state = {
    jobIndex: 0,
    score: 0,
    chances: CHANCES,
    alarm: 0,
    coins: COIN.startCount,
    coinCooldown: 0,
    time: 0,
    jobTime: 0,
    player: { x: 0, y: 0, angle: -Math.PI / 2, moving: false, sneaking: false },
    guards: [],
    cameras: [],
    loot: [],
    vaultOpen: false,
    crackProgress: 0,
    coin: null,
    noise: null,
    sparkles: [],
    events: [],
    alarmSounded: false,
  };
  let job = JOBS[0];

  function loadJob(index) {
    job = JOBS[index];
    state.jobIndex = index;
    state.jobTime = 0;
    state.player.x = job.entry.x;
    state.player.y = job.entry.y;
    state.player.angle = -Math.PI / 2;
    state.guards = cloneGuards(job);
    state.cameras = cloneCameras(job);
    state.loot = cloneLoot(job);
    state.vaultOpen = false;
    state.crackProgress = 0;
    state.coin = null;
    state.noise = null;
    state.alarm = 0;
    state.alarmSounded = false;
  }

  function lootLeft() {
    return state.loot.filter((item) => !item.taken).length;
  }

  function spawnSparkles(x, y) {
    for (let i = 0; i < 16; i += 1) {
      const angle = random.next() * Math.PI * 2;
      const speed = 40 + random.next() * 90;
      state.sparkles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttl: 0.5 + random.next() * 0.4,
        max: 0.9,
      });
    }
  }

  function throwCoin(target) {
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > COIN.range || state.coins <= 0 || state.coinCooldown > 0) return;
    state.coins -= 1;
    state.coinCooldown = COIN.cooldown;
    state.coin = {
      fromX: state.player.x, fromY: state.player.y,
      toX: target.x, toY: target.y,
      x: state.player.x, y: state.player.y,
      t: 0, flight: 0.35, landed: false,
    };
    state.events.push(EVENT_COIN);
  }

  function onCaught() {
    state.events.push(EVENT_CAUGHT);
    state.score = Math.max(0, state.score - 150);
  }

  function respawn() {
    state.chances -= 1;
    if (state.chances <= 0) {
      state.events.push(EVENT_GAMEOVER);
      return;
    }
    state.player.x = job.entry.x;
    state.player.y = job.entry.y;
    state.player.angle = -Math.PI / 2;
    state.guards = cloneGuards(job);
    state.cameras = cloneCameras(job);
    state.alarm = 25;
    state.alarmSounded = false;
    state.coin = null;
    state.noise = null;
    state.vaultOpen = false;
    state.crackProgress = 0;
  }

  function step(input, dt = STEP) {
    state.events = [];
    const walls = solidWalls(job, state.vaultOpen);
    state.time += dt;
    state.jobTime += dt;
    if (state.coinCooldown > 0) state.coinCooldown -= dt;

    // --- The thief moves (Shift = sneak: slower, harder to spot). ---
    const speed = input.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
    const moving = input.moveX !== 0 || input.moveY !== 0;
    state.player.moving = moving;
    state.player.sneaking = input.sneaking;
    if (moving) {
      state.player.angle = Math.atan2(input.moveY, input.moveX);
      moveCircle(state.player, input.moveX * speed * dt, input.moveY * speed * dt, THIEF.radius, walls);
      clampToFloor(state.player, THIEF.radius);
    }
    if (input.click) {
      throwCoin(input.click);
      input.click = null;
    }

    // --- A thrown coin arcs, lands, and rings out. ---
    if (state.coin) {
      const c = state.coin;
      c.t += dt;
      const k = Math.min(1, c.t / c.flight);
      c.x = c.fromX + (c.toX - c.fromX) * k;
      c.y = c.fromY + (c.toY - c.fromY) * k - Math.sin(k * Math.PI) * 26;
      if (k >= 1 && !c.landed) {
        c.landed = true;
        state.noise = { x: c.toX, y: c.toY, r: COIN.noiseRadius, ttl: 2.5 };
        for (const g of state.guards) {
          if (Math.hypot(g.x - c.toX, g.y - c.toY) < COIN.noiseRadius) {
            g.investigate = { x: c.toX, y: c.toY };
            g.investigateTimer = 0;
            g.heat = Math.max(g.heat, 40);
          }
        }
      }
      if (c.landed && c.t > c.flight + 0.4) state.coin = null;
    }
    if (state.noise) {
      state.noise.ttl -= dt;
      if (state.noise.ttl <= 0) state.noise = null;
    }

    // --- Cracking the vault door: stand at it, stay still. ---
    const door = job.walls.find((w) => w.door === 'vault');
    if (door && !state.vaultOpen) {
      const cx = door.x + door.w / 2;
      const cy = door.y + door.h / 2;
      const near = Math.hypot(state.player.x - cx, state.player.y - cy) < 52;
      if (near && !moving) {
        state.crackProgress += THIEF.crackSpeed * dt;
        if (state.crackProgress >= 1) {
          state.vaultOpen = true;
          state.events.push(EVENT_CRACK);
        }
      } else {
        state.crackProgress = Math.max(0, state.crackProgress - dt * 0.25);
      }
    }

    // --- Guards and cameras watch; the alarm answers. ---
    const fill = updateWatchers(state, job, dt, walls);
    if (fill > 0) {
      state.alarm = Math.min(100, state.alarm + fill * dt);
      if (state.alarm >= 80 && !state.alarmSounded) {
        state.alarmSounded = true;
        state.events.push(EVENT_ALARM);
      }
    } else {
      state.alarm = Math.max(0, state.alarm - VISION.alarmDecay * dt);
      if (state.alarm < 50) state.alarmSounded = false;
    }

    // --- Caught: a guard closes in, or the alarm tops out. ---
    let caught = state.alarm >= 100;
    if (!caught) {
      for (const g of state.guards) {
        if (Math.hypot(g.x - state.player.x, g.y - state.player.y) < VISION.catchDistance + GUARD.radius - 6) {
          caught = true;
          break;
        }
      }
    }
    if (caught) {
      onCaught();
      return;
    }

    // --- Loot: walk over it to pocket it. ---
    for (const item of state.loot) {
      if (item.taken) continue;
      if (Math.hypot(item.x - state.player.x, item.y - state.player.y) < 28) {
        item.taken = true;
        state.score += item.value;
        state.coins = Math.min(8, state.coins + 1);
        spawnSparkles(item.x, item.y);
        state.events.push(EVENT_PICKUP);
      }
    }

    // --- Sparkles fade. ---
    for (let i = state.sparkles.length - 1; i >= 0; i -= 1) {
      const s = state.sparkles[i];
      s.ttl -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.ttl <= 0) state.sparkles.splice(i, 1);
    }

    // --- Getaway: all loot pocketed, reach the door. ---
    if (lootLeft() === 0) {
      const e = job.exit;
      if (state.player.x > e.x && state.player.x < e.x + e.w
        && state.player.y > e.y && state.player.y < e.y + e.h) {
        const timeBonus = Math.max(0, Math.round(job.parSeconds - state.jobTime)) * 10;
        state.score += LEVEL_BONUS + timeBonus;
        if (state.jobIndex + 1 >= JOBS.length) {
          state.events.push(EVENT_WIN);
        } else {
          state.events.push(EVENT_LEVEL);
          loadJob(state.jobIndex + 1);
        }
      }
    }
  }

  loadJob(0);

  return {
    state,
    get job() {
      return job;
    },
    lootLeft,
    step,
    respawn,
    reset() {
      state.score = 0;
      state.chances = CHANCES;
      state.coins = COIN.startCount;
      state.time = 0;
      state.sparkles = [];
      loadJob(0);
    },
  };
}
