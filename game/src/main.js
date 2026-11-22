// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between title, play, paused,
// caught, level clear, win and game over.
//
// ?seed=N fixes the run. ?shot=start|loot|alarm|escape (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import {
  ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_CAUGHT, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY,
  SCREEN_TITLE, SCREEN_WIN, createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

// The handle the play-test drives: live state, the current screen, the world.
window.__game = {
  state: world.state,
  world,
  screen: () => currentScreen,
  best: () => best,
};

let currentScreen = SCREEN_TITLE;
let best = readBest();

function announce(message) {
  status.textContent = message;
}

function handleEvents() {
  const events = world.state.events;
  for (const event of events) {
    if (event === 'pickup') {
      audio.pickup();
      const left = world.lootLeft();
      announce(left > 0 ? `Pocketed. ${left} piece${left > 1 ? 's' : ''} left.` : 'All loot in — reach the getaway door!');
    } else if (event === 'coin') {
      audio.coin();
    } else if (event === 'crack') {
      audio.crack();
      announce('Vault door cracked — the sapphire is yours to take.');
    } else if (event === 'alarm') {
      audio.alarm();
      announce('Alarm climbing — break line of sight!');
    } else if (event === 'caught') {
      audio.caught();
      currentScreen = SCREEN_CAUGHT;
      announce('Caught! The guards hauled you out.');
    } else if (event === 'level') {
      audio.win();
      currentScreen = SCREEN_LEVEL;
      announce('Clean getaway — next job.');
    } else if (event === 'win') {
      audio.win();
      currentScreen = SCREEN_WIN;
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce(`The perfect heist. Final take $${world.state.score}.`);
    } else if (event === 'gameover') {
      currentScreen = SCREEN_OVER;
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce('The night is over.');
    }
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  currentScreen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, world.job, currentScreen, { best });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();

  function startJob() {
    world.reset();
    accumulator = 0;
    currentScreen = SCREEN_PLAY;
    announce('Playing. Steal every piece, then reach the getaway door.');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    if (input.pressed.has(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (input.pressed.has(ACTION_RESTART)
      && (currentScreen === SCREEN_OVER || currentScreen === SCREEN_WIN || currentScreen === SCREEN_PAUSED)) {
      startJob();
    }
    if (input.pressed.has(ACTION_PAUSE)) {
      if (currentScreen === SCREEN_PLAY) {
        currentScreen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (currentScreen === SCREEN_PAUSED) {
        currentScreen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (input.pressed.has(ACTION_CONFIRM)) {
      audio.unlock();
      if (currentScreen === SCREEN_TITLE) startJob();
      else if (currentScreen === SCREEN_CAUGHT) {
        world.respawn();
        handleEvents();
        if (currentScreen === SCREEN_CAUGHT) currentScreen = SCREEN_PLAY;
      } else if (currentScreen === SCREEN_LEVEL) currentScreen = SCREEN_PLAY;
    }
    input.pressed.clear();

    if (currentScreen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        world.step(input, STEP);
        accumulator -= STEP;
        handleEvents();
        if (currentScreen !== SCREEN_PLAY) break;
      }
    }

    const extra = {
      best,
      chances: world.state.chances,
    };
    renderer.draw(world.state, world.job, currentScreen, extra);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
