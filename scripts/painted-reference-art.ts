// Composición SVG de materiales pintados y detalles originales, mismas huellas v2.
// El atlas PNG se conserva sin alterar; solo se referencia dentro de patrones SVG.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { BUILDINGS, PROPS } from '../src/content/reference-district';
const base = 'public/assets';
for (const dir of ['world/painted-v3', 'vfx/painted-v3', 'characters/painted-v3']) mkdirSync(`${base}/${dir}`, { recursive: true });
const material = readFileSync(`${base}/world/painted-v3/material-atlas.png`).toString('base64');
const propsImage = readFileSync(`${base}/world/painted-v3/props-atlas.png`).toString('base64');
const propsData: { size: { w: number; h: number }; frames: Record<string, { x: number; y: number; w: number; h: number }> } = JSON.parse(readFileSync(`${base}/world/painted-v3/props-atlas.json`, 'utf8'));
const outline = '#142630';
const path = (d: string, fill: string, stroke = outline, width = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, radius = 0, stroke = 'none', sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const svg = (w: number, h: number, body: string, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const linear = (id: string, a: string, b: string, c?: string) => `<linearGradient id="${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${a}"/>${c ? `<stop offset=".5" stop-color="${c}"/>` : ''}<stop offset="1" stop-color="${b}"/></linearGradient>`;
let defs = `<image id="material" width="1254" height="1254" href="data:image/png;base64,${material}"/>`;
defs += `<image id="painted-props" width="${propsData.size.w}" height="${propsData.size.h}" href="data:image/png;base64,${propsImage}"/><radialGradient id="object-shadow"><stop stop-color="#0a1d29" stop-opacity=".8"/><stop offset=".7" stop-color="#0b202c" stop-opacity=".45"/><stop offset="1" stop-color="#0b202c" stop-opacity="0"/></radialGradient>`;
function prop(name: string, x: number, y: number, w: number, h: number) {
  const source = propsData.frames[name];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${source.x} ${source.y} ${source.w} ${source.h}" preserveAspectRatio="none" overflow="hidden"><use href="#painted-props"/></svg>`;
}
for (const [name, x, y, ground, opacity, size] of [
  ['asphalt', 0, 0, '#203744', .31, 420], ['plaster', 627, 0, '#446963', .52, 350],
  ['roof', 0, 627, '#344b58', .48, 380], ['concrete', 627, 627, '#4e6267', .31, 360],
] as const) {
  defs += `<pattern id="${name}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${rect(0, 0, size, size, ground)}<svg width="${size}" height="${size}" viewBox="${x} ${y} 627 627" overflow="hidden"><use href="#material" opacity="${opacity}"/></svg></pattern>`;
}
defs += linear('wet', '#315e69', '#1a394b', '#264d5c') + linear('car-paint', '#c18b65', '#634851', '#ad6751')
  + linear('glass', '#779a9f', '#183541', '#345766') + linear('wood', '#c0a16c', '#685443', '#97805c')
  + linear('leaf', '#769969', '#263f40', '#3c6e5d') + linear('metal', '#a5aba0', '#354a56', '#718581')
  + linear('window', '#f0c17d', '#684c3e', '#ba8350') + linear('sign', '#416267', '#182e3b');
BUILDINGS.forEach((b, i) => { defs += linear(`wall-${i}`, b.color, '#253b48', b.color); });
let world = readFileSync(`${base}/world/district.svg`, 'utf8');
// Sustituir solo las instancias existentes; mantener sus coordenadas y huellas.
for (const [index, p] of PROPS.entries()) {
  const original = new RegExp(`<g transform="translate\\(${p.x} ${p.y}\\)">[\\s\\S]*?</g>`);
  const image = prop(p.kind === 'car' ? (index === 0 ? 'red-car' : 'blue-car') : 'barricade', 0, 0, p.w, p.h);
  world = world.replace(original, `<g transform="translate(${p.x} ${p.y})"><ellipse cx="${p.w / 2 + 5}" cy="${p.h / 2 + 6}" rx="${p.w * .72}" ry="${p.h * .55}" fill="url(#object-shadow)"/>${image}</g>`);
}
// Los grupos de arbusto contienen grupos de hojas. Recorrer el balance de tags,
// no cortar en el primer cierre de una hoja. No se cambian posiciones ni escala.
const plants = [...world.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)">/g)]
  .filter(match => world.startsWith('<ellipse cx="7" cy="18"', match.index! + match[0].length));
for (const match of plants.reverse()) {
  const start = match.index!, tags = /<g\b[^>]*>|<\/g>/g; tags.lastIndex = start;
  let depth = 0, end = start;
  for (let tag = tags.exec(world); tag; tag = tags.exec(world)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = tags.lastIndex; break; }
  }
  const replace = `${match[0]}<ellipse cx="3" cy="12" rx="48" ry="24" fill="url(#object-shadow)"/>${prop('shrub', -43, -42, 86, 80)}</g>`;
  world = world.slice(0, start) + replace + world.slice(end);
}
world = world.replaceAll('fill="#203744"', 'fill="url(#asphalt)"')
  .replaceAll('fill="#42565e"', 'fill="url(#roof)"')
  .replaceAll('fill="#2b5662"', 'fill="url(#wet)"')
  .replaceAll('fill="#a8614e"', 'fill="url(#car-paint)"')
  .replaceAll('fill="#244451"', 'fill="url(#glass)"')
  .replaceAll('fill="#bd9669"', 'fill="url(#wood)"')
  .replaceAll('fill="#477a62"', 'fill="url(#leaf)"').replaceAll('fill="#346158"', 'fill="url(#leaf)"')
  .replaceAll('fill="#d3a46c"', 'fill="url(#window)"')
  .replaceAll('fill="#b17b4d"', 'fill="url(#window)"').replaceAll('fill="#243d46"', 'fill="url(#sign)"');
for (const color of ['#42565d', '#3d5159', '#465b61', '#3b5057']) world = world.replaceAll(`fill="${color}"`, 'fill="url(#concrete)"');
world = world.replace(/stroke-width="([\d.]+)"/g, (_match, width: string) => `stroke-width="${Number(width) * .8}"`)
  .replaceAll('stroke="#354951"', 'stroke="#526b7260"');
BUILDINGS.forEach((b, i) => {
  world = world.replaceAll(`fill="${b.color}"`, `fill="url(#wall-${i})"`);
  const wall = new RegExp(`(<rect x="4" y="${b.h - 120}" width="${b.w - 8}" height="116"[^>]*/>)`);
  world = world.replace(wall, `$1${rect(5, b.h - 119, b.w - 10, 114, 'url(#plaster)').replace('/>', ' opacity=".25"/>')}`);
});
// Detalles finos colocados sobre las mismas fachadas, fuera del área de texto.
let detail = '';
for (const [i, b] of BUILDINGS.entries()) {
  detail += `<g transform="translate(${b.x} ${b.y})">`;
  // Tubería de desagüe con abrazaderas y remate de volumen.
  const drain = b.w - 18;
  detail += path(`M${drain} ${b.h - 118} v96 l-9 10`, 'none', '#172f3c', 10)
    + path(`M${drain - 2} ${b.h - 118} v96 l-9 10`, 'none', '#738b89', 4);
  for (const dy of [72, 33]) detail += path(`M${drain - 8} ${b.h - dy} h13`, 'none', '#afad8e', 3);
  // Huellas de humedad y yeso desprendido en zócalos.
  detail += path(`M8 ${b.h - 19} l34 -4 17 8 23 -4 39 9 20 -3 20 8 H8Z`, '#1f3942', 'none');
  detail += path(`M${b.w - 157} ${b.h - 13} l27 -12 21 6 23 -5 31 16Z`, '#243e47', 'none');
  for (let j = 0; j < 5; j++) detail += path(`M${30 + j * 22} ${b.h - 103} v${6 + j % 3 * 5}`, 'none', '#192f3a', 1.6);
  // Placas de edificio, marcos con cantos claros y bisagras.
  detail += rect(b.w / 2 + 57, b.h - 75, 29, 22, '#1c3440', 3, '#829088')
    + `<text x="${b.w / 2 + 72}" y="${b.h - 60}" font-family="Arial" font-size="12" text-anchor="middle" font-weight="bold" fill="#c4b898">0${i + 1}</text>`;
  detail += path(`M${b.w / 2 - 31} ${b.h - 80} v67`, 'none', '#c1b791', 1.7);
  // Pintura desgastada de los rótulos sin invadir sus letras.
  const signW = b.name.length > 7 ? 270 : 232;
  detail += path(`M${b.w / 2 - signW / 2 + 18} ${b.h - 121} h24 m12 0 h12 M${b.w / 2 + signW / 2 - 40} ${b.h - 162} h20`, 'none', '#8e9b89', 1.3);
  detail += '</g>';
}
// Reflejos rotos y huellas, contenidos en la calzada y charcos existentes.
for (const [x, y] of [[1280, 975], [1530, 1235], [1840, 1045], [930, 1175]]) {
  detail += `<g opacity=".3">${path(`M${x - 24} ${y} l58 -2 M${x - 15} ${y + 5} l25 -1 M${x + 5} ${y + 10} l30 -1`, 'none', '#9ebcaa', 1.5)}</g>`;
}
world = world.replace('</g></svg>', `${detail}</g></svg>`).replace('<defs></defs>', `<defs>${defs}</defs>`);
writeFileSync(`${base}/world/painted-v3/district.svg`, world);

const rifleDefs = linear('steel', '#b1beb5', '#263c47', '#5d777c') + linear('stock', '#ac8655', '#3b4644', '#706247')
  + linear('grip', '#657a77', '#213a45');
let rifle = path('M7 10 Q4 8 3 13 L4 29 15 30 30 24 H48 L61 18 106 16 110 25 57 28 43 23 29 30 14 28Z', 'url(#stock)', outline, 2.6)
  + path('M32 13 L88 12 97 17 98 26 47 27 33 22Z', 'url(#steel)', outline, 2.2)
  + path('M41 25 L53 27 50 39 40 36Z', 'url(#grip)', outline, 2)
  + path('M60 26 L74 27 72 37 60 35Z', '#3c5358', outline, 2)
  + rect(95, 17, 30, 7, '#304752', 2, outline, 2) + rect(119, 15, 7, 11, 'url(#steel)', 2, outline)
  + rect(47, 7, 21, 6, '#263e4a', 2, '#102c38') + rect(50, 8, 13, 3, '#a6cab7', 1)
  + path('M76 17 H93 M76 21 H91 M38 17 H65', 'none', '#c4c5a5', 1.5)
  + path('M49 28 Q58 23 63 28 L63 33 Q54 38 48 33Z', '#ba8b63', '#3d3e38', 1.8)
  + path('M29 25 Q36 19 42 23 L44 28 Q38 33 32 31Z', '#d2a078', '#3d3e38', 1.8);
writeFileSync(`${base}/characters/painted-v3/rifle.svg`, svg(130, 43, rifle, rifleDefs));
writeFileSync(`${base}/vfx/painted-v3/contact-shadow.svg`, svg(128, 64, '<ellipse cx="64" cy="32" rx="64" ry="32" fill="url(#shade)"/>', '<radialGradient id="shade"><stop stop-color="#071a24" stop-opacity=".9"/><stop offset=".5" stop-color="#081d28" stop-opacity=".6"/><stop offset="1" stop-color="#0a202b" stop-opacity="0"/></radialGradient>'));
writeFileSync(`${base}/vfx/painted-v3/muzzle.svg`, svg(96, 64,
  path('M4 32 Q20 25 29 17 L36 26 63 7 57 27 91 31 59 38 65 56 37 40 28 47 24 37Z', '#f6b84e', '#db8140', 1) +
  path('M4 32 L33 26 56 30 36 36Z', '#fff6c9', 'none')));
console.log('Composición pintada v3 generada sin cambios de geometría de juego.');
