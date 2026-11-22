// Keyboard and mouse: WASD/arrows to move, Shift to sneak, click to throw
// a coin, P to pause, Space/Enter to confirm, R to restart, M to mute.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

const CONFIRM_CODES = new Set(['Space', 'Enter', 'NumpadEnter']);

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0,
    moveY: 0,
    sneaking: false,
    // A click waiting to be consumed as a coin throw: {x, y} in canvas pixels.
    click: null,
    // One-shot actions, consumed by the game loop each frame.
    pressed: new Set(),
  };

  function updateMove() {
    let x = 0;
    let y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    state.moveX = x;
    state.moveY = y;
    state.sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (CONFIRM_CODES.has(event.code)) state.pressed.add(ACTION_CONFIRM);
    if (event.code === 'KeyP' || event.code === 'Escape') state.pressed.add(ACTION_PAUSE);
    if (event.code === 'KeyR') state.pressed.add(ACTION_RESTART);
    if (event.code === 'KeyM') state.pressed.add(ACTION_MUTE);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    updateMove();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
    updateMove();
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    state.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onBlur() {
    keys.clear();
    updateMove();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);

  return state;
}
