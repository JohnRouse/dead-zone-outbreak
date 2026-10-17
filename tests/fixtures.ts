import { test as base, expect } from '@playwright/test';

// Se instala antes de navegar y permanece activo durante toda la prueba.
export const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('requestfailed', request => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    // El legacy importa Google Fonts. La suite funciona sin Internet y usa las
    // fuentes de reserva del CSS original; no se modifica el juego servido.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200, contentType: 'text/css', body: '/* Offline test: original fallback fonts. */',
    }));
    await use(errors);
    if (errors.length) await testInfo.attach('runtime-errors', {
      body: JSON.stringify(errors, null, 2), contentType: 'application/json',
    });
    expect(errors, 'Errores de JavaScript, consola o red durante la prueba').toEqual([]);
  }, { auto: true }],
});

export { expect };
