import { test, expect } from './fixtures';
import { capture, openLegacy, snapshot, startMission } from './helpers/legacy';

test.beforeEach(async ({ page }) => {
  await openLegacy(page);
  await startMission(page);
});

test('la experiencia abre tres mejoras y la elección real aplica disparo triple (controlado)', async ({ page }, testInfo) => {
  // Se prepara XP cerca del umbral, pero es update() quien recoge el drop,
  // aumenta el nivel y abre las cartas. Math.random fijo SOLO al sortear cartas.
  await page.evaluate(`{
    player.xp = player.need - 1;
    drops.push({x: player.x, y: player.y, kind: 'xp', amount: 1});
    const originalRandom = Math.random;
    try { Math.random = () => 0.75; update(0.016); }
    finally { Math.random = originalRandom; }
  }`);
  const upgraded = await snapshot(page);
  expect(upgraded.state).toBe('upgrade');
  expect(upgraded.player.level).toBe(2);
  expect(upgraded.player.maxhp).toBe(107);
  await expect(page.locator('.upgrade-card')).toHaveCount(3);
  await capture(page, testInfo, 'upgrade-controlled');
  await page.getByRole('button', { name: /DISPARO TRIPLE/ }).click();
  expect((await snapshot(page)).state).toBe('playing');
  expect((await snapshot(page)).player.autoPattern).toBe(3);
  await page.evaluate(`zombies.push({x: player.x+180, y: player.y, r:16, hp:600, maxhp:600,
    speed:0, damage:12, color:'#78a381', kind:'walker', hit:0, attack:0, anim:0})`);
  await page.clock.runFor(32);
  expect((await snapshot(page)).bullets.filter(b => b.auto)).toHaveLength(3);
});

test('defecto conocido: al agotar mejoras debe ofrecer salida en vez de bloquear la partida', async ({ page }, testInfo) => {
  await page.evaluate(`{
    player.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, u.max]));
    levelUp();
  }`);
  expect((await snapshot(page)).state).toBe('upgrade');
  await expect(page.locator('#upgrade')).toBeVisible();
  await expect(page.locator('.upgrade-card')).toHaveCount(0);
  await capture(page, testInfo, 'exhausted-upgrades-known-bug');
  // La precondición ya se verificó; solo se espera el fallo de aceptación.
  test.fail(true, 'DZO-001: todas las mejoras al máximo dejan un modal sin opciones.');
  await page.keyboard.press('Escape');
  expect((await snapshot(page)).state, 'Debe existir una salida del selector vacío').toBe('playing');
});

test('defecto conocido: el mundo debe superar también una ventana QHD', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.clock.runFor(32);
  const state = await snapshot(page);
  expect(state.viewport.w).toBe(2560);
  await capture(page, testInfo, 'qhd-map-known-bug');
  test.fail(true, 'DZO-002: WORLD.w=2250 es menor que el viewport QHD de 2560.');
  expect(state.world.w).toBeGreaterThan(state.viewport.w);
});

test('documenta la interfaz en una ventana estrecha sin afirmar soporte táctil', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(32);
  await capture(page, testInfo, 'narrow-ui');
  await expect(page.locator('#game')).toBeVisible();
});
