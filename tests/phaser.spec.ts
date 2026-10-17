import { test, expect } from './fixtures';
import type { Page, TestInfo } from '@playwright/test';
import type { ReferenceView } from '../src/client/phaser/ReferenceScene';

// WebGL de Chromium headless puede usar rasterización por software. Las pruebas
// visuales de esta ruta se ejecutan consecutivamente; no cambian el render real.
test.describe.configure({ mode: 'default', timeout: 120_000 });

async function snapshot(page: Page): Promise<ReferenceView> {
  return page.evaluate(() => window.__DZO_REFERENCE__!.snapshot());
}
async function hold(page: Page, keys: string[], duration: number) {
  for (const key of keys) await page.keyboard.down(key);
  try { await page.clock.runFor(duration); }
  finally { for (const key of keys) await page.keyboard.up(key); }
}
async function open(page: Page) {
  await page.clock.install({ time: new Date('2026-10-17T10:00:00Z') });
  await page.goto('/phaser/');
  await expect(page.getByRole('button', { name: 'Entrar al distrito' })).toBeEnabled({ timeout: 20_000 });
  await page.clock.pauseAt(new Date('2026-10-17T11:00:00Z'));
  await page.getByRole('button', { name: 'Entrar al distrito' }).click();
  await page.mouse.move(960, 400);
  await page.clock.runFor(50);
}
async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await info.attach(name, { path, contentType: 'image/png' });
  await info.attach(`${name}-snapshot`, { body: JSON.stringify(await snapshot(page), null, 2), contentType: 'application/json' });
}

test('Phaser: referencia tenue, diurna y combate con controles reales', async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await open(page);
  const first = await snapshot(page);
  expect(first.state.enemies.map(e => e.kind)).toEqual(expect.arrayContaining(['walker', 'brute']));
  expect(first.renderer).toBe('WebGL');
  expect(first.world.w).toBeGreaterThan(1920); expect(first.world.h).toBeGreaterThan(1080);
  await capture(page, info, '01-luz-tenue');
  await page.getByRole('button', { name: 'Luz diurna' }).click();
  await page.clock.runFor(32);
  await capture(page, info, '02-luz-diurna');
  expect((await snapshot(page)).light).toBe('day');
  await page.getByRole('button', { name: 'Luz tenue' }).click();
  await page.mouse.move(1270, 470); await page.mouse.down();
  await hold(page, ['d'], 450);
  await page.mouse.up();
  const combat = await snapshot(page);
  expect(combat.state.player.x - first.state.player.x).toBeGreaterThan(95);
  expect(combat.state.stats.manualShots).toBeGreaterThanOrEqual(3);
  expect(combat.state.stats.autoShots).toBeGreaterThan(0);
  expect(combat.state.player.angle).toBeGreaterThan(-.5);
  expect(combat.state.player.angle).toBeLessThan(.5);
  await capture(page, info, '03-combate');
  await page.clock.runFor(400);
  expect((await snapshot(page)).state.stats.manualShots).toBe(combat.state.stats.manualShots);
});

test('Phaser: WASD/flechas, diagonal, cámara, dash con ambas teclas y colisión', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await open(page);
  for (const [key, axis, sign] of [
    ['w', 'y', -1], ['a', 'x', -1], ['s', 'y', 1], ['d', 'x', 1],
    ['ArrowUp', 'y', -1], ['ArrowLeft', 'x', -1], ['ArrowDown', 'y', 1], ['ArrowRight', 'x', 1],
  ] as const) {
    const before = await snapshot(page); await hold(page, [key], 200); const after = await snapshot(page);
    expect((after.state.player[axis] - before.state.player[axis]) * sign).toBeGreaterThan(40);
    expect((after.state.player[axis] - before.state.player[axis]) * sign).toBeLessThan(51);
  }
  const before = await snapshot(page); await hold(page, ['d', 's'], 200); const diagonal = await snapshot(page);
  expect(Math.hypot(diagonal.state.player.x - before.state.player.x, diagonal.state.player.y - before.state.player.y)).toBeGreaterThan(40);
  expect(Math.hypot(diagonal.state.player.x - before.state.player.x, diagonal.state.player.y - before.state.player.y)).toBeLessThan(51);
  const cameraBefore = diagonal.camera.x;
  await hold(page, ['d', 'Space'], 130); const dash = await snapshot(page);
  expect(dash.state.player.dashTime).toBeGreaterThan(0);
  expect(dash.state.player.invulnerable).toBeGreaterThan(0);
  expect(dash.state.player.x - diagonal.state.player.x).toBeGreaterThan(100);
  await page.clock.runFor(200);
  await page.keyboard.press('Shift'); await page.clock.runFor(40);
  expect((await snapshot(page)).state.stats.dashes).toBe(1);
  await page.clock.runFor(3100);
  await page.keyboard.press('Shift'); await page.clock.runFor(40);
  expect((await snapshot(page)).state.stats.dashes).toBe(2);
  expect((await snapshot(page)).camera.x).toBeGreaterThan(cameraBefore);
  // Volver al inicio con UI, rodear al norte y hacer dash contra la fachada este.
  await page.keyboard.press('p'); await page.clock.runFor(32);
  await page.getByRole('button', { name: 'Reiniciar escena' }).click();
  await hold(page, ['w'], 1900); // x=1400, y≈633; pasillo entre edificios.
  await hold(page, ['d'], 1100);
  await hold(page, ['d', 'Space'], 220);
  const blocked = await snapshot(page);
  expect(blocked.state.player.x).toBeLessThanOrEqual(1713);
  expect(blocked.state.player.x).toBeGreaterThan(1695);
});

test('Phaser: automático sin clic, pausa, pérdida de foco, derrota y reinicio', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await open(page);
  await page.clock.runFor(2100);
  const auto = await snapshot(page);
  expect(auto.state.stats.autoShots).toBeGreaterThan(2);
  expect(auto.state.stats.manualShots).toBe(0);
  expect(auto.state.stats.kills).toBeGreaterThanOrEqual(1);
  await page.keyboard.press('p'); await page.clock.runFor(32);
  const paused = await snapshot(page);
  expect(paused.state.phase).toBe('paused');
  await hold(page, ['d'], 500);
  expect((await snapshot(page)).state).toEqual(paused.state);
  await page.keyboard.press('p'); await page.clock.runFor(32);
  expect((await snapshot(page)).state.phase).toBe('playing');
  await page.keyboard.down('d'); await page.clock.runFor(50);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('d'); await page.clock.runFor(32);
  expect((await snapshot(page)).state.phase).toBe('paused');
  await page.getByRole('button', { name: 'Reiniciar escena' }).click();
  for (let second = 0; second < 32 && (await snapshot(page)).state.phase === 'playing'; second += 2) {
    await page.clock.runFor(2000);
  }
  const dead = await snapshot(page);
  expect(dead.state.phase).toBe('dead'); expect(dead.state.player.hp).toBe(0);
  expect(dead.state.stats.damageReceived).toBe(100);
  await page.getByRole('button', { name: 'Reiniciar escena' }).click(); await page.clock.runFor(32);
  const reset = await snapshot(page);
  expect(reset.state.player.hp).toBe(100); expect(reset.state.stats.kills).toBe(0);
  expect(reset.state.phase).toBe('playing');
});

for (const [width, height] of [[1280, 720], [2560, 1440], [390, 844]]) {
  test(`Phaser: viewport ${width}x${height} sin desborde de HUD`, async ({ page }, info) => {
    await page.setViewportSize({ width, height }); await open(page);
    await expect(page.locator('#reference-canvas canvas')).toBeVisible();
    await expect(page.locator('#reference-hp')).toBeInViewport();
    await expect(page.locator('#reference-dash-text')).toBeInViewport();
    const state = await snapshot(page);
    expect(state.world.w).toBeGreaterThan(state.camera.width);
    expect(state.world.h).toBeGreaterThan(state.camera.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await capture(page, info, `viewport-${width}`);
  });
}
