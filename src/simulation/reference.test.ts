import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReferenceSimulation, moveBody } from './reference';
import type { InputCommand } from '../core/reference';
const input: InputCommand = { sequence: 1, moveX: 0, moveY: 0, aim: { x: 1900, y: 1070 }, fire: false, dash: false };
const run = (simulation: ReferenceSimulation, command: InputCommand, ticks: number) => {
  for (let i = 0; i < ticks; i++) simulation.step(command, 1 / 60);
};
test('movimiento normalizado y reproducción de comandos/semilla con snapshots serializables', () => {
  const a = new ReferenceSimulation(), b = new ReferenceSimulation(), diagonal = new ReferenceSimulation();
  const start = { ...a.state.player };
  run(a, { ...input, moveX: 1 }, 20); run(b, { ...input, moveX: 1 }, 20);
  run(diagonal, { ...input, moveX: 1, moveY: 1 }, 20);
  assert.deepEqual(a.snapshot(), b.snapshot());
  assert.ok(Math.abs(Math.hypot(diagonal.state.player.x - start.x, diagonal.state.player.y - start.y) - (a.state.player.x - start.x)) < .001);
  assert.deepEqual(JSON.parse(JSON.stringify(a.snapshot())), a.snapshot());
});
test('dash no atraviesa fachadas; cooldown rechaza otro impulso', () => {
  const p = { x: 1400, y: 620 };
  moveBody(p, 17, 1200, 0);
  assert.ok(p.x <= 1713); // Fachada este comienza en 1730.
  const s = new ReferenceSimulation();
  s.step({ ...input, dash: true }, 1 / 60);
  run(s, input, 20);
  s.step({ ...input, dash: true }, 1 / 60);
  assert.equal(s.state.stats.dashes, 1);
  run(s, input, 200);
  s.step({ ...input, dash: true }, 1 / 60);
  assert.equal(s.state.stats.dashes, 2);
});
test('proyectiles rápidos golpean una vez; la pared absorbe disparos', () => {
  const s = new ReferenceSimulation();
  s.state.enemies = [{ id: 900, kind: 'brute', x: 1480, y: 1070, hp: 130, radius: 29, angle: 0, hit: 0, attack: 0, recovery: 0 }];
  s.state.projectiles = [{ id: 901, x: 1420, y: 1070, vx: 900, vy: 0, auto: false, life: 1 }];
  run(s, input, 12);
  // 26 manual + 16 del apoyo; no se repite el impacto de la misma bala.
  assert.equal(s.state.enemies[0].hp, 88);
  s.state.projectiles = [{ id: 902, x: 1680, y: 620, vx: 900, vy: 0, auto: false, life: 1 }];
  run(s, input, 10);
  assert.ok(!s.state.projectiles.some(b => b.id === 902));
});
test('ataque anuncia, respeta invulnerabilidad, registra daño y congela derrota/pausa', () => {
  const s = new ReferenceSimulation();
  s.state.enemies = [{ id: 900, kind: 'brute', x: 1400, y: 1070, hp: 10000, radius: 29, angle: 0, hit: 0, attack: 0, recovery: 0 }];
  s.state.player.hp = 21;
  s.step(input, 1 / 60);
  assert.ok(s.state.enemies[0].attack > 0);
  assert.equal(s.state.player.hp, 21);
  s.state.player.invulnerable = 1;
  run(s, input, 30);
  assert.equal(s.state.player.hp, 21);
  run(s, input, 100);
  assert.equal(s.state.phase, 'dead');
  assert.equal(s.state.stats.damageReceived, 21);
  const dead = s.snapshot(); run(s, { ...input, fire: true }, 60);
  assert.deepEqual(s.snapshot(), dead);
  const paused = new ReferenceSimulation(); paused.togglePause();
  const frozen = paused.snapshot(); run(paused, { ...input, moveX: 1, fire: true }, 60);
  assert.deepEqual(paused.snapshot(), frozen);
});
