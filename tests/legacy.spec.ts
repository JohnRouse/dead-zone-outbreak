import { test, expect } from './fixtures';
import { capture, holdKeys, openLegacy, placeZombie, snapshot, startMission } from './helpers/legacy';

test.beforeEach(async ({ page }) => {
  await openLegacy(page);
});

test('Chromium dibuja el menú e inicia una misión real', async ({ page, browser }, testInfo) => {
  expect(browser.browserType().name()).toBe('chromium');
  await testInfo.attach('browser-version', { body: browser.version(), contentType: 'text/plain' });
  expect(await page.locator('#game').evaluate(canvas =>
    (canvas as HTMLCanvasElement).getContext('2d') !== null)).toBe(true);
  await capture(page, testInfo, 'menu');
  await startMission(page);
  const state = await snapshot(page);
  expect(state.player.hp).toBe(100);
  expect(state.player.supply).toBe(0);
  expect(state.time).toBeGreaterThan(0);
  await expect(page.locator('#objective')).toHaveText('RECUPERA SUMINISTROS');
  await expect(page.locator('#progress')).toHaveText('Cajas recuperadas: 0 / 3');
  await capture(page, testInfo, 'mission-start');
});

for (const [key, axis, sign] of [
  ['w', 'y', -1], ['a', 'x', -1], ['s', 'y', 1], ['d', 'x', 1],
  ['ArrowUp', 'y', -1], ['ArrowLeft', 'x', -1], ['ArrowDown', 'y', 1], ['ArrowRight', 'x', 1],
] as const) {
  test(`mueve al jugador con ${key} y se detiene al soltar`, async ({ page }) => {
    await startMission(page);
    const before = await snapshot(page);
    await holdKeys(page, [key], 400);
    const after = await snapshot(page);
    expect((after.player[axis] - before.player[axis]) * sign).toBeGreaterThan(85);
    expect((after.player[axis] - before.player[axis]) * sign).toBeLessThan(100);
    const otherAxis = axis === 'x' ? 'y' : 'x';
    expect(after.player[otherAxis]).toBeCloseTo(before.player[otherAxis], 4);
    await page.clock.runFor(160);
    expect((await snapshot(page)).player[axis]).toBeCloseTo(after.player[axis], 4);
  });
}

test('normaliza la velocidad diagonal y la cámara sigue al jugador', async ({ page }) => {
  await startMission(page);
  const before = await snapshot(page);
  await holdKeys(page, ['d'], 400);
  const straight = await snapshot(page);
  await holdKeys(page, ['d', 's'], 400);
  const diagonal = await snapshot(page);
  const distance = Math.hypot(diagonal.player.x - straight.player.x, diagonal.player.y - straight.player.y);
  expect(Math.abs(distance - (straight.player.x - before.player.x))).toBeLessThan(4);
  expect(diagonal.world.w).toBeGreaterThan(diagonal.viewport.w);
  expect(diagonal.world.h).toBeGreaterThan(diagonal.viewport.h);
  expect(diagonal.camera.x).toBeCloseTo(diagonal.player.x - diagonal.viewport.w / 2, 4);
  expect(diagonal.camera.y).toBeCloseTo(diagonal.player.y - diagonal.viewport.h / 2, 4);
});

test('apunta y mantiene disparo manual mientras se mueve; soltar detiene los disparos', async ({ page }, testInfo) => {
  await startMission(page);
  const before = await snapshot(page);
  await page.mouse.move(1000, 360);
  await page.mouse.down();
  await holdKeys(page, ['d'], 480);
  const shooting = await snapshot(page);
  expect(shooting.player.x - before.player.x).toBeGreaterThan(100);
  expect(shooting.bullets.filter(b => !b.auto).length).toBeGreaterThanOrEqual(3);
  expect(shooting.bullets.every(b => !b.auto && b.vx > 800 && Math.abs(b.vy) < 20)).toBe(true);
  await capture(page, testInfo, 'manual-fire-moving');
  await page.mouse.up();
  await page.clock.runFor(1100);
  expect((await snapshot(page)).bullets.filter(b => !b.auto)).toHaveLength(0);
});

for (const key of ['Space', 'Shift']) {
  test(`dash con ${key}: desplazamiento, invulnerabilidad y cooldown`, async ({ page }, testInfo) => {
    await startMission(page);
    const before = await snapshot(page);
    await holdKeys(page, [key], 128);
    const dashing = await snapshot(page);
    expect(dashing.player.x - before.player.x).toBeGreaterThan(100);
    expect(dashing.player.dashTime).toBeGreaterThan(0);
    expect(dashing.player.invuln).toBeGreaterThan(0);
    expect(dashing.player.dash).toBeGreaterThan(3);
    if (key === 'Space') await capture(page, testInfo, 'dash');
    await page.clock.runFor(192);
    await holdKeys(page, [key], 64);
    const cooling = await snapshot(page);
    expect(cooling.player.dashTime).toBe(0);
    expect(cooling.player.dash).toBeLessThan(dashing.player.dash);
    await page.clock.runFor(3200);
    expect((await snapshot(page)).player.dash).toBe(0);
    await expect(page.locator('#dash')).toHaveText('IMPULSO LISTO');
    await holdKeys(page, [key], 64);
    expect((await snapshot(page)).player.dashTime).toBeGreaterThan(0);
  });
}

test('pausa congela el tiempo y el movimiento; continuar reanuda', async ({ page }) => {
  await startMission(page);
  await page.keyboard.press('p');
  const paused = await snapshot(page);
  expect(paused.state).toBe('paused');
  await expect(page.getByRole('button', { name: 'CONTINUAR' })).toBeVisible();
  await holdKeys(page, ['d'], 500);
  const still = await snapshot(page);
  expect(still.time).toBe(paused.time);
  expect(still.player.x).toBe(paused.player.x);
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await holdKeys(page, ['d'], 160);
  const resumed = await snapshot(page);
  expect(resumed.state).toBe('playing');
  expect(resumed.time).toBeGreaterThan(paused.time);
  expect(resumed.player.x).toBeGreaterThan(paused.player.x);
});

test('torreta automática daña y elimina un objetivo controlado sin clic', async ({ page }, testInfo) => {
  await startMission(page);
  await placeZombie(page, 180);
  await page.clock.runFor(96);
  const fired = await snapshot(page);
  expect(fired.bullets.some(b => b.auto && b.vx > 600)).toBe(true);
  await capture(page, testInfo, 'automatic-fire-controlled');
  await page.clock.runFor(400);
  expect((await snapshot(page)).zombies[0].hp).toBe(44);
  await page.clock.runFor(2000);
  expect((await snapshot(page)).player.kills).toBe(1);
  await expect(page.locator('#kills')).toHaveText('1');
});

test('recoge suministros mediante movimiento de teclado sin alterar el estado', async ({ page }, testInfo) => {
  await startMission(page);
  await holdKeys(page, ['a'], 1440);
  await holdKeys(page, ['w'], 240);
  const collected = await snapshot(page);
  expect(collected.player.supply).toBe(1);
  await expect(page.locator('#progress')).toHaveText('Cajas recuperadas: 1 / 3');
  await capture(page, testInfo, 'first-supply');
});

test('completa las tres cajas y evacúa recorriendo el mapa con teclado', async ({ page }, testInfo) => {
  await startMission(page);
  await holdKeys(page, ['a'], 1440);
  await holdKeys(page, ['w'], 240);
  expect((await snapshot(page)).player.supply).toBe(1);
  await holdKeys(page, ['d'], 2800);
  await holdKeys(page, ['s'], 640);
  expect((await snapshot(page)).player.supply).toBe(2);
  await holdKeys(page, ['a'], 1120);
  await holdKeys(page, ['s'], 1392);
  expect((await snapshot(page)).player.supply).toBe(3);
  await expect(page.locator('#objective')).toHaveText('LLEGA A LA EVACUACIÓN');
  // El edificio del norte bloquea la aproximación frontal: rodear por el este.
  await holdKeys(page, ['d'], 464);
  await holdKeys(page, ['w'], 4848);
  await capture(page, testInfo, 'evacuation-approach');
  await holdKeys(page, ['a'], 400);
  const end = await snapshot(page);
  expect(end.state).toBe('won');
  expect(end.won).toBe(true);
  await expect(page.locator('#overlay .eyebrow')).toHaveText('MISIÓN COMPLETADA');
  await capture(page, testInfo, 'victory');
});

test('el edificio del norte bloquea al jugador y la cámara respeta el borde', async ({ page }) => {
  await startMission(page);
  await holdKeys(page, ['w'], 3000);
  const blocked = await snapshot(page);
  expect(blocked.player.y).toBeGreaterThanOrEqual(330);
  expect(blocked.player.y).toBeLessThan(335);
  await holdKeys(page, ['d'], 720);
  await holdKeys(page, ['w'], 2200);
  const edge = await snapshot(page);
  expect(edge.player.y).toBe(15);
  expect(edge.camera.y).toBe(0);
});

test('contacto causa daño y derrota; reiniciar restaura la misión (escenario controlado)', async ({ page }) => {
  await startMission(page);
  await placeZombie(page, 0);
  await page.clock.runFor(16);
  expect((await snapshot(page)).player.hp).toBe(88);
  await page.clock.runFor(160);
  expect((await snapshot(page)).player.hp).toBe(88);
  await page.clock.runFor(6500);
  const dead = await snapshot(page);
  expect(dead.state).toBe('dead');
  expect(dead.player.hp).toBe(0);
  await expect(page.locator('#overlay .eyebrow')).toHaveText('MISIÓN FALLIDA');
  await page.getByRole('button', { name: 'VOLVER A JUGAR' }).click();
  await page.clock.runFor(32);
  const restarted = await snapshot(page);
  expect(restarted.state).toBe('playing');
  expect(restarted.player.hp).toBe(100);
  expect(restarted.player.kills).toBe(0);
  expect(restarted.player.supply).toBe(0);
});

test('partida de 20 segundos con aparición natural de enemigos y capturas', async ({ page }, testInfo) => {
  await startMission(page);
  await page.mouse.move(1000, 360);
  await page.mouse.down();
  await page.clock.runFor(8000);
  expect((await snapshot(page)).zombies.length).toBeGreaterThan(0);
  await capture(page, testInfo, 'natural-play-08s');
  await holdKeys(page, ['s'], 1200);
  await holdKeys(page, ['a', 'Space'], 160);
  await page.clock.runFor(10640);
  await page.mouse.up();
  const state = await snapshot(page);
  expect(state.time).toBeGreaterThan(19);
  expect(state.state).toBe('playing');
  await capture(page, testInfo, 'natural-play-20s');
});
