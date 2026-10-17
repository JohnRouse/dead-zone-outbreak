import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('No se encontró #app');
root.innerHTML = `
  <main>
    <h1>DEAD ZONE: OUTBREAK</h1>
    <p>Entorno de desarrollo preparado para la migración del prototipo v0.2.</p>
    <p>Coloca la versión jugable anterior en <code>legacy/index.html</code> y conserva ese archivo antes de migrar el motor por módulos.</p>
    <a href="/legacy/index.html">Abrir prototipo anterior (cuando esté incorporado)</a>
  </main>`;
