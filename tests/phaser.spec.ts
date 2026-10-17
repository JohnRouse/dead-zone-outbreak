import { test, expect } from './fixtures';
import type { Page, TestInfo } from '@playwright/test';
import type { ReferenceView } from '../src/client/phaser/ReferenceScene';
import type { ReferenceScenario } from '../src/content/reference-scenarios';
import { OBSTACLES, SPAWN_POINTS } from '../src/content/reference-district';
import { circleRect } from '../src/simulation/geometry';

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
async function open(page: Page, scenario: ReferenceScenario = 'district') {
  await page.clock.install({ time: new Date('2026-10-17T10:00:00Z') });
  await page.goto(`/phaser/?scenario=${scenario}`);
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
  expect(combat.state.stats.manualShots).toBeGreaterThanOrEqual(1);
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
  await open(page, 'contact-brute');
  await page.clock.runFor(2100);
  const auto = await snapshot(page);
  expect(auto.state.stats.autoShots).toBeGreaterThan(2);
  expect(auto.state.stats.manualShots).toBe(0);
  expect(auto.state.stats.hits).toBeGreaterThanOrEqual(1);
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
  // Dirigir manualmente al lado contrario: el enemigo alcanza al jugador sin
  // desactivar las reglas de daño ni modificar HP desde una API de pruebas.
  await page.mouse.move(880, 450); await page.mouse.down();
  for (let second = 0; second < 32 && (await snapshot(page)).state.phase === 'playing'; second += 2) {
    await page.clock.runFor(2000);
  }
  const dead = await snapshot(page);
  await page.mouse.up();
  expect(dead.state.phase).toBe('dead'); expect(dead.state.player.hp).toBe(0);
  expect(dead.state.stats.damageReceived).toBe(100);
  await page.getByRole('button', { name: 'Reiniciar escena' }).click(); await page.clock.runFor(32);
  const reset = await snapshot(page);
  expect(reset.state.player.hp).toBe(100); expect(reset.state.stats.kills).toBe(0);
  expect(reset.state.phase).toBe('playing');
});

for (const kind of ['walker', 'brute'] as const) {
  test(`Phaser: ${kind} persigue, anuncia, golpea y recupera con jugador inmóvil`, async ({ page }, info) => {
    await page.setViewportSize({ width: 960, height: 540 }); await open(page, `contact-${kind}`);
    const initial = await snapshot(page);
    await page.mouse.move(850, 480); await page.mouse.down();
    const phases = new Set<string>();
    for (let i = 0; i < 50; i++) {
      await page.clock.runFor(100);
      const state = await snapshot(page); const e = state.state.enemies[0];
      if (e) phases.add(e.phase);
      if (e?.phase === 'windup' && !phases.has('captured')) { await capture(page, info, `${kind}-prepara`); phases.add('captured'); }
      if (e?.phase === 'strike') await capture(page, info, `${kind}-golpea`);
      if (state.state.stats.damageReceived > 0 && phases.has('recover')) break;
    }
    await page.mouse.up();
    const result = await snapshot(page);
    expect(result.state.player.x).toBe(initial.state.player.x); expect(result.state.player.y).toBe(initial.state.player.y);
    expect([...phases]).toEqual(expect.arrayContaining(['chasing', 'windup', 'strike', 'recover']));
    expect(result.state.stats.damageByKind[kind]).toBeGreaterThan(0);
    expect(result.state.stats.damageReceived).toBe(kind === 'walker' ? 12 : 28);
    await capture(page, info, `${kind}-recupera`);
  });
}

test('Phaser: rodea el coche sin atravesarlo y alcanza al jugador', async ({ page }, info) => {
  await page.setViewportSize({ width: 960, height: 540 }); await open(page, 'navigation');
  await page.mouse.move(850, 490); await page.mouse.down();
  let sidestep = false;
  for (let i = 0; i < 18; i++) {
    await page.clock.runFor(400);
    const current = await snapshot(page), enemy = current.state.enemies[0];
    expect(OBSTACLES.some(rect => circleRect(enemy, enemy.radius - .01, rect))).toBe(false);
    if ((enemy.x < 1070 - enemy.radius || enemy.x > 1142 + enemy.radius) && !sidestep) { sidestep = true; await capture(page, info, 'navegacion-lateral'); }
    if (current.state.stats.damageReceived > 0) break;
  }
  await page.mouse.up(); expect(sidestep).toBe(true);
  expect((await snapshot(page)).state.stats.damageReceived).toBeGreaterThan(0);
  await capture(page, info, 'navegacion-contacto');
});

test('Phaser: puertas anuncian salida y apariciones abiertas quedan fuera de cámara', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 }); await open(page, 'door');
  const entrance = await snapshot(page);
  expect(entrance.state.enemies[0].phase).toBe('emerging');
  expect(entrance.state.spawns[0].source).toBe('door');
  expect(entrance.state.stats.shots).toBe(0);
  await capture(page, info, 'puerta-aviso');
  await page.clock.runFor(650); await capture(page, info, 'puerta-salida');
  expect((await snapshot(page)).state.stats.shots).toBe(0);
  await page.clock.runFor(750); await capture(page, info, 'puerta-final');
  // Reiniciar desde la ruta normal para comprobar solicitudes naturales.
  await page.goto('/phaser/');
  // El reloj ya está instalado y pausado; hacer avanzar solo la carga Phaser.
  for (let i = 0; i < 20 && !(await page.locator('#reference-enter').isEnabled()); i++) await page.clock.runFor(50);
  await expect(page.locator('#reference-enter')).toBeEnabled({ timeout: 20_000 });
  await page.locator('#reference-enter').click();
  await page.clock.runFor(9000);
  const normal = await snapshot(page);
  expect(normal.state.stats.spawnAccepted).toBeGreaterThanOrEqual(2);
  for (const record of normal.state.spawns) {
    const point = SPAWN_POINTS.find(p => p.id === record.pointId)!;
    expect(point).toBeDefined(); expect(record.x).toBe(point.x); expect(record.y).toBe(point.y);
    expect(record.distance).toBeGreaterThanOrEqual(300);
    expect(OBSTACLES.some(rect => circleRect(record, 29, rect))).toBe(false);
    if (record.source !== 'door') {
      expect(record.visible).toBe(false);
      const view = record.view;
      expect(record.x < view.x - 80 || record.y < view.y - 80 || record.x > view.x + view.w + 80 || record.y > view.y + view.h + 80).toBe(true);
    }
  }
  await capture(page, info, 'apariciones-validas');
});

test('Phaser: impacto, caída y cadáver antes de retirar al infectado', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 }); await open(page, 'contact-walker');
  await page.clock.runFor(180);
  const hit = await snapshot(page); expect(hit.state.enemies[0].phase).toBe('hit');
  await capture(page, info, 'muerte-01-impacto');
  await page.clock.runFor(550);
  expect((await snapshot(page)).state.enemies[0].phase).toBe('dying');
  await capture(page, info, 'muerte-02-caida');
  await page.clock.runFor(420); await capture(page, info, 'muerte-03-cadaver');
  await page.clock.runFor(900);
  expect((await snapshot(page)).state.enemies).toHaveLength(0);
  expect((await snapshot(page)).state.stats.kills).toBe(1);
});

test('Phaser: alternar clic conserva cooldown, munición y cadencia de una sola arma', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 }); await open(page, 'cadence');
  const before = await snapshot(page);
  expect(before.state.stats.shots).toBe(1); expect(before.state.weapon.ammo).toBe(9);
  await page.mouse.move(850, 450); await page.mouse.down(); await page.clock.runFor(100);
  const click = await snapshot(page);
  expect(click.state.stats.shots).toBe(1); expect(click.state.weapon.ammo).toBe(9);
  await page.mouse.up(); await page.clock.runFor(70);
  expect((await snapshot(page)).state.stats.shots).toBe(1);
  for (let i = 0; i < 55; i++) {
    if (i % 2) await page.mouse.up(); else await page.mouse.down();
    const old = await snapshot(page); await page.clock.runFor(50); const next = await snapshot(page);
    expect(next.state.stats.shots - old.state.stats.shots).toBeLessThanOrEqual(1);
    if (next.state.weapon.reload > 0) expect(next.state.weapon.ammo).toBe(0);
    expect(next.state.stats.manualShots + next.state.stats.autoShots).toBe(next.state.stats.shots);
  }
  await page.mouse.up();
  const reloading = await snapshot(page);
  expect(reloading.state.stats.shots).toBe(10);
  expect(reloading.state.weapon.ammo).toBe(0); expect(reloading.state.weapon.reload).toBeGreaterThan(0);
  await page.clock.runFor(1600);
  const resumed = await snapshot(page);
  expect(resumed.state.stats.reloads).toBe(1);
  expect(resumed.state.stats.shots).toBeGreaterThan(10);
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
