// Extrae metadatos de recorte para Phaser; conserva intacto el PNG generado.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/');
  const result = await page.evaluate(async () => {
    const picture = new Image(); picture.src = '/assets/characters/painted-v3/survivor-infected-atlas.png'; await picture.decode();
    const canvas = document.createElement('canvas'); canvas.width = picture.width; canvas.height = picture.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const rows = [{ name: 'survivor', y: 0, h: 405 }, { name: 'walker', y: 408, h: 390 }, { name: 'brute', y: 798, h: 456 }];
    const frames = {};
    for (const row of rows) {
      const columns = row.name === 'brute'
        ? [{ name: 'body', x: 0, w: 478 }, { name: 'left-arm', x: 478, w: 212 }, { name: 'right-arm', x: 690, w: 300 }, { name: 'leg', x: 990, w: 264 }]
        : [{ name: 'body', x: 0, w: 450 }, { name: 'left-arm', x: 450, w: 220 }, { name: 'right-arm', x: 670, w: 320 }, { name: 'leg', x: 990, w: 264 }];
      for (const column of columns) {
        let left = column.x + column.w, top = row.y + row.h, right = column.x, bottom = row.y;
        for (let y = row.y; y < row.y + row.h; y++) for (let x = column.x; x < column.x + column.w; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 28) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
        }
        const frame = { x: Math.max(column.x, left - 2), y: Math.max(row.y, top - 2),
          w: Math.min(column.x + column.w, right + 3) - Math.max(column.x, left - 2),
          h: Math.min(row.y + row.h, bottom + 3) - Math.max(row.y, top - 2) };
        frames[`${row.name}-${column.name}`] = { frame, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: frame.w, h: frame.h }, sourceSize: { w: frame.w, h: frame.h } };
      }
    }
    return { frames, meta: { image: 'survivor-infected-atlas.png', size: { w: canvas.width, h: canvas.height }, scale: '1' }, alphaAtCorner: pixels[3] };
  });
  if (result.alphaAtCorner !== 0) throw new Error('El atlas debe tener transparencia real.');
  await writeFile('public/assets/characters/painted-v3/atlas.json', JSON.stringify({ frames: result.frames, meta: result.meta }, null, 2));
  const props = await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/world/painted-v3/props-atlas.png'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const half = canvas.width / 2;
    const regions = [['red-car', 0, 0], ['barricade', half, 0], ['shrub', 0, half], ['blue-car', half, half]];
    const frames = {};
    for (const [name, x, y] of regions) {
      let minX = x + half, minY = y + half, maxX = x, maxY = y;
      for (let py = y; py < y + half; py++) for (let px = x; px < x + half; px++) if (pixels[(py * canvas.width + px) * 4 + 3] > 28) {
        minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
      }
      frames[name] = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    if (pixels[3] !== 0) throw new Error('Los props requieren alpha real.');
    return { size: { w: image.width, h: image.height }, frames };
  });
  await writeFile('public/assets/world/painted-v3/props-atlas.json', JSON.stringify(props, null, 2));
  console.log(JSON.stringify({ actors: Object.keys(result.frames), props }));
} finally { await browser.close(); }
