import { test, expect } from './fixtures';

test('abre la página del proyecto sin errores de JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DEAD ZONE: OUTBREAK' })).toBeVisible();
  await page.getByRole('link', { name: /Abrir prototipo/ }).click();
  await expect(page.getByRole('button', { name: 'INICIAR MISIÓN' })).toBeVisible();
  await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  // Recorre también el bucle real del navegador, sin instalar el reloj simulado.
  await expect(page.locator('#clock')).not.toHaveText('00:00');
});

test('captura pantalla para revisión visual', async ({ page }, testInfo) => {
  await page.goto('/');
  const path = testInfo.outputPath('dead-zone-smoke.png');
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach('portada', { path, contentType: 'image/png' });
});
