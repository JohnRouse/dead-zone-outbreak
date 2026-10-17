import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReferenceSimulation, moveBody, circleRect } from './reference';
import { ENEMY_TYPES, OBSTACLES, PERSONAL_WEAPON, SPAWN_POINTS } from '../content/reference-district';
import type { InputCommand } from '../core/reference';
import { Navigation, segmentBlocked } from './navigation';
import { validSpawn } from './spawns';
const input: InputCommand = { sequence: 1, moveX: 0, moveY: 0, aim: { x: 2200, y: 1800 }, fire: false, dash: false };
const run = (simulation: ReferenceSimulation, command: InputCommand, ticks: number) => {
  for (let i = 0; i < ticks; i++) simulation.step({ ...command, sequence: i }, 1 / 60);
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
test('dash no atraviesa fachadas y respeta cooldown', () => {
  const p = { x: 1400, y: 620 }; moveBody(p, 17, 1200, 0); assert.ok(p.x <= 1713);
  const s = new ReferenceSimulation(); s.step({ ...input, dash: true }, 1 / 60); run(s, input, 20);
  s.step({ ...input, dash: true }, 1 / 60); assert.equal(s.state.stats.dashes, 1);
  run(s, input, 200); s.step({ ...input, dash: true }, 1 / 60); assert.equal(s.state.stats.dashes, 2);
});
test('auto, manual y alternar comparten cadencia, cargador, recarga, daño y mejoras', () => {
  const auto = new ReferenceSimulation({ scenario: 'cadence' }), manual = new ReferenceSimulation({ scenario: 'cadence' }), mixed = new ReferenceSimulation({ scenario: 'cadence' });
  for (const s of [auto, manual, mixed]) s.upgradeWeapon({ damage: 31, interval: .25 });
  const shots: number[][] = [[], [], []];
  for (let tick = 0; tick < 240; tick++) {
    [auto, manual, mixed].forEach((s, i) => {
      const count = s.state.stats.shots;
      s.step({ ...input, aim: { ...s.state.enemies[0] }, fire: i === 1 || (i === 2 && tick % 2 === 0) }, 1 / 60);
      if (s.state.stats.shots > count) shots[i].push(s.state.tick);
      assert.ok(s.state.stats.shots - count <= 1);
    });
  }
  assert.deepEqual(shots[0], shots[1]); assert.deepEqual(shots[0], shots[2]);
  assert.equal(auto.state.weapon.ammo, mixed.state.weapon.ammo);
  assert.equal(auto.state.stats.reloads, 1); assert.ok(shots[0].length > PERSONAL_WEAPON.capacity);
  assert.ok(auto.state.projectiles.every(b => b.damage === 31));
  assert.ok(shots[0].every((tick, i) => i === 0 || tick - shots[0][i - 1] >= 15));
});
test('proyectil rápido impacta una sola vez y una pared absorbe el disparo', () => {
  const s = new ReferenceSimulation({ scenario: 'cadence' });
  s.state.projectiles = [{ id: 901, x: 1600, y: 1070, vx: 900, vy: 0, auto: false, life: 1, damage: 26 }];
  const hp = s.state.enemies[0].hp;
  run(s, { ...input, fire: true }, 12);
  assert.equal(s.state.enemies[0].hp, hp - 26);
  s.state.projectiles = [{ id: 902, x: 1680, y: 620, vx: 900, vy: 0, auto: false, life: 1, damage: 26 }];
  run(s, { ...input, fire: true }, 10); assert.ok(!s.state.projectiles.some(b => b.id === 902));
});
test('caminante y pesado rodean obstáculos sin intersecciones, alcanzan y dañan', () => {
  for (const kind of ['walker', 'brute'] as const) {
    const s = new ReferenceSimulation({ scenario: 'navigation' });
    const e = s.state.enemies[0]; e.kind = kind; e.radius = ENEMY_TYPES[kind].radius;
    let side = false;
    for (let tick = 0; tick < 900 && s.state.stats.damageReceived === 0; tick++) {
      s.step({ ...input, fire: true }, 1 / 60);
      side ||= e.x < 1070 - e.radius || e.x > 1142 + e.radius;
      assert.ok(!OBSTACLES.some(rect => circleRect(e, e.radius - .01, rect)));
    }
    assert.ok(side, `${kind} debe rodear el coche`); assert.ok(s.state.stats.damageReceived > 0, kind);
  }
  for (const radius of [19, 29]) {
    const route = new Navigation(radius).route({ x: 1650, y: 600 }, { x: 2380, y: 600 });
    assert.ok(route.length >= 3, 'Rodear edificio, no solo coches');
    const points = [{ x: 1650, y: 600 }, ...route];
    for (let i = 1; i < points.length; i++) assert.equal(segmentBlocked(points[i - 1], points[i], radius), false);
  }
});
test('anticipación, golpe único, recuperación, esquiva, impacto y muerte persistente', () => {
  const s = new ReferenceSimulation({ scenario: 'contact-brute' });
  const e = s.state.enemies[0]; e.y = 990;
  s.step({ ...input, fire: true }, 1 / 60);
  assert.equal(e.phase, 'windup'); assert.equal(s.state.player.hp, 100);
  run(s, { ...input, fire: true }, 55);
  assert.equal(s.state.player.hp, 72); assert.equal(e.phase, 'strike');
  run(s, { ...input, fire: true }, 30); assert.equal(s.state.player.hp, 72); assert.equal(e.phase, 'recover');
  const dodge = new ReferenceSimulation({ scenario: 'contact-brute' }); dodge.state.enemies[0].y = 990;
  dodge.step({ ...input, fire: true }, 1 / 60); run(dodge, { ...input, fire: true, moveX: 1 }, 60);
  assert.equal(dodge.state.player.hp, 100);
  const killed = new ReferenceSimulation({ scenario: 'contact-walker' });
  run(killed, input, 70);
  assert.equal(killed.state.stats.kills, 1); assert.ok(killed.state.enemies.some(e => e.phase === 'dying'));
  run(killed, input, 70); assert.equal(killed.state.enemies.length, 0);
});
test('puntos de aparición seguros, visibles solo en puertas y solicitudes aplazadas', () => {
  const view = { x: 600, y: 620, w: 1600, h: 900 }, player = { x: 1400, y: 1070 };
  for (const point of SPAWN_POINTS) {
    assert.equal(validSpawn(point, 29, point, [], view), false, 'Nunca encima del jugador');
    if (point.source !== 'door') assert.equal(validSpawn(point, 19, player, [], { x: 0, y: 0, w: 2800, h: 2100 }), false);
  }
  const s = new ReferenceSimulation({ scenario: 'door' });
  run(s, input, 1); assert.equal(s.state.spawns[0].source, 'door'); assert.equal(s.state.enemies[0].phase, 'emerging');
  assert.equal(s.state.stats.shots, 0); run(s, input, 60); assert.equal(s.state.stats.shots, 0);
  const blocked = new ReferenceSimulation({ scenario: 'door' });
  blocked.state.player.x = SPAWN_POINTS[6].x; blocked.state.player.y = SPAWN_POINTS[6].y;
  run(blocked, input, 60); assert.equal(blocked.state.spawns.length, 0);
});
test('pausa y derrota congelan reglas y métricas', () => {
  const s = new ReferenceSimulation({ scenario: 'contact-brute' });
  run(s, { ...input, fire: true }, 1000); assert.equal(s.state.phase, 'dead');
  assert.equal(s.state.stats.damageReceived, 100);
  const dead = s.snapshot(); run(s, { ...input, moveX: 1 }, 60); assert.deepEqual(s.snapshot(), dead);
  const paused = new ReferenceSimulation(); paused.togglePause();
  const frozen = paused.snapshot(); run(paused, { ...input, moveX: 1, fire: true }, 60); assert.deepEqual(paused.snapshot(), frozen);
});
