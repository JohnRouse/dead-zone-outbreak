import { expect, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

export interface LegacySnapshot {
  state: string;
  time: number;
  won: boolean;
  world: { w: number; h: number };
  viewport: { w: number; h: number };
  camera: { x: number; y: number };
  player: {
    x: number; y: number; r: number; hp: number; maxhp: number;
    dash: number; dashTime: number; invuln: number;
    kills: number; supply: number; level: number;
    autoPattern: number; autoLaser: boolean; autoPierce: number;
  };
  bullets: { x: number; y: number; vx: number; vy: number; auto: boolean; laser: boolean; remaining: number }[];
  zombies: { x: number; y: number; hp: number }[];
}

// Único adaptador de lectura de los globals léxicos del script clásico.
// No añade un API de depuración ni instrumentación al HTML de producción.
export async function snapshot(page: Page): Promise<LegacySnapshot> {
  return page.evaluate(`({
    state: game.state, time: game.time, won: game.won,
    world: {...WORLD}, viewport: {w: W, h: H}, camera: {...cam},
    player: {...player},
    bullets: bullets.map(({x,y,vx,vy,auto,laser,remaining}) => ({x,y,vx,vy,auto,laser,remaining})),
    zombies: zombies.map(({x,y,hp}) => ({x,y,hp}))
  })`);
}

export async function openLegacy(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/legacy/index.html');
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
  await expect(page.locator('#play')).toHaveText('INICIAR MISIÓN ▶');
}

export async function startMission(page: Page) {
  await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
  await page.clock.runFor(32);
  await expect(page.locator('#overlay')).toBeHidden();
  expect((await snapshot(page)).state).toBe('playing');
}

export async function holdKeys(page: Page, keys: string[], milliseconds: number) {
  for (const key of keys) await page.keyboard.down(key);
  try {
    await page.clock.runFor(milliseconds);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

export async function capture(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: 'image/png' });
  const statePath = testInfo.outputPath(`${name}-state.json`);
  await writeFile(statePath, JSON.stringify(await snapshot(page), null, 2));
  await testInfo.attach(`${name}-state`, { path: statePath, contentType: 'application/json' });
}

// Preparación controlada SOLO para integración; no demuestra aparición natural,
// puntería humana ni balance. Los tests de recorrido no usan este helper.
export async function placeZombie(page: Page, dx: number, dy = 0, hp = 60) {
  await page.evaluate(`zombies.push({
    x: player.x + ${dx}, y: player.y + ${dy}, r: 16,
    hp: ${hp}, maxhp: ${hp}, speed: 0, damage: 12,
    color: '#78a381', kind: 'walker', hit: 0, attack: 0, anim: 0
  })`);
}
