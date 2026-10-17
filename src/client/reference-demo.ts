import Phaser from 'phaser';
import { ReferenceScene, type ReferenceView } from './phaser/ReferenceScene';
import { isReferenceScenario } from '../content/reference-scenarios';
import './reference.css';

declare global { interface Window { __DZO_REFERENCE__?: { snapshot: () => ReferenceView } } }
export function renderReference(root: HTMLDivElement) {
  document.body.classList.add('reference-page');
  root.innerHTML = `
    <div class="reference-demo">
      <div id="reference-canvas"></div>
      <header class="reference-header">
        <a class="reference-brand" href="/" aria-label="Volver a la portada">DEAD ZONE<span>O U T B R E A K</span></a>
        <div class="reference-location"><span class="reference-eyebrow">ESCENA DE REFERENCIA · 01</span><strong>Última luz en el distrito</strong><span>Distrito 09 / exterior</span></div>
        <nav class="reference-actions" aria-label="Opciones de demostración">
          <button id="reference-light" aria-pressed="false" disabled>Luz diurna</button>
          <button id="reference-pause" aria-label="Pausar" disabled>Ⅱ</button>
        </nav>
      </header>
      <div class="reference-tag"><i></i> DEMO LOCAL <span>· DIRECCIÓN ARTÍSTICA EN REVISIÓN</span></div>
      <footer class="reference-hud">
        <div class="reference-health reference-plate"><span class="reference-eyebrow">01 / SOLDADO</span><div class="reference-hp-row"><strong>SIGUE EN PIE.</strong><span id="reference-hp">100 / 100</span></div><div class="reference-health-bar"><i id="reference-hp-bar"></i></div><span class="reference-small">BAJAS <b id="reference-kills">0</b> <span id="reference-clock">00:00</span></span></div>
        <div class="reference-controls"><span><kbd>WASD</kbd> / flechas · mover</span><span><kbd>CLIC</kbd> sostenido · disparar</span><span><kbd>ESPACIO</kbd> / Shift · dash</span><span><kbd>P</kbd> pausa</span></div>
        <div class="reference-weapons reference-plate"><span class="reference-eyebrow">ARMA PERSONAL · <b id="reference-fire-mode">AUTO</b></span><strong>Fusil <span id="reference-ammo">10 / 10</span></strong><div class="reference-dash"><span id="reference-dash-text">DASH LISTO</span><i><b id="reference-dash-bar"></b></i></div></div>
      </footer>
      <div class="reference-overlay" id="reference-intro"><section class="reference-dialog"><span class="reference-eyebrow">DEAD ZONE: OUTBREAK / ESTUDIO VISUAL 03</span><h1>La ciudad aún<br><em>tiene pulso.</em></h1><p>Asfalto húmedo. Luces de emergencia.<br>Algo se mueve al otro lado de la calle.</p><div class="reference-intro-controls"><b>WASD / flechas</b> para moverte<br><b>Sin clic:</b> tu fusil apunta y dispara automáticamente<br><b>Clic sostenido:</b> tú diriges esa misma arma<br>Un cargador compartido; la recarga es automática.<br><b>Espacio / Shift</b> para dash · <b>P</b> para pausa</div><button class="reference-primary" id="reference-enter" disabled>Cargando distrito…</button><small>Una escena jugable para revisar arte y combate.<br>Interiores, progresión y cooperación en etapas posteriores.</small></section></div>
      <div class="reference-overlay" id="reference-modal" hidden><section class="reference-dialog reference-pause-dialog"><span class="reference-eyebrow" id="reference-modal-kicker">PAUSA LOCAL</span><h2 id="reference-modal-title">Un respiro.</h2><p id="reference-modal-copy">El distrito puede esperar.</p><button class="reference-primary" id="reference-resume">Continuar</button><button id="reference-restart">Reiniciar escena</button></section></div>
    </div>`;
  const get = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  let started = false;
  const view = (snapshot: ReferenceView) => {
    const { player, stats, phase, time } = snapshot.state;
    get('reference-hp').textContent = `${player.hp} / 100`;
    get('reference-hp-bar').style.width = `${player.hp}%`;
    get('reference-kills').textContent = `${stats.kills}`;
    get('reference-fire-mode').textContent = snapshot.state.weapon.mode === 'manual' ? 'MANUAL' : 'AUTO';
    const weapon = snapshot.state.weapon;
    get('reference-ammo').textContent = weapon.reload > 0 ? `RECARGA ${weapon.reload.toFixed(1)} s` : `${weapon.ammo} / ${weapon.capacity}`;
    get('reference-clock').textContent = `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;
    get('reference-dash-text').textContent = player.dash > 0 ? `DASH · ${player.dash.toFixed(1)} s` : 'DASH LISTO';
    get('reference-dash-bar').style.width = `${(1 - player.dash / 3.3) * 100}%`;
    get('reference-light').setAttribute('aria-pressed', String(snapshot.light === 'day'));
    get('reference-light').textContent = snapshot.light === 'night' ? 'Luz diurna' : 'Luz tenue';
    const modal = get('reference-modal');
    const open = started && phase !== 'playing';
    const wasOpen = !modal.hidden;
    modal.hidden = !open;
    get('reference-modal-title').textContent = phase === 'dead' ? 'El distrito te alcanzó.' : 'Un respiro.';
    get('reference-modal-kicker').textContent = phase === 'dead' ? 'SUPERVIVIENTE CAÍDO' : 'PAUSA LOCAL';
    get('reference-modal-copy').textContent = phase === 'dead' ? `${stats.kills} bajas · ${stats.damageReceived} puntos de daño recibido.` : 'El distrito puede esperar.';
    get('reference-resume').hidden = phase === 'dead';
    if (open && !wasOpen) get(phase === 'dead' ? 'reference-restart' : 'reference-resume').focus();
    get('reference-pause').setAttribute('aria-label', phase === 'paused' ? 'Continuar' : 'Pausar');
  };
  const params = new URLSearchParams(location.search);
  const requestedScenario = params.get('scenario') ?? 'district';
  const scenario = import.meta.env.DEV && isReferenceScenario(requestedScenario) ? requestedScenario : 'district';
  const requestedSeed = Number(params.get('seed') ?? 9231);
  const seed = import.meta.env.DEV && Number.isInteger(requestedSeed) ? requestedSeed >>> 0 : 9231;
  const scene = new ReferenceScene(view, scenario, seed);
  scene.onReady = () => {
    get<HTMLButtonElement>('reference-enter').disabled = false;
    get<HTMLButtonElement>('reference-light').disabled = false;
    get<HTMLButtonElement>('reference-pause').disabled = false;
    get('reference-enter').textContent = 'Entrar al distrito →';
    if (import.meta.env.DEV) window.__DZO_REFERENCE__ = Object.freeze({ snapshot: () => scene.snapshot() });
  };
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'reference-canvas', backgroundColor: '#243d4d',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, pixelArt: false, roundPixels: false, mipmapFilter: 'LINEAR_MIPMAP_LINEAR' },
    scene: [scene], audio: { noAudio: true }, banner: false,
  });
  get('reference-enter').addEventListener('click', () => {
    started = true; get('reference-intro').hidden = true; scene.begin();
  });
  get('reference-pause').addEventListener('click', () => scene.pause());
  get('reference-resume').addEventListener('click', () => { scene.pause(); game.canvas.focus(); });
  get('reference-restart').addEventListener('click', () => scene.restart());
  get('reference-light').addEventListener('click', () => {
    scene.setLighting(scene.snapshot().light !== 'night');
    if (started && scene.snapshot().state.phase === 'playing') game.canvas.focus();
  });
  window.addEventListener('pagehide', () => { delete window.__DZO_REFERENCE__; game.destroy(true); }, { once: true });
}
