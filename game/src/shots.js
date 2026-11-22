// The screenshot scenes behind ?shot=start|loot|alarm|escape. Each one
// starts from a fresh job and then plays the real rules forward for a fixed
// number of steps, so the frame is what a short game really looks like —
// and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_PLAY } from './render.js';

const IDLE_INPUT = { moveX: 0, moveY: 0, sneaking: false, click: null };

function runSteps(world, seconds, input = IDLE_INPUT) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step({ ...input }, STEP);
  }
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;

  if (name === 'start') {
    // The opening frame: the thief at the door, guards mid-patrol, cameras
    // sweeping, every piece of loot glinting. Five seconds in.
    runSteps(world, 5);
    return { screen: SCREEN_PLAY };
  }

  if (name === 'loot') {
    // Inside the vault, beside the Star Sapphire: the door already cracked,
    // the prize glowing, the hall guards none the wiser. The thief stands
    // clear of the wall camera's sweep, so the alarm stays quiet.
    state.vaultOpen = true;
    state.player.x = 1120;
    state.player.y = 130;
    state.player.angle = Math.PI / 4;
    runSteps(world, 1.5);
    return { screen: SCREEN_PLAY };
  }

  if (name === 'alarm') {
    // Spotted in the open hall: the guard has turned, its cone is orange,
    // the alarm is climbing. The guard's facing is re-pinned each step so
    // the patrol walk cannot turn it away from the thief mid-scene.
    const guard = state.guards[0];
    guard.x = 600;
    guard.y = 300;
    guard.angle = 0;
    guard.waypoints = [[600, 300], [600, 300]];
    guard.waypointIndex = 0;
    state.player.x = 760;
    state.player.y = 300;
    state.player.angle = Math.PI;
    for (let i = 0; i < 54; i += 1) {
      guard.angle = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
      world.step({ ...IDLE_INPUT }, STEP);
    }
    return { screen: SCREEN_PLAY };
  }

  if (name === 'escape') {
    // The getaway: every piece pocketed, the thief sprinting for the service
    // door with a guard in pursuit and the alarm half full.
    for (const item of state.loot) item.taken = true;
    state.score = state.loot.reduce((sum, item) => sum + item.value, 0);
    state.alarm = 45;
    state.player.x = 260;
    state.player.y = 660;
    state.player.angle = Math.PI;
    const guard = state.guards[1];
    guard.x = 380;
    guard.y = 620;
    guard.heat = 80;
    guard.lastSeen = { x: state.player.x, y: state.player.y };
    runSteps(world, 0.8);
    return { screen: SCREEN_PLAY };
  }

  return { screen: SCREEN_PLAY };
}
