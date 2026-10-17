import { Client, type Room } from '@colyseus/sdk';
import { LobbyState } from '../shared/LobbyState';
import { CHARACTERS, type SelectionResult } from '../shared/lobby';

export function renderMultiplayer(root: HTMLDivElement) {
  const endpoint = `${location.protocol}//${location.hostname}:2567`;
  const client = new Client(endpoint);
  const storageKey = 'dead-zone-selection-token';
  let room: Room<unknown, LobbyState> | undefined;
  let connected = false;
  let busy = false;
  root.innerHTML = `<main class="lobby">
    <a href="/">← Volver al proyecto</a>
    <h1>DEAD ZONE: OUTBREAK</h1>
    <h2>Sala de supervivientes</h2>
    <p>Hasta cuatro jugadores. Una clase por persona. Selección: 30 s · Cuenta regresiva: 5 s.</p>
    <form id="lobby-form">
      <label>Tu nombre <input id="player-name" name="name" maxlength="24" value="Superviviente" autocomplete="nickname"></label>
      <label>ID de sala <input id="room-input" name="roomId" maxlength="32" placeholder="Para entrar a una sala existente" autocomplete="off"></label>
      <div class="actions"><button id="create-room" type="button">Crear sala</button><button id="join-room" type="submit">Entrar por ID</button></div>
    </form>
    <p id="connection-status" role="status">Sin conexión a una sala.</p>
    <p id="lobby-error" role="alert"></p>
    <section id="room-panel" hidden>
      <p>Sala: <strong id="room-id"></strong> · <span id="player-count"></span>/4 plazas</p>
      <p id="phase-label"></p><p id="server-timer" aria-live="off"></p>
      <ul id="roster" aria-label="Jugadores de la sala"></ul>
      <div id="character-choices" class="character-choices" aria-label="Seleccionar clase"></div>
      <p id="selection-feedback" role="status"></p>
      <button id="leave-room" type="button">Salir de la sala</button>
    </section>
    <button id="reconnect-room" type="button" hidden>Recuperar conexión</button>
    <p class="scope">Esta sala prepara el equipo. La misión compartida y las especializaciones de combate se incorporarán en la siguiente fase.</p>
    <a href="/legacy/index.html">Abrir prototipo anterior — combate individual</a>
  </main>`;

  const element = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const errorText = (message: string) => { element('lobby-error').textContent = message; };
  const controls = () => {
    element<HTMLButtonElement>('create-room').disabled = busy || !!room;
    element<HTMLButtonElement>('join-room').disabled = busy || !!room;
    element<HTMLButtonElement>('reconnect-room').disabled = busy;
  };
  const phaseLabels = {
    waiting: 'Esperando supervivientes', selecting: 'Elige tu clase', countdown: 'Preparando equipo',
    ready: 'Equipo preparado', cancelled: 'Sala cancelada: no había jugadores conectados',
  };
  const draw = () => {
    if (!room?.state) return;
    const state = room.state;
    element('room-panel').hidden = false;
    element('room-id').textContent = room.roomId;
    element('player-count').textContent = String(state.players.size);
    element('phase-label').textContent = phaseLabels[state.phase];
    element('server-timer').textContent = state.phase === 'selecting'
      ? `Selección: ${Math.ceil(state.selectionRemainingMs / 1000)} s`
      : state.phase === 'countdown' ? `Comienza en ${Math.ceil(state.countdownRemainingMs / 1000)} s` : '';
    const list = element('roster');
    list.replaceChildren();
    for (const player of state.players.values()) {
      const item = document.createElement('li');
      item.dataset.sessionId = player.sessionId;
      const character = CHARACTERS.find(choice => choice.id === player.characterId);
      item.textContent = `${player.name}${player.sessionId === room.sessionId ? ' (tú)' : ''} · ${character?.name ?? 'Sin elegir'} · ${player.departed ? 'Salió' : player.connected ? 'Conectado' : 'Reconectando'}`;
      list.append(item);
    }
    for (const character of CHARACTERS) {
      const button = element<HTMLButtonElement>(`class-${character.id}`);
      const owner = [...state.players.values()].find(player => player.characterId === character.id);
      const mine = owner?.sessionId === room.sessionId;
      button.disabled = !connected || state.phase !== 'selecting' || (!!owner && !mine);
      button.setAttribute('aria-pressed', String(mine));
      button.querySelector('small')!.textContent = owner ? mine ? 'Tu elección' : `Ocupado: ${owner.name}` : character.description;
    }
  };
  for (const character of CHARACTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `class-${character.id}`;
    const title = document.createElement('strong'); title.textContent = character.name;
    button.append(title, document.createElement('small'));
    button.addEventListener('click', async () => {
      if (!room || !connected) return;
      try {
        const result = await room.request<unknown, SelectionResult>('select', { characterId: character.id });
        element('selection-feedback').textContent = result.ok ? `Elegiste ${character.name}.` : {
          taken: 'Otro jugador eligió esa clase.', invalid: 'Clase no válida.', closed: 'La selección terminó.',
          not_connected: 'Recupera la conexión para elegir.', selected: '',
        }[result.code];
      } catch { errorText('No se pudo confirmar la selección. Comprueba la conexión.'); }
    });
    element('character-choices').append(button);
  }

  function attach(joined: Room<unknown, LobbyState>) {
    room = joined; connected = true;
    element('lobby-form').hidden = true;
    joined.reconnection.minUptime = 0;
    sessionStorage.setItem(storageKey, joined.reconnectionToken);
    element('connection-status').textContent = 'Conectado al servidor.';
    element('reconnect-room').hidden = true;
    joined.onStateChange(draw);
    joined.onDrop(() => {
      connected = false;
      element('connection-status').textContent = 'Conexión perdida. Recuperando tu plaza…';
      draw();
    });
    joined.onReconnect(() => {
      connected = true;
      sessionStorage.setItem(storageKey, joined.reconnectionToken);
      element('connection-status').textContent = 'Conexión recuperada.';
      draw();
    });
    joined.onLeave(() => {
      if (room !== joined) return;
      room = undefined; connected = false;
      element('lobby-form').hidden = false;
      element('room-panel').hidden = true;
      element('connection-status').textContent = 'Has salido de la sala.';
      element('reconnect-room').hidden = !sessionStorage.getItem(storageKey);
      controls();
    });
    joined.onError(() => errorText('El servidor rechazó la conexión o la sala ya no está disponible.'));
    draw(); controls();
  }

  async function connect(mode: 'create' | 'join' | 'reconnect') {
    if (busy || room) return;
    const roomId = element<HTMLInputElement>('room-input').value.trim();
    if (mode === 'join' && !/^[a-zA-Z0-9_-]{1,32}$/.test(roomId)) {
      errorText('Introduce un ID de sala válido.'); return;
    }
    busy = true; errorText(''); controls();
    try {
      const options = { name: element<HTMLInputElement>('player-name').value };
      const joined = mode === 'reconnect'
        ? await client.reconnect<LobbyState>(sessionStorage.getItem(storageKey)!, LobbyState)
        : mode === 'create' ? await client.create<LobbyState>('selection', options, LobbyState)
        : await client.joinById<LobbyState>(roomId, options, LobbyState);
      attach(joined);
    } catch {
      if (mode === 'reconnect') {
        sessionStorage.removeItem(storageKey);
        element('reconnect-room').hidden = true;
      }
      errorText(mode === 'reconnect' ? 'La reserva venció o la sala ya no existe. Crea o busca otra sala.'
        : 'No se pudo entrar. Comprueba el ID, las plazas y que el servidor esté disponible.');
    } finally { busy = false; controls(); }
  }
  element('create-room').addEventListener('click', () => void connect('create'));
  element('lobby-form').addEventListener('submit', event => { event.preventDefault(); void connect('join'); });
  element('reconnect-room').addEventListener('click', () => void connect('reconnect'));
  element('leave-room').addEventListener('click', () => {
    sessionStorage.removeItem(storageKey);
    void room?.leave();
  });
  // Recargar conserva la reserva de esta pestaña; no se comparte con otras.
  if (sessionStorage.getItem(storageKey)) void connect('reconnect');
}
