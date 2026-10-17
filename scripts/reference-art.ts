// Arte vectorial original de la escena de referencia. Reproducible, sin descargas.
// Ejecutar: npx tsx scripts/reference-art.ts
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { BUILDINGS, LAMPS, PROPS, WORLD } from '../src/content/reference-district';
const base = 'public/assets';
for (const directory of ['world', 'characters', 'enemies', 'vfx']) mkdirSync(`${base}/${directory}`, { recursive: true });
const outline = '#172b35';
function svg(w: number, h: number, body: string, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
function save(file: string, body: string) { writeFileSync(`${base}/${file}`, body); }
let seed = 108;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
function path(d: string, fill: string, stroke = outline, width = 3) { return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`; }
function rect(x: number, y: number, w: number, h: number, fill: string, r = 0, stroke = 'none', sw = 3) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function ellipse(x: number, y: number, rx: number, ry: number, fill: string, stroke = 'none', sw = 3) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function text(x: number, y: number, value: string, size: number, fill: string, extra = '') {
  return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-weight="800" font-size="${size}" fill="${fill}" ${extra}>${value}</text>`;
}
function plant(x: number, y: number, size = 1) {
  let result = `<g transform="translate(${x} ${y}) scale(${size})">${ellipse(7, 18, 38, 17, '#172d32')}`;
  for (let i = 0; i < 8; i++) {
    const angle = i * 45 + random() * 20;
    result += `<g transform="rotate(${angle})">${path('M0 7 Q-27 -5 -10 -44 Q13 -40 8 -4 Z', i % 2 ? '#477a62' : '#346158', '#203d40', 2)}${path('M0 4 L-7 -30', 'none', '#73a27a', 1.5)}</g>`;
  }
  return result + '</g>';
}
let ground = rect(0, 0, WORLD.w, WORLD.h, '#263f4b');
// Pavimento pintado, con losas imperfectas y fisuras; carretera en cruz.
for (let y = 0; y < WORLD.h; y += 78) for (let x = 0; x < WORLD.w; x += 105) {
  const j = random() * 7;
  ground += path(`M${x + 3} ${y + j} l97 2 -3 68 -97 -1 Z`, ['#42565d', '#3d5159', '#465b61', '#3b5057'][Math.floor(random() * 4)], '#30464f', 2);
  if (random() < .25) ground += path(`M${x + 23} ${y + 4} l9 24 -8 8 15 29`, 'none', '#293f48', 1.8);
}
ground += rect(0, 890, WORLD.w, 425, '#203744') + rect(1200, 0, 490, WORLD.h, '#203744');
ground += path('M0 886 H1196 V0 M1694 0 V886 H2800 M0 1319 H1196 V2100 M1694 2100 V1319 H2800', 'none', '#6a8080', 11);
ground += path('M0 901 H1184 V0 M1710 0 V901 H2800 M0 1305 H1184 V2100 M1710 2100 V1305 H2800', 'none', '#132e3b', 8);
for (let i = 0; i < 700; i++) {
  const x = random() * WORLD.w, y = random() * WORLD.h;
  ground += ellipse(x, y, 1 + random() * 3, .6 + random(), random() < .5 ? '#65818a' : '#142e3d');
}
// Marquage usé, traversées piétonnes et couvercles d'égout.
for (let x = 50; x < WORLD.w; x += 165) {
  if (x > 1100 && x < 1720) continue;
  ground += path(`M${x} 1094 l90 -1 -5 6 -88 2 Z`, '#a29870', 'none');
}
for (let y = 60; y < WORLD.h; y += 150) {
  if (y > 800 && y < 1350) continue;
  ground += rect(1438, y, 5, 72, '#9f9c77', 2);
}
for (let i = 0; i < 6; i++) {
  ground += path(`M${1216 + i * 73} 844 l42 -1 3 41 -45 0 Z`, '#93aaa1', '#405963', 3);
  ground += path(`M${1216 + i * 73} 1326 l42 -1 3 41 -45 0 Z`, '#93aaa1', '#405963', 3);
}
for (const p of [{x: 1515,y: 1130}, {x: 780,y: 1090}, {x: 1450,y: 1550}]) {
  ground += ellipse(p.x, p.y + 3, 34, 24, '#112c39') + ellipse(p.x, p.y, 31, 23, '#3f5961', outline, 3);
  for (let i = -2; i <= 2; i++) ground += path(`M${p.x - 20} ${p.y + i * 6} h40`, 'none', '#223b47', 3);
}
// Charcos orgánicos con bordes de luz quebrados.
for (const p of [{x: 1330,y: 982,s: 1.2}, {x: 1580,y: 1238,s: 1}, {x: 970,y: 1180,s: .7}, {x: 1880,y: 1040,s: 1.1}, {x: 1430,y: 600,s: .9}]) {
  ground += `<g transform="translate(${p.x} ${p.y}) scale(${p.s})">${path('M-100 7 Q-125 -18 -72 -28 Q-40 -54 6 -25 Q61 -38 95 -12 Q124 2 75 19 Q54 40 10 26 Q-30 41 -70 20 Z', '#2b5662', '#335f6b', 2)}${path('M-72 -21 Q-43 -37 -13 -26 M15 23 Q48 30 73 14 M-64 9 L-26 7 M20 -8 L69 -10', 'none', '#6a9c9f', 2)}${path('M-40 -6 H22 M-13 -1 H53', 'none', '#518b91', 3)}</g>`;
}
// Hojas, papeles y marcas de neumáticos.
ground += path('M760 970 Q1270 940 1550 1010 Q1900 1110 2260 1090 M760 1000 Q1270 970 1550 1040 Q1900 1140 2260 1120', 'none', '#172f3d', 6);
for (let i = 0; i < 100; i++) {
  const x = 700 + random() * 1500, y = 840 + random() * 600;
  ground += `<g transform="translate(${x} ${y}) rotate(${random() * 180})">${i % 4 === 0 ? path('M0 0 l13 -2 3 12 -12 2 Z', '#a8b2a1', '#45565b', 1) : path('M0 0 Q-6 -8 9 -13 Q14 -2 0 0Z', '#8e8b57', '#283e43', 1)}</g>`;
}
function building(b: typeof BUILDINGS[number]) {
  const { x, y, w, h, color, name, sign } = b;
  let result = `<g transform="translate(${x} ${y})">`;
  result += path(`M18 20 L${w + 36} 38 ${w + 65} ${h + 35} 45 ${h + 48} -8 ${h - 15} Z`, '#122934', 'none');
  result += rect(0, 0, w, h, color, 8, outline, 6);
  result += rect(4, h - 120, w - 8, 116, color, 3, outline, 4);
  // Briques et fissures de façade.
  for (let j = h - 112; j < h - 5; j += 22) {
    result += path(`M5 ${j} H${w - 5}`, 'none', '#182e3970', 2);
    for (let i = (j % 44 ? 8 : 40); i < w - 10; i += 65) result += path(`M${i} ${j} v22`, 'none', '#182e3960', 2);
  }
  result += path(`M15 16 H${w - 16} V${h - 122} H15 Z`, '#31434f', outline, 5);
  result += path(`M27 28 H${w - 28} V${h - 137} H27 Z`, '#42565e', '#6d8581', 4);
  for (let j = 45; j < h - 145; j += 30) result += path(`M30 ${j} H${w - 31}`, 'none', '#354951', 2);
  result += path(`M40 30 L40 ${h - 153} L${w - 35} ${h - 153}`, 'none', '#5d7678', 4);
  // Ventilación y tubos con volumen dibujado.
  result += rect(65, 72, 140, 92, '#233844', 8, outline, 4) + rect(57, 60, 140, 92, '#758383', 8, outline, 4);
  result += ellipse(127, 106, 34, 32, '#324953', outline, 3);
  for (let i = 0; i < 5; i++) result += `<g transform="translate(127 106) rotate(${i * 72})">${path('M0 0 Q-32 -28 -10 -28 Q10 -19 0 0Z', '#7c9390', '#223943', 2)}</g>`;
  result += path(`M196 99 H260 V${h - 153}`, 'none', outline, 15) + path(`M196 96 H260 V${h - 153}`, 'none', '#8a9990', 8);
  result += rect(w - 142, 73, 75, 88, '#283d48', 5, outline, 4) + rect(w - 148, 65, 75, 88, '#61797c', 5, outline, 4);
  for (let j = 78; j < 144; j += 10) result += path(`M${w - 138} ${j} h54`, 'none', '#2f4953', 3);
  result += path(`M${w - 82} 217 l-48 16 9 30 -27 20 31 34`, 'none', '#213b45', 3);
  // Ventanas y puerta cerrada: coinciden con la huella sólida.
  for (const wx of [40, w - 138]) {
    result += rect(wx, h - 94, 98, 63, '#182d39', 5, outline, 4);
    result += rect(wx + 7, h - 87, 84, 49, '#b17b4d', 2) + rect(wx + 12, h - 84, 73, 18, '#e7b268', 1);
    result += path(`M${wx + 48} ${h - 90} v58 M${wx + 4} ${h - 64} h90`, 'none', '#263d47', 5);
    result += path(`M${wx - 2} ${h - 30} h104`, 'none', '#a8a189', 5);
  }
  const door = w / 2 - 38;
  result += rect(door - 8, h - 93, 92, 91, '#182c35', 4, outline, 4) + rect(door, h - 86, 76, 83, '#34525b', 3, '#95a69a', 3);
  result += rect(door + 8, h - 76, 60, 38, '#d3a46c', 3) + path(`M${door + 50} ${h - 27} h12`, 'none', '#edc783', 4);
  result += path(`M-9 ${h - 120} H${w + 9}`, 'none', '#91a69b', 8) + path(`M-9 ${h - 112} H${w + 9}`, 'none', '#172e39', 5);
  // Rótulo por delante de cornisa y tuberías; área segura, sin texto cortado.
  const signW = name.length > 7 ? 270 : 232;
  result += rect(w / 2 - signW / 2 + 4, h - 161, signW, 52, '#10232d', 7, outline, 3);
  result += rect(w / 2 - signW / 2, h - 166, signW, 50, '#243d46', 7, '#8c9e91', 3);
  result += path(`M${w / 2 - signW / 2 + 12} ${h - 157} H${w / 2 + signW / 2 - 12}`, 'none', '#667b76', 2);
  result += text(w / 2, h - 131, name, 27, sign, 'text-anchor="middle" letter-spacing="2"');
  for (const sx of [-signW / 2 + 10, signW / 2 - 10]) result += ellipse(w / 2 + sx, h - 141, 2, 2, '#d4c6a0');
  // Cuatro identidades en los edificios existentes, sin cambiar su huella sólida.
  if (name === 'BOTICA') {
    result += rect(w - 212, 166, 136, 78, '#27454d', 6, outline, 4);
    result += rect(w - 219, 157, 136, 78, '#6e8d84', 6, '#263f49', 3);
    for (let j = 171; j < 224; j += 10) result += path(`M${w - 205} ${j} h108`, 'none', '#31565a', 4);
    result += rect(24, h - 208, 52, 52, '#223e43', 9, '#85b692', 3);
    result += path(`M38 ${h - 182} h24 M50 ${h - 194} v24`, 'none', '#badca6', 7);
    result += path(`M140 ${h - 98} Q${w / 2} ${h - 115} ${w - 140} ${h - 98}`, 'none', '#6fa68e', 6);
  } else if (name === 'RADIO 09') {
    result += ellipse(w - 170, 190, 65, 17, '#263e4a');
    result += path(`M${w - 198} 120 Q${w - 94} 133 ${w - 143} 194 Q${w - 184} 189 ${w - 198} 120Z`, '#86918e', outline, 4);
    result += path(`M${w - 190} 130 L${w - 147} 166 ${w - 114} 136 M${w - 147} 166 V204`, 'none', '#c0b5a0', 4);
    result += path(`M${w - 85} 40 V-18 M${w - 115} -8 H${w - 55} M${w - 109} 3 H${w - 61}`, 'none', outline, 7);
    result += path(`M${w - 85} 40 V-18 M${w - 115} -8 H${w - 55}`, 'none', '#a3a494', 3);
    result += text(80, h - 48, 'FM', 27, '#e8bc84');
    result += path(`M${w - 135} ${h - 82} l40 13 -35 17 37 13`, 'none', '#cc927c', 3);
  } else if (name === 'ALMACÉN') {
    for (let i = 0; i < 4; i++) {
      result += path(`M${w - 245 + i * 35} 150 l27 -8 0 88 -27 8Z`, '#728580', '#2c454d', 3);
      result += path(`M${w - 240 + i * 35} 157 v68`, 'none', '#b4b89d', 2);
    }
    for (let j = h - 95; j < h - 36; j += 9) result += path(`M45 ${j} h86 M${w - 134} ${j} h86`, 'none', '#7f7661', 3);
    result += path(`M25 ${h - 107} H${w - 25} l-15 14 H40Z`, '#a47950', outline, 3);
    result += text(w - 95, h - 181, '03', 40, '#a89a76');
  } else {
    result += rect(w - 245, 175, 150, 72, '#283d4a', 5, outline, 4);
    result += rect(w - 250, 165, 150, 72, '#4e7a83', 5, '#99b2a4', 3);
    for (let i = 1; i < 4; i++) result += path(`M${w - 250 + i * 37} 168 v66`, 'none', '#315361', 3);
    result += path(`M${w - 247} 199 h144`, 'none', '#315361', 3);
    result += ellipse(w - 96, h - 189, 34, 34, '#344e59', outline, 4);
    result += path(`M${w - 110} ${h - 205} l25 28 M${w - 111} ${h - 180} l27 -27`, 'none', '#b7c0a4', 8);
    for (let i = 0; i < 5; i++) result += path(`M${40 + i * 18} ${h - 100} l12 0 -14 23 -12 0Z`, '#c2a765', 'none');
    result += path(`M${w / 2 - 66} ${h - 101} h132 l-8 8 h-116Z`, '#789a98', outline, 3);
  }
  result += plant(24, h - 150, .7) + plant(w - 28, 34, .9) + plant(20, 50, .5);
  return result + '</g>';
}
for (const b of BUILDINGS) ground += building(b);
for (const p of PROPS) {
  ground += `<g transform="translate(${p.x} ${p.y})">`;
  ground += ellipse(p.w / 2 + 13, p.h - 2, p.w / 2 + 16, 21, '#122b36');
  if (p.kind === 'car') {
    ground += rect(-6, 23, 13, 31, '#121f2a', 5) + rect(p.w - 7, 23, 13, 31, '#121f2a', 5);
    ground += rect(-6, 100, 13, 29, '#121f2a', 5) + rect(p.w - 7, 100, 13, 29, '#121f2a', 5);
    ground += path(`M8 1 Q35 -10 64 2 Q78 25 71 73 L72 123 Q68 151 52 150 H17 Q0 142 0 124 V28 Q1 8 8 1Z`, '#a8614e', outline, 4);
    ground += path('M11 10 Q37 1 61 12 L59 38 H10 Z', '#c78462', '#854a44', 3);
    ground += path('M9 44 Q36 34 63 44 L59 64 H13Z', '#244451', outline, 3) + path('M15 48 L39 44', 'none', '#779b9b', 3);
    ground += path('M14 69 H58 V113 H14Z', '#b57257', '#713f3c', 3) + path('M18 73 H52', 'none', '#d19b70', 3);
    ground += path('M12 118 H59 L63 130 H8Z', '#244451', outline, 3);
    ground += path('M5 136 H67 M17 20 h29 M51 88 l-11 8 13 12', 'none', '#603c3b', 3);
    ground += rect(4, 7, 12, 7, '#ebcd91', 3) + rect(55, 7, 12, 7, '#ebcd91', 3);
  } else {
    for (const x of [14, 125]) ground += path(`M${x} 3 l13 0 6 36 -25 0Z`, '#635045', outline, 3);
    ground += path('M0 2 L155 -4 160 12 4 18 Z', '#bd9669', outline, 3) + path('M1 22 L158 15 161 32 5 39Z', '#8d7153', outline, 3);
    for (let x = 15; x < 150; x += 32) ground += path(`M${x} 1 l13 -1 -12 16 -13 0Z`, '#403f39', 'none');
    for (const x of [15, 139]) ground += ellipse(x, 9, 2, 2, '#d5c098');
  }
  ground += '</g>';
}
for (const p of [{x: 820,y: 860}, {x: 2110,y: 1310}, {x: 1160,y: 1420}, {x: 1730,y: 540}, {x: 640,y: 1310}]) ground += plant(p.x, p.y, 1);
// Farolas: pie, brazo curvo y luminaria, coherentes con los focos en Phaser.
for (const l of LAMPS) {
  ground += ellipse(l.x + 18, l.y + 4, 28, 12, '#112b36');
  ground += path(`M${l.x} ${l.y} v-91 q0 -28 25 -28 h24`, 'none', '#132a36', 12);
  ground += path(`M${l.x - 2} ${l.y - 3} v-89 q0 -25 26 -25 h22`, 'none', '#61787a', 5);
  ground += ellipse(l.x + 48, l.y - 112, 25, 10, '#243b45', outline, 3) + ellipse(l.x + 48, l.y - 108, 18, 5, '#ffe0a1');
  ground += rect(l.x - 9, l.y - 6, 18, 10, '#7d8a7f', 4, outline, 2);
}
ground += text(1395, 1520, 'DISTRITO 09', 35, '#738c87', 'text-anchor="middle" letter-spacing="8" opacity=".7"');
save('world/district.svg', svg(WORLD.w, WORLD.h, ground));

// Personajes por capas: botas independientes, torso, cabeza y arma articulada.
save('characters/soldier-body.svg', svg(96, 112,
  path('M27 43 Q47 34 68 43 L78 76 Q65 91 26 82 L19 61Z', '#243d49', outline, 4) +
  path('M25 45 Q42 38 68 44 L73 75 Q48 89 25 76 Z', '#71836d', outline, 3) +
  path('M30 46 L34 78 M62 45 L60 80', 'none', '#b8b695', 6) +
  path('M25 68 Q47 77 71 67 L69 79 Q48 88 25 77Z', '#243945', outline, 3) +
  rect(39, 64, 17, 13, '#b9a583', 3, outline, 2) + rect(22, 52, 15, 15, '#4c6159', 3, outline, 2) +
  path('M21 45 Q8 49 10 66 L23 70 28 52Z', '#788d76', outline, 3) +
  path('M70 44 Q86 47 83 66 L72 70 65 52Z', '#788d76', outline, 3) +
  path('M14 59 L23 62 M73 58 L81 60', 'none', '#d7be8a', 3)));
save('characters/soldier-head.svg', svg(96, 112,
  path('M32 20 Q45 10 62 22 L64 42 Q57 57 42 50 L30 38Z', '#c49372', outline, 3) +
  path('M34 30 Q46 24 62 31 L61 42 Q50 51 38 42Z', '#e4b88b', '#aa795e', 2) +
  path('M28 23 Q29 5 49 6 Q70 7 70 26 L61 32 29 29Z', '#566e64', outline, 4) +
  path('M32 18 Q46 10 63 19', 'none', '#8da58a', 4) +
  path('M30 28 Q49 22 70 29 L65 35 30 34Z', '#354f50', outline, 3) +
  rect(42, 28, 24, 10, '#203b47', 4, outline, 2) + path('M47 31 H59', 'none', '#90d6d0', 2) +
  path('M44 43 Q50 46 55 43', 'none', '#654c43', 2) +
  path('M27 37 L21 48 31 53 37 44Z', '#d18c4e', outline, 2)));
save('characters/boot.svg', svg(30, 35,
  path('M7 2 L23 3 24 19 Q30 23 26 30 L6 31 Q0 26 4 21Z', '#354650', outline, 3) +
  path('M8 8 L21 9 M9 14 L22 15', 'none', '#8c9c8c', 2) + path('M5 27 H25', 'none', '#152a34', 3)));
save('characters/rifle.svg', svg(88, 40,
  path('M8 17 Q15 9 25 15 L39 19 38 29 17 26Z', '#d3a480', outline, 3) +
  path('M4 9 L17 9 29 15 62 13 63 24 31 26 21 22 8 22Z', '#5c6e71', outline, 3) +
  path('M29 21 L38 24 34 36 24 31Z', '#9e7958', outline, 3) +
  rect(59, 15, 25, 7, '#263d49', 2, outline, 3) + rect(43, 8, 10, 6, '#73948d', 2, outline, 2) +
  path('M41 17 H56', 'none', '#b4c9b3', 2) + ellipse(43, 27, 8, 6, '#dfb48a', outline, 2)));
save('characters/drone.svg', svg(56, 46,
  ellipse(13, 15, 11, 7, '#91b3ab', outline, 3) + ellipse(43, 15, 11, 7, '#91b3ab', outline, 3) +
  path('M10 17 H44 L39 35 H18 Z', '#4e7376', outline, 3) +
  ellipse(28, 21, 14, 11, '#a3b9a5', outline, 3) + rect(24, 23, 9, 17, '#314953', 3, outline, 2) +
  ellipse(28, 19, 4, 3, '#98f2dd')));
save('enemies/walker.svg', svg(96, 112,
  path('M26 77 L39 77 38 102 21 102 19 95Z', '#3c4d56', outline, 3) +
  path('M55 76 L70 78 76 99 61 105 55 94Z', '#3c4d56', outline, 3) +
  path('M24 44 Q41 29 62 42 L75 78 57 84 48 76 37 87 19 77Z', '#856378', outline, 4) +
  path('M27 44 L38 52 32 71 22 75 M58 44 L53 60 65 78', 'none', '#b18b9e', 3) +
  path('M24 46 Q13 40 9 57 L3 78 14 84 24 63Z', '#75925f', outline, 3) +
  path('M67 47 Q78 40 85 54 L91 77 81 85 71 64Z', '#8ca66a', outline, 3) +
  path('M3 78 L1 89 6 92 10 86 11 95 15 92 17 81 M81 80 L83 94 88 92 88 86 94 90 95 85 91 77', '#9cb879', outline, 2) +
  path('M27 20 Q31 6 53 10 L65 24 60 46 44 56 29 45 23 31Z', '#a6bd79', outline, 4) +
  path('M28 17 L32 8 44 10 52 4 60 13 66 20 52 18 39 23Z', '#425d4d', outline, 3) +
  path('M28 28 L39 26 38 33 29 34 M48 26 L60 25 58 34 48 33', '#243c37', outline, 2) +
  ellipse(34, 30, 2.7, 2, '#eddf9e') + ellipse(54, 29, 2.7, 2, '#eddf9e') +
  path('M37 41 L56 39 53 48 41 49Z', '#303f38', outline, 2) + path('M42 42 l1 5 M49 42 l1 4', 'none', '#e1d8ac', 2) +
  path('M28 37 L33 40 M58 35 L61 38', 'none', '#607a51', 2)));
save('enemies/brute.svg', svg(136, 140,
  path('M30 94 L53 92 55 124 30 130 25 120Z', '#3b4454', outline, 4) +
  path('M80 92 L103 94 114 122 94 131 82 120Z', '#3b4454', outline, 4) +
  path('M30 40 Q64 24 103 43 L116 90 Q97 112 38 105 L21 86 Z', '#756379', outline, 5) +
  path('M32 42 L43 58 40 99 M92 43 L84 61 97 101', 'none', '#b69b80', 10) +
  path('M25 76 Q63 88 110 75 L115 89 Q70 106 30 94Z', '#c29758', outline, 3) +
  path('M28 46 Q10 36 4 59 L3 89 Q12 101 26 92 L33 66Z', '#94a276', outline, 4) +
  path('M103 46 Q119 36 130 61 L133 88 Q124 103 108 92 L99 65Z', '#94a276', outline, 4) +
  path('M4 83 L2 101 12 110 27 101 25 85Z M108 85 L108 103 123 111 134 101 132 84Z', '#b7bc87', outline, 3) +
  path('M15 88 L15 100 M119 90 L120 101', 'none', '#778463', 2) +
  path('M47 14 Q63 1 84 14 L93 35 85 59 64 66 45 51 39 32Z', '#b8bb89', outline, 4) +
  path('M39 22 Q41 5 65 3 Q89 2 95 26 L83 31 42 31Z', '#d69e57', outline, 4) +
  path('M50 13 Q68 7 84 16 M67 6 V24', 'none', '#efc482', 4) +
  path('M40 29 Q68 23 97 29 L91 36 42 37Z', '#b77c46', outline, 3) +
  path('M48 39 L60 37 M73 38 L85 40', 'none', '#374c41', 5) +
  ellipse(55, 41, 3, 2, '#f0e3a5') + ellipse(79, 42, 3, 2, '#f0e3a5') +
  path('M56 52 L80 51 76 59 61 60Z', '#465046', outline, 2) + path('M63 53 V57 M72 53 V57', 'none', '#e3dbaf', 2)));
// Separar el dibujo original en torso/cabeza y extremidades animables.
for (const kind of ['walker', 'brute']) {
  let body = readFileSync(`${base}/enemies/${kind}.svg`, 'utf8');
  const limbPrefixes = kind === 'walker'
    ? ['M26 77', 'M55 76', 'M24 46', 'M67 47', 'M3 78']
    : ['M30 94', 'M80 92', 'M28 46', 'M103 46', 'M4 83', 'M15 88'];
  body = body.replace(/<path d="([^"]*)"[^>]*\/>/g, (whole, d: string) => limbPrefixes.some(prefix => d.startsWith(prefix)) ? '' : whole);
  save(`enemies/${kind}-body.svg`, body);
  const heavy = kind === 'brute';
  save(`enemies/${kind}-arm.svg`, svg(40, 72,
    path('M12 4 Q25 -1 30 12 L31 41 26 50 10 46 7 20Z', heavy ? '#9aa97b' : '#8fa96d', outline, 3) +
    path('M9 42 L30 44 33 59 Q28 71 17 66 L8 59Z', heavy ? '#bdc792' : '#aabe7b', outline, 3) +
    path('M16 49 L18 59 M24 50 L25 60', 'none', '#6c8057', 2) +
    (heavy ? path('M8 16 L31 17 M8 22 L31 23', 'none', '#786c7b', 5) : path('M8 11 L30 14 29 22 9 20Z', '#94738a', outline, 2))));
  save(`enemies/${kind}-leg.svg`, svg(34, 43,
    path('M8 2 L27 3 25 25 9 26Z', heavy ? '#596070' : '#556170', outline, 3) +
    path('M8 24 Q19 20 27 26 L31 36 Q22 43 5 38 L3 32Z', '#4e5e63', outline, 3) +
    path('M9 29 L24 30 M7 36 H27', 'none', '#8b998a', 2)));
}
save('world/door-exit.svg', svg(96, 116,
  rect(3, 3, 90, 110, '#263e49', 6, '#7c9890', 4) + rect(11, 11, 74, 100, '#111f2a', 4) +
  path('M13 13 L34 24 V108 L13 110Z', '#52706b', '#95ac96', 2) +
  path('M35 25 L76 12 M35 108 L77 109', 'none', '#b2a575', 2)));
save('vfx/light.svg', svg(512, 512, '<circle cx="256" cy="256" r="256" fill="url(#glow)"/>',
  '<radialGradient id="glow"><stop stop-color="#ffd19a" stop-opacity=".65"/><stop offset=".35" stop-color="#f3a44b" stop-opacity=".26"/><stop offset="1" stop-color="#f3a44b" stop-opacity="0"/></radialGradient>'));
save('vfx/vignette.svg', svg(1600, 900, '<rect width="1600" height="900" fill="url(#shade)"/>',
  '<radialGradient id="shade" r=".75"><stop offset=".3" stop-color="#10212f" stop-opacity="0"/><stop offset="1" stop-color="#0a1528" stop-opacity=".65"/></radialGradient>'));
console.log('Referencia 02: fachadas con rótulos integrados y extremidades animables.');
