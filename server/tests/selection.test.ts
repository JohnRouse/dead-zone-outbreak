import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Selection } from '../domain/Selection.js';
import { CHARACTERS, LOBBY_TIMING } from '../../shared/lobby.js';

function fixture() {
  let time = 0;
  const selection = new Selection(() => time);
  return { selection, at: (milliseconds: number) => { time = milliseconds; } };
}

test('30 s + 5 s: frontera exacta, asignación y cierre, sin adelantar por elegir todos', () => {
  assert.equal(LOBBY_TIMING.selectionMs, 30_000);
  assert.equal(LOBBY_TIMING.countdownMs, 5_000);
  const { selection, at } = fixture();
  for (let index = 0; index < 4; index++) {
    selection.join(String(index), `Jugador ${index}`);
    selection.select(String(index), CHARACTERS[index].id);
  }
  at(29_999); selection.advance();
  assert.equal(selection.phase, 'selecting');
  assert.equal(selection.selectionRemainingMs, 1);
  at(30_000);
  assert.equal(selection.select('0', 'scout').code, 'closed');
  assert.equal(selection.phase, 'countdown');
  assert.equal(selection.countdownRemainingMs, 5_000);
  assert.throws(() => selection.join('5', 'Tardío'), /cerrada/);
  at(34_999); selection.advance();
  assert.equal(selection.phase, 'countdown');
  at(35_000); selection.advance();
  assert.equal(selection.phase, 'ready');
});

test('la selección es exclusiva, idempotente y un cambio rechazado conserva la clase', () => {
  const { selection } = fixture();
  selection.join('a', 'Uno'); selection.join('b', 'Dos');
  assert.equal(selection.select('a', 'medic').ok, true);
  assert.equal(selection.select('a', 'medic').ok, true);
  selection.select('b', 'soldier');
  assert.equal(selection.select('a', 'soldier').code, 'taken');
  assert.equal(selection.players.get('a')!.characterId, 'medic');
  assert.equal(selection.select('a', 'wizard').code, 'invalid');
  assert.equal(selection.select('no-existe', 'scout').code, 'not_connected');
});

for (const selected of [0, 2, 4]) test(`asignación automática con ${selected} elecciones previas`, () => {
  const { selection, at } = fixture();
  for (let index = 0; index < 4; index++) selection.join(String(index), String(index));
  for (let index = 0; index < selected; index++) selection.select(String(index), CHARACTERS[index].id);
  at(30_000); selection.advance();
  const assigned = [...selection.players.values()].map(player => player.characterId);
  assert.equal(new Set(assigned).size, 4);
  assert.ok(assigned.every(Boolean));
  for (let index = 0; index < selected; index++) assert.equal(assigned[index], CHARACTERS[index].id);
});

test('ingresos, salidas y reconexiones no reinician el plazo; límite de cuatro incluye reservas', () => {
  const { selection, at } = fixture();
  selection.join('a', 'Uno');
  at(10_000); selection.join('b', 'Dos');
  selection.join('c', 'Tres'); selection.join('d', 'Cuatro');
  selection.select('a', 'medic'); selection.drop('a');
  assert.throws(() => selection.join('e', 'Cinco'), /completa/);
  assert.equal(selection.select('b', 'medic').code, 'taken');
  assert.equal(selection.select('a', 'scout').code, 'not_connected');
  assert.equal(selection.reconnect('a'), true);
  assert.equal(selection.selectionRemainingMs, 20_000);
  selection.leave('a');
  assert.equal(selection.select('b', 'medic').ok, true);
  selection.join('e', 'Cinco');
  at(30_000); selection.advance();
  assert.equal(selection.phase, 'countdown');
});

test('un callback retrasado respeta ambos plazos originales', () => {
  const { selection, at } = fixture();
  selection.join('a', 'Uno');
  at(39_000); selection.advance();
  assert.equal(selection.phase, 'ready');
  assert.equal(selection.players.get('a')!.characterId, 'soldier');
});

test('caída durante selección recibe clase; salida en cuenta regresiva conserva el roster', () => {
  const { selection, at } = fixture();
  selection.join('a', 'Uno'); selection.join('b', 'Dos');
  selection.drop('b');
  at(30_000); selection.advance();
  assert.equal(selection.players.get('b')!.characterId, 'medic');
  selection.leave('b');
  assert.equal(selection.players.size, 2);
  assert.equal(selection.players.get('b')!.departed, true);
  assert.equal(selection.reconnect('b'), false);
  at(35_000); selection.advance();
  assert.equal(selection.phase, 'ready');
});

test('todos ausentes al comenzar cancelan; una reconexión tardía no reactiva', () => {
  const { selection, at } = fixture();
  selection.join('a', 'Uno'); selection.drop('a');
  at(35_000); selection.advance();
  assert.equal(selection.phase, 'cancelled');
  assert.equal(selection.reconnect('a'), false);
});
