import { test, expect } from './fixtures';

test('dos navegadores crean y comparten sala, eligen clases exclusivas y recargan para reconectar', async ({ page, browser }, testInfo) => {
  // Dos contextos: cookies y sessionStorage independientes, dos conexiones reales.
  const other = await browser.newContext();
  const second = await other.newPage();
  const errors: string[] = [];
  second.on('pageerror', error => errors.push(error.message));
  second.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto('/multiplayer');
    await page.getByLabel('Tu nombre').fill('Ana');
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.locator('#room-id')).not.toBeEmpty();
    const id = await page.locator('#room-id').textContent();
    await second.goto('http://127.0.0.1:4173/multiplayer');
    await second.getByLabel('Tu nombre').fill('Luis');
    await second.getByLabel('ID de sala').fill(id!);
    await second.getByRole('button', { name: 'Entrar por ID', exact: true }).click();
    await expect(page.locator('#roster li')).toHaveCount(2);
    await expect(second.locator('#roster li')).toHaveCount(2);
    await page.getByRole('button', { name: 'Médica', exact: false }).click();
    await expect(second.locator('#class-medic')).toBeDisabled();
    await second.locator('#class-soldier').click();
    await expect(page.locator('#roster')).toContainText('Luis · Soldado · Conectado');
    await expect(page.locator('#server-timer')).toContainText('Selección:');
    const shot = testInfo.outputPath('multiplayer-two-players.png');
    await page.screenshot({ path: shot, fullPage: true });
    await testInfo.attach('sala-con-dos-jugadores', { path: shot, contentType: 'image/png' });
    await second.reload();
    await expect(second.locator('#room-id')).toHaveText(id!);
    await expect(second.locator('#roster')).toContainText('Luis (tú) · Soldado · Conectado');
    await expect(page.locator('#roster li')).toHaveCount(2);
    await second.getByRole('button', { name: 'Salir de la sala', exact: true }).click();
    await expect(page.locator('#roster li')).toHaveCount(1);
    await expect(page.locator('#class-soldier')).toBeEnabled();
    expect(errors).toEqual([]);
    await page.getByRole('button', { name: 'Salir de la sala', exact: true }).click();
  } finally { await other.close(); }
});

test('el navegador muestra asignación automática y los cinco segundos del servidor', async ({ page }, testInfo) => {
  test.setTimeout(50_000);
  await page.goto('/multiplayer');
  await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
  await expect(page.locator('#server-timer')).toHaveText(/Selección: (29|30) s/);
  await expect(page.locator('#phase-label')).toHaveText('Preparando equipo', { timeout: 33_000 });
  await expect(page.locator('#roster')).toContainText('Soldado');
  await expect(page.locator('#server-timer')).toHaveText(/Comienza en [1-5] s/);
  const shot = testInfo.outputPath('multiplayer-countdown.png');
  await page.screenshot({ path: shot, fullPage: true });
  await testInfo.attach('cuenta-regresiva-servidor', { path: shot, contentType: 'image/png' });
  await expect(page.locator('#phase-label')).toHaveText('Equipo preparado', { timeout: 7000 });
  await expect(page.locator('#class-soldier')).toBeDisabled();
  await page.getByRole('button', { name: 'Salir de la sala', exact: true }).click();
});
