// Unidades de mundo, segundos y HP. La demo no sustituye el balance legacy.
export const WORLD = { w: 2800, h: 2100 } as const;
export const BUILDINGS = [
  { x: 570, y: 360, w: 570, h: 470, name: 'BOTICA', color: '#3e6c68', sign: '#8bca93' },
  { x: 1730, y: 390, w: 530, h: 440, name: 'RADIO 09', color: '#68526c', sign: '#eca558' },
  { x: 530, y: 1400, w: 600, h: 450, name: 'ALMACÉN', color: '#756146', sign: '#dbb67b' },
  { x: 1750, y: 1410, w: 590, h: 450, name: 'TALLER', color: '#3d666e', sign: '#8ec7c8' },
] as const;
export const PROPS = [
  { x: 1070, y: 970, w: 72, h: 148, kind: 'car' },
  { x: 1790, y: 1150, w: 72, h: 148, kind: 'car' },
  { x: 880, y: 1250, w: 160, h: 38, kind: 'barricade' },
  { x: 1920, y: 930, w: 150, h: 38, kind: 'barricade' },
] as const;
export const OBSTACLES = [...BUILDINGS, ...PROPS];
export const LAMPS = [{ x: 1180, y: 860 }, { x: 1700, y: 1320 }, { x: 2020, y: 850 }, { x: 900, y: 1360 }];
// Única definición e instancia para ambos modos; cambio de diseño de iteración 2.
export const PERSONAL_WEAPON = { damage: 26, interval: .28, speed: 900, range: 760,
  autoRange: 460, capacity: 10, reloadDuration: 1.5 } as const;
export const MOVEMENT = { speed: 230, radius: 17, dashMultiplier: 3.9, dashDuration: .19, dashCooldown: 3.3 } as const;
export const ENEMY_TYPES = {
  walker: { hp: 60, speed: 88, damage: 12, radius: 19, windup: .32, strike: .16, recovery: .65, reach: 18, arc: 1.15 },
  brute: { hp: 156, speed: 56, damage: 28, radius: 29, windup: .9, strike: .24, recovery: 1.3, reach: 62, arc: 1.35 },
} as const;

export const SPAWN_POINTS = [
  { id: 'west-edge', x: 65, y: 1100, source: 'edge' },
  { id: 'east-edge', x: 2735, y: 1100, source: 'edge' },
  { id: 'north-edge', x: 1450, y: 65, source: 'edge' },
  { id: 'south-edge', x: 1450, y: 2035, source: 'edge' },
  { id: 'west-alley', x: 460, y: 1140, source: 'alley' },
  { id: 'east-alley', x: 2390, y: 1030, source: 'alley' },
  // Anclaje fuera de la huella sólida, alineado con el umbral de cada fachada.
  ...BUILDINGS.map((b, i) => ({ id: `door-${i}`, x: b.x + b.w / 2, y: b.y + b.h + 38, source: 'door' as const })),
] as const;
export type SpawnPoint = typeof SPAWN_POINTS[number];
export const SPAWN_RULES = { interval: 1.5, initialDelay: 3, minDistance: 300, maxDistance: 1600, maxAlive: 18 } as const;
