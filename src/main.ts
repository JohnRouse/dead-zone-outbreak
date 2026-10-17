import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('No se encontró #app');
if (location.pathname === '/multiplayer') {
  const { renderMultiplayer } = await import('./multiplayer');
  renderMultiplayer(root);
} else root.innerHTML = `
  <main>
    <h1>DEAD ZONE: OUTBREAK</h1>
    <p>Prototipo individual y primera sala multijugador de DEAD ZONE: OUTBREAK.</p>
    <p>El combate híbrido original permanece disponible. La sala permite reunir al equipo y elegir clases antes de integrar las misiones compartidas.</p>
    <a href="/legacy/index.html">Abrir prototipo anterior — combate individual</a>
    <p><a href="/multiplayer">Crear o unirse a una sala multijugador</a></p>
  </main>`;
