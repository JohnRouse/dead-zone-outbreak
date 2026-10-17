import type { Enemy, InputCommand, Point, Rect, ReferenceState, SimulationEvent } from '../core/reference';
import { ENEMY_TYPES, MOVEMENT, OBSTACLES, WEAPONS, WORLD } from '../content/reference-district';

export function circleRect(p: Point, radius: number, rect: Rect) {
  return Math.hypot(p.x - Math.max(rect.x, Math.min(p.x, rect.x + rect.w)),
    p.y - Math.max(rect.y, Math.min(p.y, rect.y + rect.h))) < radius;
}
export function normalized(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function moveBody(p: Point, radius: number, dx: number, dy: number) {
  // Subpasos también para dash: no atravesar coches, barricadas ni fachadas.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  for (let i = 0; i < steps; i++) {
    const x = Math.max(radius, Math.min(WORLD.w - radius, p.x + dx / steps));
    if (!OBSTACLES.some(rect => circleRect({ x, y: p.y }, radius, rect))) p.x = x;
    const y = Math.max(radius, Math.min(WORLD.h - radius, p.y + dy / steps));
    if (!OBSTACLES.some(rect => circleRect({ x: p.x, y }, radius, rect))) p.y = y;
  }
}
export class ReferenceSimulation {
  state: ReferenceState;
  private nextId = 1;
  private seed: number;
  private manualTimer = 0;
  private autoTimer = 0;
  private spawnTimer = 5;
  constructor(seed = 9231) {
    this.seed = seed >>> 0;
    this.state = {
      phase: 'playing', tick: 0, time: 0,
      player: { x: 1400, y: 1070, hp: 100, angle: 0, moving: false, dash: 0, dashTime: 0,
        invulnerable: 0, lastX: 1, lastY: 0, dashX: 1, dashY: 0 },
      enemies: [], projectiles: [], events: [],
      stats: { manualShots: 0, autoShots: 0, kills: 0, damageReceived: 0, dashes: 0 },
    };
    this.spawn('walker', 1660, 1030);
    this.spawn('brute', 1680, 1200);
    this.spawn('walker', 1220, 1260);
    this.spawn('walker', 1530, 730);
    this.spawn('brute', 1960, 1320);
  }
  snapshot(): ReferenceState { return structuredClone(this.state); }
  togglePause() { if (this.state.phase !== 'dead') this.state.phase = this.state.phase === 'playing' ? 'paused' : 'playing'; }
  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  private spawn(kind: Enemy['kind'], x: number, y: number) {
    const definition = ENEMY_TYPES[kind];
    if (OBSTACLES.some(rect => circleRect({ x, y }, definition.radius, rect))) return;
    this.state.enemies.push({ id: this.nextId++, kind, x, y, hp: definition.hp, radius: definition.radius,
      angle: 0, hit: 0, attack: 0, recovery: 0 });
  }
  private event(kind: SimulationEvent['kind'], point: Point, angle = 0) {
    this.state.events.push({ ...point, id: this.nextId++, kind, angle, time: this.state.time });
  }
  private shoot(aim: Point, auto: boolean) {
    const p = this.state.player;
    const angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    const weapon = auto ? WEAPONS.auto : WEAPONS.manual;
    // Nace en el centro de colisión; render de fogonazo en la boca del arma.
    this.state.projectiles.push({ id: this.nextId++, x: p.x, y: p.y,
      vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed, auto, life: weapon.range / weapon.speed });
    this.state.stats[auto ? 'autoShots' : 'manualShots']++;
    this.event(auto ? 'auto' : 'manual', p, angle);
  }
  step(input: InputCommand, dt: number) {
    const s = this.state, p = s.player;
    if (s.phase !== 'playing') return;
    s.time += dt; s.tick++;
    s.events = s.events.filter(event => s.time - event.time < .24);
    for (const key of ['dash', 'dashTime', 'invulnerable'] as const) p[key] = Math.max(0, p[key] - dt);
    this.manualTimer -= dt; this.autoTimer -= dt; this.spawnTimer -= dt;
    const movement = normalized(input.moveX, input.moveY);
    p.moving = movement.x !== 0 || movement.y !== 0;
    if (p.moving) { p.lastX = movement.x; p.lastY = movement.y; }
    if (input.dash && p.dash === 0) {
      p.dash = MOVEMENT.dashCooldown; p.dashTime = MOVEMENT.dashDuration; p.invulnerable = .23;
      p.dashX = p.lastX; p.dashY = p.lastY; s.stats.dashes++;
    }
    moveBody(p, MOVEMENT.radius,
      (p.dashTime > 0 ? p.dashX * MOVEMENT.dashMultiplier : movement.x) * MOVEMENT.speed * dt,
      (p.dashTime > 0 ? p.dashY * MOVEMENT.dashMultiplier : movement.y) * MOVEMENT.speed * dt);
    p.angle = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);
    if (input.fire && this.manualTimer <= 0) { this.shoot(input.aim, false); this.manualTimer = WEAPONS.manual.interval; }
    if (this.autoTimer <= 0) {
      const nearest = s.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) <= WEAPONS.auto.range)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (nearest) { this.shoot(nearest, true); this.autoTimer = WEAPONS.auto.interval; }
    }
    for (const e of s.enemies) {
      e.hit = Math.max(0, e.hit - dt); e.recovery = Math.max(0, e.recovery - dt);
      const distance = Math.hypot(p.x - e.x, p.y - e.y);
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.attack > 0) {
        e.attack = Math.max(0, e.attack - dt);
        if (e.attack === 0) {
          e.recovery = .9;
          if (distance < e.radius + MOVEMENT.radius + 22 && p.invulnerable === 0) {
            const damage = Math.min(p.hp, ENEMY_TYPES[e.kind].damage);
            p.hp -= damage; s.stats.damageReceived += damage; p.invulnerable = .5;
            this.event('hurt', p);
            if (p.hp <= 0) { s.phase = 'dead'; break; }
          }
        }
      } else if (distance <= e.radius + MOVEMENT.radius + 12 && e.recovery === 0) e.attack = .4;
      else if (distance > e.radius + MOVEMENT.radius) {
        const direction = normalized(p.x - e.x, p.y - e.y);
        moveBody(e, e.radius, direction.x * ENEMY_TYPES[e.kind].speed * dt, direction.y * ENEMY_TYPES[e.kind].speed * dt);
      }
    }
    if (s.phase === 'dead') return; // Estado terminal: no disparos ni altas posteriores.
    for (const b of s.projectiles) {
      const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8));
      for (let n = 0; n < steps && b.life > 0; n++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (OBSTACLES.some(rect => circleRect(b, 2, rect))) { b.life = 0; this.event('impact', b); break; }
        const enemy = s.enemies.find(e => e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.radius + 2);
        if (enemy) {
          enemy.hp -= b.auto ? WEAPONS.auto.damage : WEAPONS.manual.damage;
          enemy.hit = .12; b.life = 0; this.event('impact', b);
          if (enemy.hp <= 0) s.stats.kills++;
        }
      }
      b.life -= dt;
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0);
    s.enemies = s.enemies.filter(e => e.hp > 0);
    if (this.spawnTimer <= 0 && s.enemies.length < 16) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const angle = this.random() * Math.PI * 2;
        const x = p.x + Math.cos(angle) * 660, y = p.y + Math.sin(angle) * 660;
        if (x < 40 || y < 40 || x > WORLD.w - 40 || y > WORLD.h - 40) continue;
        const count = s.enemies.length;
        this.spawn(this.random() < .3 ? 'brute' : 'walker', x, y);
        if (s.enemies.length > count) break;
      }
      this.spawnTimer = 2.4;
    }
  }
}
