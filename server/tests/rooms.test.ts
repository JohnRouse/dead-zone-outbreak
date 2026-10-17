import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import type { AddressInfo } from 'node:net';
import { Client, type Room } from '@colyseus/sdk';
import { createLobbyServer } from '../app.js';
import { createSelectionRoom } from '../rooms/SelectionRoom.js';
import { LobbyState } from '../../shared/LobbyState.js';
import { LOBBY_TIMING, type SelectionResult } from '../../shared/lobby.js';

const { server, http } = createLobbyServer({ ...LOBBY_TIMING, reconnectSeconds: 0.4 });
server.define('fast_selection', createSelectionRoom({ selectionMs: 750, countdownMs: 200, reconnectSeconds: 0.4 }));
let endpoint: string;
type RemoteRoom = Room<unknown, LobbyState>;
const connections = new Set<RemoteRoom>();
const client = () => new Client(endpoint);
before(async () => {
  await server.listen(0, '127.0.0.1');
  endpoint = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
});
after(async () => {
  await Promise.allSettled([...connections].filter(room => room.connection.isOpen).map(room => room.leave()));
  await server.gracefullyShutdown(false);
});

async function until(predicate: () => boolean, description: string, timeoutMs = 4000) {
  const deadline = performance.now() + timeoutMs;
  while (!predicate()) {
    assert.ok(performance.now() < deadline, description);
    await delay(10);
  }
}
async function created(kind = 'selection', options: object = {}) {
  return track(await client().create<LobbyState>(kind, options, LobbyState));
}
async function joined(id: string) { return track(await client().joinById<LobbyState>(id, {}, LobbyState)); }
async function track(room: RemoteRoom) {
  connections.add(room);
  room.reconnection.enabled = false;
  room.onError(() => {});
  await until(() => !!room.state?.players.has(room.sessionId), 'Debe recibir snapshot inicial');
  return room;
}
async function select(room: RemoteRoom, characterId: unknown, extras: object = {}) {
  return room.request<unknown, SelectionResult>('select', { characterId, ...extras });
}

test('cuatro conexiones disputan simultáneamente una clase: solo una gana y un quinto no entra', async () => {
  const a = await created();
  const others = await Promise.all([joined(a.roomId), joined(a.roomId), joined(a.roomId)]);
  const rooms = [a, ...others];
  const results = await Promise.all(rooms.map(room => select(room, 'medic')));
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.filter(result => result.code === 'taken').length, 3);
  await until(() => rooms.every(room => [...room.state.players.values()].filter(player => player.characterId === 'medic').length === 1), 'Todos ven exactamente una Médica');
  assert.ok(rooms.every(room => room.state.players.size === 4));
  await assert.rejects(() => client().joinById(a.roomId));
  await Promise.all(rooms.map(room => room.leave()));
});

test('dos selecciones simultáneas, cambio rechazado y payload ajeno no alteran otra sesión', async () => {
  const a = await created(); const b = await joined(a.roomId);
  const results = await Promise.all([select(a, 'soldier'), select(b, 'soldier')]);
  assert.equal(results.filter(result => result.ok).length, 1);
  const [winner, loser] = results[0].ok ? [a, b] : [b, a];
  assert.equal((await select(loser, 'scout', { sessionId: winner.sessionId })).ok, true);
  assert.equal((await select(loser, 'soldier')).code, 'taken');
  assert.equal((await select(loser, '__proto__')).code, 'invalid');
  await until(() => winner.state.players.get(winner.sessionId)?.characterId === 'soldier' && winner.state.players.get(loser.sessionId)?.characterId === 'scout', 'Identidad procede del socket');
  await Promise.all([a.leave(), b.leave()]);
});

test('el servidor asigna clases al vencer y ejecuta cuenta regresiva; opciones del cliente no cambian plazos', async () => {
  const a = await created('fast_selection', { selectionMs: 1, countdownMs: 1, maxClients: 99 });
  const others = await Promise.all([joined(a.roomId), joined(a.roomId), joined(a.roomId)]);
  await select(a, 'scout');
  assert.equal(a.state.phase, 'selecting');
  await until(() => a.state.phase === 'countdown', 'Debe iniciar cuenta regresiva real');
  const classes = [...a.state.players.values()].map(player => player.characterId);
  assert.equal(new Set(classes).size, 4);
  assert.equal(a.state.players.get(a.sessionId)!.characterId, 'scout');
  assert.ok(a.state.countdownRemainingMs <= 200 && a.state.countdownRemainingMs > 0);
  assert.equal((await select(a, 'soldier')).code, 'closed');
  await assert.rejects(() => client().joinById(a.roomId));
  await until(() => a.state.phase === 'ready', 'Debe terminar cuenta regresiva del servidor');
  await Promise.all([a, ...others].map(room => room.leave()));
});

test('salida voluntaria libera clase sin esperar reserva', async () => {
  const a = await created(); const b = await joined(a.roomId);
  await select(b, 'mechanic');
  await b.leave();
  await until(() => !a.state.players.has(b.sessionId), 'La plaza debe liberarse');
  assert.equal((await select(a, 'mechanic')).ok, true);
  await a.leave();
});

test('caída reserva plaza/clase; reconexión real con token recupera sesión y elección', async () => {
  const a = await created(); const b = await joined(a.roomId);
  const c = await joined(a.roomId); const d = await joined(a.roomId);
  await select(b, 'medic');
  const token = b.reconnectionToken;
  b.connection.close();
  await until(() => a.state.players.get(b.sessionId)?.connected === false, 'Debe reflejar caída');
  assert.equal((await select(a, 'medic')).code, 'taken');
  await assert.rejects(() => client().joinById(a.roomId));
  const restored = await track(await client().reconnect<LobbyState>(token, LobbyState));
  assert.equal(restored.sessionId, b.sessionId);
  await until(() => a.state.players.get(b.sessionId)?.connected === true, 'Debe recuperar misma plaza');
  assert.equal(restored.state.players.get(b.sessionId)!.characterId, 'medic');
  await Promise.all([a, restored, c, d].map(room => room.leave()));
});

test('al vencer reserva se libera clase y un token vencido no recupera la sesión', async () => {
  const a = await created(); const b = await joined(a.roomId);
  await select(b, 'mechanic');
  await until(() => a.state.players.get(b.sessionId)?.characterId === 'mechanic', 'El observador recibe al jugador antes de su caída');
  const token = b.reconnectionToken;
  b.connection.close();
  await until(() => a.state.players.get(b.sessionId)?.connected === false, 'La plaza permanece reservada durante la caída');
  await until(() => !a.state.players.has(b.sessionId), 'La reserva expirada debe desaparecer');
  await assert.rejects(() => client().reconnect(token));
  assert.equal((await select(a, 'mechanic')).ok, true);
  const replacement = await joined(a.roomId);
  assert.equal(a.state.players.size <= 4, true);
  await Promise.all([a.leave(), replacement.leave()]);
});

test('el SDK se reconecta automáticamente sin crear una plaza nueva', async () => {
  const a = await created(); const b = await joined(a.roomId);
  await select(b, 'scout');
  await until(() => a.state.players.get(b.sessionId)?.characterId === 'scout', 'Elección sincronizada');
  const originalRemaining = a.state.selectionRemainingMs;
  b.reconnection.enabled = true;
  b.reconnection.minUptime = 0;
  b.reconnection.delay = 10;
  b.reconnection.minDelay = 10;
  b.reconnection.maxDelay = 30;
  let recovered = false;
  b.onReconnect(() => { recovered = true; });
  b.connection.close();
  await until(() => recovered, 'El SDK debe recuperar la conexión automáticamente');
  await until(() => a.state.players.get(b.sessionId)?.connected === true, 'Misma sesión conectada');
  assert.equal(a.state.players.size, 2);
  assert.equal(b.state.players.get(b.sessionId)!.characterId, 'scout');
  assert.ok(a.state.selectionRemainingMs <= originalRemaining);
  await Promise.all([a.leave(), b.leave()]);
});
