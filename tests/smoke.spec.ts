import { test, expect } from '@playwright/test';

test('abre la página del proyecto sin errores de JavaScript', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DEAD ZONE: OUTBREAK' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('captura pantalla para revisión visual', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'test-results/dead-zone-smoke.png', fullPage: true });
});
