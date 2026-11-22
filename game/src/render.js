// The renderer: one canvas, painted every frame. Dark museum at night —
// gold trim, red carpets of shadow, yellow cones sweeping, loot that glows.
// Nothing here changes the simulation; it only shows it.
import {
  HUD_HEIGHT, THIEF, VIEW_HEIGHT, VIEW_WIDTH, VISION,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const TITLE_FONT = 'Georgia, "Times New Roman", serif';
const UI_FONT = '"Trebuchet MS", Verdana, sans-serif';

function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  const g = ctx.createRadialGradient(x, y, 8, x, y, range);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fill();
}

function lootColor(kind) {
  switch (kind) {
    case 'sapphire': return '#7fe7ff';
    case 'gold': return '#ffd34d';
    case 'idol': return '#7ddc8a';
    case 'painting': return '#e8b4ff';
    case 'ledger': return '#c9a86a';
    case 'watch': return '#ffe9a8';
    case 'crown': return '#ffe27a';
    case 'vase': return '#9db8ff';
    default: return '#ffd34d';
  }
}

function drawLootIcon(ctx, kind, x, y, size, glow) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (glow) {
    ctx.shadowColor = lootColor(kind);
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = lootColor(kind);
  ctx.strokeStyle = '#1a1206';
  ctx.lineWidth = 1.5;
  switch (kind) {
    case 'sapphire':
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.8, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.lineTo(s * 0.35, 0); ctx.lineTo(0, s * 0.2); ctx.lineTo(-s * 0.35, 0); ctx.closePath(); ctx.fill();
      break;
    case 'gold':
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(-s + i * 2, -s * 0.4 + i * s * 0.45, s * 1.1, s * 0.42);
        ctx.strokeRect(-s + i * 2, -s * 0.4 + i * s * 0.45, s * 1.1, s * 0.42);
      }
      break;
    case 'idol':
      ctx.beginPath(); ctx.ellipse(0, -s * 0.15, s * 0.55, s * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(-s * 0.7, s * 0.55, s * 1.4, s * 0.3);
      break;
    case 'painting':
      ctx.fillStyle = '#8a6a2f';
      ctx.fillRect(-s, -s * 0.75, s * 2, s * 1.5);
      ctx.fillStyle = '#3f6db3';
      ctx.fillRect(-s + 3, -s * 0.75 + 3, s * 2 - 6, s * 1.5 - 6);
      ctx.fillStyle = '#e8b4ff';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'ledger':
      ctx.fillStyle = '#5a3d1e';
      ctx.fillRect(-s * 0.8, -s * 0.6, s * 1.6, s * 1.2);
      ctx.fillStyle = '#d8c49a';
      ctx.fillRect(-s * 0.6, -s * 0.45, s * 1.2, s * 0.9);
      ctx.strokeStyle = '#5a3d1e';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.2 + i * s * 0.3); ctx.lineTo(s * 0.45, -s * 0.2 + i * s * 0.3); ctx.stroke();
      }
      break;
    case 'watch':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d8';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1206';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.35); ctx.moveTo(0, 0); ctx.lineTo(s * 0.25, 0); ctx.stroke();
      break;
    case 'crown':
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.5); ctx.lineTo(-s, -s * 0.2); ctx.lineTo(-s * 0.5, s * 0.15);
      ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.5, s * 0.15); ctx.lineTo(s, -s * 0.2); ctx.lineTo(s, s * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'vase':
      ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.6, s * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(-s * 0.25, -s, s * 0.5, s * 0.5);
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor(job) {
    ctx.fillStyle = '#181b29';
    ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
    // Faint checker so the floor reads as tiles, not void.
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    const size = 80;
    for (let y = HUD_HEIGHT; y < VIEW_HEIGHT; y += size) {
      for (let x = 0; x < VIEW_WIDTH; x += size) {
        if (((x / size) + (y / size)) % 2 === 0) ctx.fillRect(x, y, size, size);
      }
    }
    // Room name plates on the floor.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 15px ${UI_FONT}`;
    ctx.fillStyle = 'rgba(212,175,55,0.55)';
    for (const label of job.labels) {
      ctx.fillText(label.text, label.x, label.y);
    }
  }

  function drawWalls(job, state) {
    for (const w of job.walls) {
      if (w.door === 'vault' && state.vaultOpen) {
        // Cracked open: a dark doorway with a gold frame.
        ctx.fillStyle = '#05060a';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x - 2, w.y - 2, w.w + 4, w.h + 4);
        continue;
      }
      ctx.fillStyle = '#39405c';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = 'rgba(212,175,55,0.75)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      if (w.door === 'vault') {
        // Locked vault door: gold bars and a progress ring while cracking.
        ctx.fillStyle = '#d4af37';
        const vertical = w.h > w.w;
        for (let i = 0; i < 4; i += 1) {
          if (vertical) ctx.fillRect(w.x + 2 + i * 3, w.y, 1.5, w.h);
          else ctx.fillRect(w.x, w.y + 2 + i * 3, w.w, 1.5);
        }
        ctx.fillStyle = '#d4af37';
        ctx.font = `700 11px ${UI_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VAULT', w.x + w.w / 2, w.y + w.h / 2 + (vertical ? 0 : 0));
        if (state.crackProgress > 0) {
          ctx.beginPath();
          ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 22, -Math.PI / 2, -Math.PI / 2 + state.crackProgress * Math.PI * 2);
          ctx.strokeStyle = '#ffd34d';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }
    }
  }

  function drawExit(job, state, allLootTaken) {
    const e = job.exit;
    const ready = allLootTaken;
    ctx.save();
    ctx.fillStyle = ready ? 'rgba(53,208,127,0.28)' : 'rgba(120,120,120,0.14)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = ready ? '#35d07f' : '#8a8f9e';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = ready ? '#35d07f' : '#9aa0b0';
    ctx.font = `700 13px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ready ? 'GETAWAY ✓' : job.exitLabel, e.x + e.w / 2, e.y + e.h / 2 - 8);
    ctx.font = `600 10px ${UI_FONT}`;
    ctx.fillText(ready ? 'GO — ALL LOOT IN' : 'NEEDS ALL LOOT', e.x + e.w / 2, e.y + e.h / 2 + 9);
    ctx.restore();
  }

  function drawLoot(state, time) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.75 + 0.25 * Math.sin(time * 3 + item.x);
      // Rug beneath the prize.
      ctx.fillStyle = 'rgba(120,20,40,0.5)';
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 8, 34, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Halo.
      const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 42);
      halo.addColorStop(0, lootColor(item.kind) + '88');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = pulse;
      drawLootIcon(ctx, item.kind, item.x, item.y, 13, true);
      ctx.globalAlpha = 1;
      // Value tag.
      ctx.fillStyle = 'rgba(255,211,77,0.9)';
      ctx.font = `700 11px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`$${item.value}`, item.x, item.y + 30);
    }
  }

  function drawWatchers(state) {
    // Patrol routes, faint, so the player can read the pattern.
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    for (const g of state.guards) {
      ctx.beginPath();
      g.waypoints.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Camera cones first (under the guards' cones).
    for (const c of state.cameras) {
      drawCone(ctx, c.x, c.y, c.angle, VISION.cameraRange, VISION.cameraHalfAngle, 'rgba(229,72,77,0.30)');
    }
    for (const g of state.guards) {
      const color = g.state === 'chase' ? 'rgba(229,72,77,0.42)'
        : g.state === 'suspect' || g.state === 'investigate' ? 'rgba(245,166,35,0.38)'
          : 'rgba(245,214,90,0.32)';
      drawCone(ctx, g.x, g.y, g.angle, VISION.guardRange, VISION.guardHalfAngle, color);
    }

    // Camera bodies.
    for (const c of state.cameras) {
      ctx.fillStyle = '#3a3f55';
      ctx.strokeStyle = '#e5484d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e5484d';
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 5, c.y + Math.sin(c.angle) * 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Guard bodies.
    for (const g of state.guards) {
      ctx.fillStyle = '#33477e';
      ctx.strokeStyle = g.state === 'chase' ? '#e5484d' : g.state === 'suspect' || g.state === 'investigate' ? '#f5a623' : '#8fa3c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Cap brim toward the facing.
      ctx.strokeStyle = '#d8deea';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(g.x + Math.cos(g.angle - 0.5) * 8, g.y + Math.sin(g.angle - 0.5) * 8);
      ctx.lineTo(g.x + Math.cos(g.angle) * 13, g.y + Math.sin(g.angle) * 13);
      ctx.lineTo(g.x + Math.cos(g.angle + 0.5) * 8, g.y + Math.sin(g.angle + 0.5) * 8);
      ctx.stroke();
      // Badge dot.
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(g.x - Math.cos(g.angle) * 4, g.y - Math.sin(g.angle) * 4, 2, 0, Math.PI * 2);
      ctx.fill();
      if (g.state === 'chase' || g.state === 'suspect') {
        ctx.fillStyle = g.state === 'chase' ? '#ff5a5a' : '#ffb020';
        ctx.font = `900 20px ${UI_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, g.y - 16);
      }
    }
  }

  function drawPlayer(state, time) {
    const p = state.player;
    // A pool of light around the thief.
    const light = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 150);
    light.addColorStop(0, 'rgba(255,240,200,0.10)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 150, 0, Math.PI * 2);
    ctx.fill();

    // Hooded figure: dark cloak, gold mask glint, facing tick.
    ctx.save();
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#15161f';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sneaking ? 10 : 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * 8, p.y + Math.sin(p.angle) * 8);
    ctx.lineTo(p.x + Math.cos(p.angle) * 15, p.y + Math.sin(p.angle) * 15);
    ctx.stroke();
    if (p.sneaking) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Thrown coin in flight, and the ringing noise.
    if (state.coin) {
      const c = state.coin;
      ctx.fillStyle = '#ffd34d';
      ctx.strokeStyle = '#8a6a2f';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (state.noise) {
      const n = state.noise;
      const k = 1 - n.ttl / 2.5;
      ctx.strokeStyle = `rgba(255,211,77,${0.8 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 12 + k * n.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Pickup sparkles.
    for (const s of state.sparkles) {
      ctx.fillStyle = `rgba(255,211,77,${Math.max(0, s.ttl / s.max)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    void time;
  }

  function drawNight(state) {
    // Vignette: the room is dark at the edges, lit where the thief stands.
    const p = state.player;
    const g = ctx.createRadialGradient(p.x, p.y, 260, p.x, p.y, 720);
    g.addColorStop(0, 'rgba(2,4,12,0)');
    g.addColorStop(1, 'rgba(2,4,12,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  }

  function drawHud(state, job, screen) {
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
    ctx.strokeStyle = 'rgba(212,175,55,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_HEIGHT - 0.5);
    ctx.lineTo(VIEW_WIDTH, HUD_HEIGHT - 0.5);
    ctx.stroke();

    // Left: job name and objective.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8e4d8';
    ctx.font = `700 17px ${UI_FONT}`;
    ctx.fillText(job.name, 16, 20);
    ctx.fillStyle = '#9aa0b0';
    ctx.font = `600 12px ${UI_FONT}`;
    const left = state.loot.filter((i) => !i.taken).length;
    ctx.fillText(
      left > 0 ? `Steal ${left} more piece${left > 1 ? 's' : ''} — then reach the getaway door` : 'All loot in — reach the getaway door!',
      16, 44,
    );

    // Centre: the alarm meter.
    const barX = 470;
    const barY = 16;
    const barW = 340;
    const barH = 20;
    ctx.fillStyle = '#f5d65a';
    ctx.font = `800 13px ${UI_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('ALARM', barX - 10, barY + barH / 2);
    ctx.fillStyle = '#1c1f2e';
    ctx.fillRect(barX, barY, barW, barH);
    const a = state.alarm / 100;
    const alarmColor = a < 0.3 ? '#35d07f' : a < 0.65 ? '#f5a623' : '#e5484d';
    ctx.fillStyle = alarmColor;
    ctx.fillRect(barX, barY, barW * a, barH);
    ctx.strokeStyle = state.alarm >= 80 && Math.floor(state.time * 4) % 2 === 0 ? '#ff5a5a' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = state.alarm >= 80 ? 2 : 1;
    ctx.strokeRect(barX, barY, barW, barH);
    // Segments.
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i += 1) {
      ctx.beginPath();
      ctx.moveTo(barX + (barW / 10) * i, barY);
      ctx.lineTo(barX + (barW / 10) * i, barY + barH);
      ctx.stroke();
    }
    ctx.fillStyle = '#9aa0b0';
    ctx.font = `600 11px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.alarm >= 100 ? 'LOCKDOWN!' : `${Math.round(state.alarm)}%`, barX + barW / 2, barY + barH + 13);

    // Right: score, loot, coins, chances, time.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd34d';
    ctx.font = `800 18px ${UI_FONT}`;
    ctx.fillText(`$${state.score.toLocaleString('en-US')}`, 1264, 20);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = `600 13px ${UI_FONT}`;
    const taken = state.loot.filter((i) => i.taken).length;
    ctx.fillText(`LOOT ${taken}/${state.loot.length}   COINS ${state.coins}   ♥ ${'●'.repeat(state.chances)}${'○'.repeat(3 - state.chances)}   ${fmtTime(state.jobTime)}`, 1264, 44);
    void screen;
  }

  function overlay(title, lines, hint) {
    ctx.fillStyle = 'rgba(4,6,12,0.78)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd34d';
    ctx.font = `800 52px ${TITLE_FONT}`;
    ctx.fillText(title, VIEW_WIDTH / 2, 220);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = `400 19px ${UI_FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_WIDTH / 2, 300 + i * 32);
    });
    if (hint) {
      ctx.fillStyle = '#9aa0b0';
      ctx.font = `600 15px ${UI_FONT}`;
      ctx.fillText(hint, VIEW_WIDTH / 2, 300 + lines.length * 32 + 30);
    }
  }

  function drawTitle(state, job, best) {
    // The live floor behind the title, dimmed.
    drawFloor(job);
    drawWalls(job, state);
    drawLoot(state, state.time);
    drawWatchers(state);
    drawPlayer(state, state.time);
    ctx.fillStyle = 'rgba(4,6,12,0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd34d';
    ctx.font = `800 64px ${TITLE_FONT}`;
    ctx.fillText('THE MIDNIGHT VAULT', VIEW_WIDTH / 2, 190);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = `italic 400 22px ${TITLE_FONT}`;
    ctx.fillText('Three jobs. One thief. No alarms — if you can help it.', VIEW_WIDTH / 2, 245);
    ctx.font = `400 17px ${UI_FONT}`;
    const lines = [
      'WASD / Arrows — move      Shift — sneak (slower, harder to spot)',
      'Click — throw a coin to pull a guard away      Stand at the vault door to crack it',
      'Steal every piece, then slip out the getaway door. Get caught 3 times and the night is over.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_WIDTH / 2, 320 + i * 30));
    ctx.fillStyle = '#ffd34d';
    ctx.font = `700 20px ${UI_FONT}`;
    ctx.fillText('Press SPACE to start the first job', VIEW_WIDTH / 2, 450);
    if (best > 0) {
      ctx.fillStyle = '#9aa0b0';
      ctx.font = `600 15px ${UI_FONT}`;
      ctx.fillText(`Best take so far: $${best.toLocaleString('en-US')}`, VIEW_WIDTH / 2, 490);
    }
    ctx.fillStyle = '#6a7080';
    ctx.font = `600 12px ${UI_FONT}`;
    ctx.fillText('P pause · R restart · M mute', VIEW_WIDTH / 2, 540);
  }

  function draw(state, job, screen, extra = {}) {
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    const allLootTaken = state.loot.every((i) => i.taken);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, job, extra.best || 0);
      return;
    }
    drawFloor(job);
    drawExit(job, state, allLootTaken);
    drawWalls(job, state);
    drawLoot(state, state.time);
    drawWatchers(state);
    drawPlayer(state, state.time);
    drawNight(state);
    drawHud(state, job, screen);
    if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['The vault waits. The guards do not sleep, but they do stand still.'], 'P — resume · R — restart the job');
    } else if (screen === SCREEN_CAUGHT) {
      overlay('CAUGHT!', [
        `The guards hauled you out — $${Math.max(0, 150)} of the take went to the fixer.`,
        extra.chances > 0 ? `${extra.chances} chance${extra.chances > 1 ? 's' : ''} left tonight.` : 'That was the last chance.',
      ], 'SPACE — slip back in');
    } else if (screen === SCREEN_LEVEL) {
      overlay('CLEAN GETAWAY', [
        `${job.name} — every piece pocketed.`,
        `Take so far: $${state.score.toLocaleString('en-US')}`,
      ], 'SPACE — next job');
    } else if (screen === SCREEN_WIN) {
      overlay('THE PERFECT HEIST', [
        'All three jobs, every piece, and the sun is still down.',
        `Final take: $${state.score.toLocaleString('en-US')}`,
      ], 'R — run it all again');
    } else if (screen === SCREEN_OVER) {
      overlay('THE NIGHT IS OVER', [
        'Three strikes. The crew melts away before dawn.',
        `Final take: $${state.score.toLocaleString('en-US')}`,
      ], 'R — try the night again');
    }
  }

  return { draw };
}
