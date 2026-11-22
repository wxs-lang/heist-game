// The Midnight Vault: configuration and the three heist jobs.
// A job is one floor plan: walls, cover, loot, guard patrols, cameras, the
// getaway door and the thief's entry point. Coordinates are canvas pixels;
// the HUD owns y 0..64, the floor owns y 64..720, x 0..1280.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const HUD_HEIGHT = 64;
export const STEP = 1 / 60;

export const BEST_KEY = 'midnight-vault-best';

// The thief.
export const THIEF = {
  radius: 11,
  walkSpeed: 168,
  sneakSpeed: 96,
  crackSpeed: 1 / 2.5, // vault door cracked per second of standing at it
};

// A thrown coin: how far it flies, how loud it lands.
export const COIN = {
  range: 280,
  noiseRadius: 185,
  startCount: 5,
  cooldown: 0.5,
};

// Vision and the alarm meter.
export const VISION = {
  guardRange: 215,
  guardHalfAngle: (32 * Math.PI) / 180,
  cameraRange: 195,
  cameraHalfAngle: (28 * Math.PI) / 180,
  // Alarm fills per second while a guard watches; nearer and faster is worse.
  guardFillNear: 58,
  guardFillFar: 18,
  cameraFill: 30,
  sneakFactor: 0.45,
  alarmDecay: 7,
  suspectAt: 30,
  chaseAt: 65,
  catchDistance: 18,
};

export const GUARD = {
  patrolSpeed: 72,
  suspectSpeed: 95,
  chaseSpeed: 152,
  investigateSpeed: 105,
  radius: 12,
};

export const CHANCES = 3;
export const LEVEL_BONUS = 500;

// One wall: {x, y, w, h}. A door wall also has door: 'vault' and blocks
// movement until it is cracked open.
function wall(x, y, w, h, extra = {}) {
  return { x, y, w, h, ...extra };
}

function loot(id, name, x, y, value, kind) {
  return { id, name, x, y, value, kind, taken: false };
}

function guard(waypoints) {
  return { waypoints };
}

function camera(x, y, baseAngle, sweep, speed, phase = 0) {
  return { x, y, baseAngle, sweep, speed, phase };
}

// The three jobs. Each floor is drawn from these rects, so a room is only
// ever what its walls say it is.
export const JOBS = [
  {
    name: 'Job 1 · The Meridian Museum',
    parSeconds: 150,
    labels: [
      { text: 'GALLERY', x: 217, y: 100 },
      { text: 'GRAND HALL', x: 640, y: 100 },
      { text: 'VAULT', x: 1063, y: 100 },
      { text: 'SECURITY', x: 1063, y: 420 },
    ],
    entry: { x: 70, y: 640 },
    exit: { x: 46, y: 648, w: 120, h: 52 },
    exitLabel: 'SERVICE DOOR',
    walls: [
      wall(0, 64, 1280, 14), wall(0, 706, 1280, 14),
      wall(0, 64, 14, 656), wall(1266, 64, 14, 656),
      // Gallery | hall divider, door gap y 430..520.
      wall(420, 64, 14, 366), wall(420, 520, 14, 186),
      // Hall | vault wing divider, vault door gap y 200..280.
      wall(860, 64, 14, 136), wall(860, 280, 14, 80),
      wall(860, 200, 14, 80, { door: 'vault', label: 'VAULT' }),
      // North hall | south hall divider, door gap x 640..730.
      wall(420, 380, 220, 14), wall(730, 380, 130, 14),
      // Office divider (y 380, x 860..1266): door gap x 1000..1090.
      wall(860, 380, 140, 14), wall(1090, 380, 176, 14),
      // Cover: pedestals, display cases, crates.
      wall(150, 300, 70, 40), wall(300, 150, 40, 70),
      wall(500, 200, 60, 60), wall(700, 500, 80, 50),
      wall(1000, 500, 70, 70), wall(1050, 120, 60, 50),
    ],
    loot: [
      loot('idol', 'Jade Idol', 180, 180, 400, 'idol'),
      loot('painting', 'Masterpiece', 210, 640, 600, 'painting'),
      loot('gold', 'Gold Bars', 640, 560, 800, 'gold'),
      loot('sapphire', 'Star Sapphire', 1150, 180, 1000, 'sapphire'),
    ],
    guards: [
      guard([[480, 140], [800, 140], [800, 300], [480, 300]]),
      guard([[100, 120], [360, 120], [360, 620], [100, 620]]),
      guard([[480, 620], [820, 620], [820, 460], [480, 460]]),
    ],
    cameras: [
      camera(640, 78, Math.PI / 2, 0.9, 0.55, 0),
      camera(1252, 300, Math.PI, 0.7, 0.45, 1.3),
    ],
  },
  {
    name: 'Job 2 · Meridian Bank',
    parSeconds: 170,
    labels: [
      { text: 'LOBBY', x: 222, y: 100 },
      { text: 'TELLERS', x: 655, y: 100 },
      { text: 'VAULT', x: 1073, y: 100 },
      { text: 'MANAGER', x: 222, y: 500 },
      { text: 'BACK OFFICE', x: 655, y: 500 },
    ],
    entry: { x: 70, y: 140 },
    exit: { x: 46, y: 648, w: 120, h: 52 },
    exitLabel: 'SERVICE DOOR',
    walls: [
      wall(0, 64, 1280, 14), wall(0, 706, 1280, 14),
      wall(0, 64, 14, 656), wall(1266, 64, 14, 656),
      // Lobby | tellers divider, door gap y 300..390.
      wall(430, 64, 14, 236), wall(430, 390, 14, 316),
      // Tellers | vault divider, vault door gap y 150..230.
      wall(880, 64, 14, 86), wall(880, 230, 14, 150),
      wall(880, 150, 14, 80, { door: 'vault', label: 'VAULT' }),
      // Lobby | manager office divider, door gap x 180..270.
      wall(14, 470, 166, 14), wall(270, 470, 160, 14),
      // Tellers | back office divider, door gap x 620..710.
      wall(430, 470, 190, 14), wall(710, 470, 170, 14),
      // Cover: counters, desks, planters.
      wall(180, 220, 90, 40), wall(180, 330, 40, 80),
      wall(560, 180, 60, 60), wall(560, 560, 80, 50),
      wall(1020, 300, 70, 70), wall(1080, 560, 60, 50),
      wall(700, 300, 50, 50),
    ],
    loot: [
      loot('ledger', 'Black Ledger', 320, 560, 400, 'ledger'),
      loot('cash', 'Cash Bundles', 640, 240, 600, 'gold'),
      loot('watch', 'Heirloom Watch', 760, 620, 800, 'idol'),
      loot('diamond', 'Meridian Diamond', 1160, 150, 1000, 'sapphire'),
    ],
    guards: [
      guard([[500, 140], [820, 140], [820, 400], [500, 400]]),
      guard([[90, 120], [360, 120], [360, 430], [90, 430]]),
      guard([[500, 620], [820, 620], [820, 540], [500, 540]]),
      guard([[950, 420], [1200, 420], [1200, 650], [950, 650]]),
    ],
    cameras: [
      camera(660, 78, Math.PI / 2, 0.9, 0.6, 0),
      camera(1252, 480, Math.PI, 0.7, 0.5, 0.8),
      camera(452, 640, 0, 0.8, 0.5, 2.1),
    ],
  },
  {
    name: 'Job 3 · Sky Penthouse',
    parSeconds: 190,
    labels: [
      { text: 'LOUNGE', x: 217, y: 100 },
      { text: 'GALLERY', x: 640, y: 100 },
      { text: 'VAULT', x: 1063, y: 100 },
      { text: 'STUDY', x: 217, y: 460 },
      { text: 'BEDROOM', x: 640, y: 460 },
    ],
    entry: { x: 640, y: 660 },
    exit: { x: 580, y: 648, w: 120, h: 52 },
    exitLabel: 'ROOF DOOR',
    walls: [
      wall(0, 64, 1280, 14), wall(0, 706, 1280, 14),
      wall(0, 64, 14, 656), wall(1266, 64, 14, 656),
      // Lounge | gallery divider, door gap y 260..350.
      wall(420, 64, 14, 196), wall(420, 350, 14, 356),
      // Gallery | vault divider, vault door gap y 150..230.
      wall(860, 64, 14, 86), wall(860, 230, 14, 150),
      wall(860, 150, 14, 80, { door: 'vault', label: 'VAULT' }),
      // Lounge | study divider, door gap x 150..240.
      wall(14, 420, 136, 14), wall(240, 420, 180, 14),
      // Gallery | bedroom divider, door gap x 600..690.
      wall(420, 420, 180, 14), wall(690, 420, 170, 14),
      // Cover: sofas, tables, sculptures.
      wall(150, 180, 80, 44), wall(280, 560, 60, 60),
      wall(560, 180, 60, 60), wall(560, 560, 80, 50),
      wall(1020, 300, 70, 70), wall(1080, 560, 60, 50),
      wall(700, 300, 50, 50),
    ],
    loot: [
      loot('vase', 'Ming Vase', 200, 300, 400, 'idol'),
      loot('painting', 'Lost Vermeer', 640, 300, 600, 'painting'),
      loot('gold', 'Gold Bullion', 760, 620, 800, 'gold'),
      loot('crown', 'The Aster Crown', 1160, 150, 1000, 'sapphire'),
    ],
    guards: [
      guard([[480, 140], [800, 140], [800, 340], [480, 340]]),
      guard([[90, 120], [340, 120], [340, 360], [90, 360]]),
      guard([[480, 620], [820, 620], [820, 500], [480, 500]]),
      guard([[950, 420], [1200, 420], [1200, 650], [950, 650]]),
    ],
    cameras: [
      camera(660, 78, Math.PI / 2, 1.0, 0.65, 0),
      camera(1252, 300, Math.PI, 0.7, 0.55, 1.1),
      camera(640, 706, -Math.PI / 2, 0.8, 0.5, 2.4),
    ],
  },
];
