// Compone una página de revisión; conserva las capturas originales sin retocarlas.
// npm run review:art -- <carpeta de las tres capturas previas>
import { chromium } from '@playwright/test';
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const previous = process.argv[2];
if (!previous) throw new Error('Indicar la carpeta de capturas previas (01-luz-tenue, 02-luz-diurna, 03-combate).');
const directory = resolve('test-results/reference-iteration-3');
const current = (await readdir('test-results')).find(name => name.startsWith('phaser-Phaser-referencia-t-'));
if (!current) throw new Error('Ejecutar primero npm test para obtener las capturas actuales.');
const frames = [
  { file: '01-luz-tenue.png', title: 'Luz tenue' },
  { file: '02-luz-diurna.png', title: 'Luz diurna' },
  { file: '03-combate.png', title: 'Combate' },
];
await mkdir(`${directory}/before`, { recursive: true });
await mkdir(`${directory}/after`, { recursive: true });
for (const { file } of frames) {
  await copyFile(resolve(previous, file), `${directory}/before/${file}`);
  await copyFile(resolve('test-results', current, file), `${directory}/after/${file}`);
}
const html = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DEAD ZONE · revisión visual 03</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0e1d26;color:#e7ebdb;font:16px system-ui;padding:28px}
main{max-width:1600px;margin:auto}h1{font-size:24px;margin:0 0 8px}p{color:#b2c7c4;margin:8px 0 18px}
nav{display:flex;gap:8px;margin:18px 0}button,a{color:#e4e9d6}button{font:inherit;border:1px solid #577373;background:#203a45;padding:10px 18px;cursor:pointer}
button[aria-pressed=true]{background:#bb8651;color:#111f28}label{display:flex;gap:20px;align-items:center;margin:14px 0}input{flex:1;accent-color:#f0ba77}
.compare{position:relative;aspect-ratio:16/9;background:#08151c;overflow:hidden}.compare img{position:absolute;width:100%;height:100%;object-fit:contain}
.compare .after{clip-path:inset(0 0 0 50%)}.seam{position:absolute;left:50%;top:0;bottom:0;border-left:2px solid #ffe4af;pointer-events:none}
.tag{position:absolute;top:12px;background:#0c1c27dd;padding:7px 12px;font-size:13px;letter-spacing:.05em}.tag.before{left:12px}.tag.after{right:12px}
.pair{display:none;grid-template-columns:1fr 1fr;gap:12px}.pair img{width:100%}.pair p{margin:0 0 8px}body.static .compare,body.static label,body.static nav,body.static .links,body.static .video{display:none}body.static .pair{display:grid}
.links{display:flex;gap:22px;margin-top:14px}.video{margin-top:32px}video{width:min(100%,1280px);background:#07121b}
</style><main>
<h1>DEAD ZONE: OUTBREAK · estudio visual 03</h1>
<p>Iteración 2 → 3. Misma prueba, semilla, entradas y cámara; capturas originales a 1920 × 1080. Sin retoque posterior.</p>
<nav>${frames.map((f,i)=>`<button data-frame="${i}" aria-pressed="${i===0}">${f.title}</button>`).join('')}</nav>
<div class="compare"><img class="before" alt="Iteración 2"><img class="after" alt="Iteración 3"><span class="seam"></span><span class="tag before">ANTES · 02</span><span class="tag after">DESPUÉS · 03</span></div>
<label>Comparar <input type="range" min="0" max="100" value="50" aria-label="División antes y después"></label>
<div class="pair"><div><p>ANTES · ITERACIÓN 2</p><img class="before" alt="Iteración 2"></div><div><p>DESPUÉS · ITERACIÓN 3</p><img class="after" alt="Iteración 3"></div></div>
<div class="links"><a id="before-link" target="_blank">Abrir antes a tamaño original</a><a id="after-link" target="_blank">Abrir después a tamaño original</a></div>
<section class="video"><h2>Partida con reloj real</h2><p>Movimiento, disparo manual/automático y dash mediante teclado y mouse de Playwright. La grabación incluye la entrada al distrito.</p><video controls preload="metadata" src="partida-real.webm"></video><p><a href="real-session.json">Estados y métricas del recorrido</a></p></section>
<script>
const frames=${JSON.stringify(frames)};
function show(index){const frame=frames[index];document.querySelectorAll('img.before').forEach(el=>el.src='before/'+frame.file);document.querySelectorAll('img.after').forEach(el=>el.src='after/'+frame.file);document.querySelector('#before-link').href='before/'+frame.file;document.querySelector('#after-link').href='after/'+frame.file;document.querySelectorAll('button').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));}
document.querySelectorAll('button').forEach(el=>el.onclick=()=>show(Number(el.dataset.frame)));
document.querySelector('input').oninput=e=>{const value=e.target.value;document.querySelector('.compare .after').style.clipPath='inset(0 0 0 '+value+'%)';document.querySelector('.seam').style.left=value+'%'};
show(0);
</script></main></html>`;
await writeFile(`${directory}/comparacion.html`, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 800 } });
  await page.goto(pathToFileURL(`${directory}/comparacion.html`).href);
  await page.evaluate(() => document.body.classList.add('static'));
  for (let i = 0; i < frames.length; i++) {
    await page.evaluate(index => show(index), i);
    await page.locator('img').evaluateAll(elements => Promise.all(elements.map(el => el.decode())));
    await page.locator('main').screenshot({ path: `${directory}/comparacion-${i + 1}.png` });
  }
} finally { await browser.close(); }
console.log(`Comparación guardada: ${directory}/comparacion.html`);
