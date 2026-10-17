// Recorrido real en Chromium, sin reloj simulado ni mutación del estado del juego.
// Usar con Vite iniciado: npm run record:reference
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = 'test-results/reference-iteration-2';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 },
  recordVideo: { dir: directory, size: { width: 1280, height: 720 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
const url = process.env.REFERENCE_URL ?? 'http://127.0.0.1:5173/phaser/';
const states = [];
try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Entrar al distrito' }).click();
  const state = () => page.evaluate(() => window.__DZO_REFERENCE__.snapshot());
  await page.mouse.move(1030, 330);
  // Esperas cortas reproducen la duración de entradas humanas; no sustituyen aserciones.
  await page.waitForTimeout(1000);
  states.push(await state()); await page.screenshot({ path: `${directory}/real-01-inicio.png` });
  await page.keyboard.down('s'); await page.mouse.down(); await page.waitForTimeout(850);
  await page.keyboard.down('Space'); await page.waitForTimeout(170); await page.keyboard.up('Space');
  await page.keyboard.up('s'); await page.mouse.up();
  states.push(await state()); await page.screenshot({ path: `${directory}/real-02-dash.png` });
  await page.keyboard.down('a'); await page.waitForTimeout(700); await page.keyboard.up('a');
  await page.waitForTimeout(900);
  states.push(await state()); await page.screenshot({ path: `${directory}/real-03-combate.png` });
  await page.keyboard.down('w'); await page.mouse.move(1100, 180); await page.mouse.down();
  await page.waitForTimeout(1100); await page.keyboard.up('w'); await page.mouse.up();
  await page.waitForTimeout(1500);
  states.push(await state()); await page.screenshot({ path: `${directory}/real-04-calle.png` });
  const final = states.at(-1).state;
  if (final.stats.manualShots === 0 || final.stats.autoShots === 0 || final.stats.dashes === 0 || final.stats.kills === 0) {
    throw new Error('El recorrido real debe ejercitar ambos modos, dash y bajas.');
  }
  if (final.time < 4) throw new Error('El reloj real no avanzó lo suficiente.');
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${directory}/real-session.json`, JSON.stringify({ url, browser: browser.version(), errors, states }, null, 2));
  const video = page.video();
  await context.close(); await video.saveAs(`${directory}/partida-real.webm`);
  console.log(JSON.stringify({ time: final.time, stats: final.stats, video: `${directory}/partida-real.webm` }, null, 2));
} finally { await browser.close(); }
