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
export const WEAPONS = {
  manual: { damage: 26, interval: .14, speed: 900, range: 760 },
  auto: { damage: 16, interval: .65, speed: 650, range: 360 },
} as const;
export const MOVEMENT = { speed: 230, radius: 17, dashMultiplier: 3.9, dashDuration: .19, dashCooldown: 3.3 } as const;
export const ENEMY_TYPES = {
  walker: { hp: 60, speed: 66, damage: 12, radius: 19 },
  brute: { hp: 130, speed: 43, damage: 21, radius: 29 },
} as const;
