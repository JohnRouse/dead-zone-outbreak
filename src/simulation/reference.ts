import type { Enemy, EnemyPhase, InputCommand, Point, Rect, ReferenceState, SimulationEvent } from '../core/reference';
import { ENEMY_TYPES, MOVEMENT, OBSTACLES, PERSONAL_WEAPON, SPAWN_RULES, type SpawnPoint } from '../content/reference-district';
import { SCENARIOS, type ReferenceScenario } from '../content/reference-scenarios';
import { circleRect, moveBody, normalized } from './geometry';
import { Navigation, segmentBlocked } from './navigation';
import { pointVisible, SpawnDirector, validSpawn } from './spawns';
export { circleRect, moveBody, normalized } from './geometry';

export class ReferenceSimulation {
  state: ReferenceState;
  readonly scenario: ReferenceScenario;
  private nextId = 1;
  private seed: number;
  private spawnTimer: number = SPAWN_RULES.initialDelay;
  private director = new SpawnDirector();
  private navigation = { walker: new Navigation(ENEMY_TYPES.walker.radius), brute: new Navigation(ENEMY_TYPES.brute.radius) };
  private paths = new Map<number, { points: Point[]; until: number; target: Point }>();
  constructor(options: number | { seed?: number; scenario?: ReferenceScenario } = 9231) {
    this.seed = (typeof options === 'number' ? options : options.seed ?? 9231) >>> 0;
    this.scenario = typeof options === 'number' ? 'district' : options.scenario ?? 'district';
    const content = SCENARIOS[this.scenario];
    this.state = {
      phase: 'playing', tick: 0, time: 0,
      player: { ...content.player, hp: 100, angle: 0, moving: false, dash: 0, dashTime: 0,
        invulnerable: 0, lastX: 1, lastY: 0, dashX: 1, dashY: 0 },
      enemies: [], projectiles: [], events: [], spawns: [],
      weapon: { mode: 'auto', cooldown: 0, ammo: PERSONAL_WEAPON.capacity, capacity: PERSONAL_WEAPON.capacity,
        reload: 0, damage: PERSONAL_WEAPON.damage, interval: PERSONAL_WEAPON.interval, targetId: null },
      stats: { manualShots: 0, autoShots: 0, kills: 0, damageReceived: 0, dashes: 0, shots: 0,
        reloads: 0, hits: 0, spawnRequests: 0, spawnAccepted: 0, firstDamageAt: null, peakNearby: 0, nearby: 0,
        damageByKind: { walker: 0, brute: 0 } },
    };
    // Residentes ya presentes al cargar. No son apariciones durante la partida.
    for (const e of content.enemies) { const enemy = this.createEnemy(e.kind, e.x, e.y); if (enemy && e.hp) enemy.hp = e.hp; }
    if (this.scenario === 'door') this.requestSpawn('walker', 'door-0');
  }
  snapshot(): ReferenceState { return structuredClone(this.state); }
  togglePause() { if (this.state.phase !== 'dead') this.state.phase = this.state.phase === 'playing' ? 'paused' : 'playing'; }
  // Modificadores de la única instancia; ambos modos consumen exactamente estos valores.
  upgradeWeapon(upgrade: { damage?: number; interval?: number }) {
    if (upgrade.damage !== undefined && Number.isFinite(upgrade.damage)) this.state.weapon.damage = Math.max(1, upgrade.damage);
    if (upgrade.interval !== undefined && Number.isFinite(upgrade.interval)) this.state.weapon.interval = Math.max(.08, upgrade.interval);
  }
  requestSpawn(kind: Enemy['kind'], pointId?: string) { this.director.enqueue(kind, pointId); this.state.stats.spawnRequests++; }
  private random = () => {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  };
  private createEnemy(kind: Enemy['kind'], x: number, y: number, point?: SpawnPoint) {
    const definition = ENEMY_TYPES[kind];
    if (OBSTACLES.some(rect => circleRect({ x, y }, definition.radius, rect))) return null;
    const enemy: Enemy = { id: this.nextId++, kind, x, y, hp: definition.hp, radius: definition.radius,
      angle: Math.PI / 2, hit: 0, phase: point?.source === 'door' ? 'emerging' : 'chasing', phaseTime: 0,
      attackAngle: 0, travelled: 0, moving: false, ...(point ? { spawnPointId: point.id } : {}) };
    this.state.enemies.push(enemy); return enemy;
  }
  private event(kind: SimulationEvent['kind'], point: Point, angle = 0) {
    this.state.events.push({ ...point, id: this.nextId++, kind, angle, time: this.state.time });
  }
  private setPhase(e: Enemy, phase: EnemyPhase) { e.phase = phase; e.phaseTime = 0; e.moving = false; }
  private shoot(aim: Point, auto: boolean) {
    const s = this.state, p = s.player, weapon = s.weapon;
    p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    s.projectiles.push({ id: this.nextId++, x: p.x, y: p.y, vx: Math.cos(p.angle) * PERSONAL_WEAPON.speed,
      vy: Math.sin(p.angle) * PERSONAL_WEAPON.speed, auto, damage: weapon.damage, life: PERSONAL_WEAPON.range / PERSONAL_WEAPON.speed });
    weapon.cooldown = weapon.interval; weapon.ammo--; s.stats.shots++;
    s.stats[auto ? 'autoShots' : 'manualShots']++;
    this.event(auto ? 'auto' : 'manual', p, p.angle);
    if (weapon.ammo === 0) { weapon.reload = PERSONAL_WEAPON.reloadDuration; s.stats.reloads++; }
  }
  private updateWeapon(input: InputCommand, dt: number) {
    const s = this.state, p = s.player, w = s.weapon;
    w.cooldown = Math.max(0, w.cooldown - dt);
    if (w.reload > 0) { w.reload = Math.max(0, w.reload - dt); if (w.reload === 0) w.ammo = w.capacity; }
    w.mode = input.fire ? 'manual' : 'auto'; w.targetId = null;
    let target: Point | null = input.fire ? input.aim : null;
    if (!input.fire) {
      const nearest = s.enemies.filter(e => !['dying', 'emerging'].includes(e.phase)
        && Math.hypot(e.x - p.x, e.y - p.y) <= PERSONAL_WEAPON.autoRange && !segmentBlocked(p, e, 2))
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y) || a.id - b.id)[0];
      if (nearest) { target = nearest; w.targetId = nearest.id; }
    }
    if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    if (target && w.cooldown <= 1e-8 && w.reload === 0 && w.ammo > 0) this.shoot(target, !input.fire);
  }
  private chase(e: Enemy, dt: number) {
    const p = this.state.player;
    let path = this.paths.get(e.id);
    if (!path || this.state.time >= path.until || Math.hypot(p.x - path.target.x, p.y - path.target.y) > 45) {
      path = { points: this.navigation[e.kind].route(e, p), until: this.state.time + .45, target: { x: p.x, y: p.y } };
      this.paths.set(e.id, path);
    }
    // Llegar a la esquina segura antes de girar; saltarla a 7 u cortaba la ruta
    // de cuerpos grandes y los dejaba en la zona conservadora de la AABB.
    while (path.points.length && Math.hypot(path.points[0].x - e.x, path.points[0].y - e.y) < 1) path.points.shift();
    const waypoint = path.points[0];
    if (!waypoint) return;
    const dir = normalized(waypoint.x - e.x, waypoint.y - e.y);
    let sx = 0, sy = 0;
    for (const other of this.state.enemies) {
      if (other.id === e.id || ['dying', 'emerging'].includes(other.phase)) continue;
      const dx = e.x - other.x, dy = e.y - other.y, distance = Math.hypot(dx, dy);
      const gap = e.radius + other.radius + 5;
      if (distance < gap && distance > .01) { sx += dx / distance * (1 - distance / gap); sy += dy / distance * (1 - distance / gap); }
    }
    const direction = normalized(dir.x + sx * 1.15, dir.y + sy * 1.15);
    const before = { x: e.x, y: e.y };
    moveBody(e, e.radius, direction.x * ENEMY_TYPES[e.kind].speed * dt, direction.y * ENEMY_TYPES[e.kind].speed * dt);
    const moved = Math.hypot(e.x - before.x, e.y - before.y);
    e.moving = moved > .01; e.travelled += moved;
    if (e.moving) e.angle = Math.atan2(e.y - before.y, e.x - before.x);
  }
  private updateEnemy(e: Enemy, dt: number) {
    const s = this.state, p = s.player, definition = ENEMY_TYPES[e.kind];
    e.phaseTime += dt; e.hit = Math.max(0, e.hit - dt); e.moving = false;
    if (e.phase === 'dying') return;
    if (e.phase === 'emerging') { if (e.phaseTime >= 1.3) this.setPhase(e, 'chasing'); return; }
    if (e.phase === 'hit') { if (e.phaseTime >= .18) this.setPhase(e, 'chasing'); return; }
    if (e.phase === 'recover') { if (e.phaseTime >= definition.recovery) this.setPhase(e, 'chasing'); return; }
    if (e.phase === 'strike') { if (e.phaseTime >= definition.strike) this.setPhase(e, 'recover'); return; }
    if (e.phase === 'windup') {
      if (e.phaseTime >= definition.windup) {
        this.setPhase(e, 'strike');
        const distance = Math.hypot(p.x - e.x, p.y - e.y);
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const difference = Math.atan2(Math.sin(angle - e.attackAngle), Math.cos(angle - e.attackAngle));
        if (distance <= e.radius + MOVEMENT.radius + definition.reach && Math.abs(difference) <= definition.arc
          && p.invulnerable === 0 && !segmentBlocked(e, p, 0)) {
          const damage = Math.min(p.hp, definition.damage);
          p.hp -= damage; p.invulnerable = .5; s.stats.damageReceived += damage; s.stats.damageByKind[e.kind] += damage;
          s.stats.firstDamageAt ??= s.time;
          this.event('hurt', p, e.attackAngle);
          if (p.hp === 0) s.phase = 'dead';
        }
      }
      return;
    }
    const distance = Math.hypot(p.x - e.x, p.y - e.y);
    const startRange = e.radius + MOVEMENT.radius + (e.kind === 'brute' ? 50 : 10);
    if (distance <= startRange && !segmentBlocked(e, p, 0)) {
      e.attackAngle = Math.atan2(p.y - e.y, p.x - e.x); e.angle = e.attackAngle;
      this.setPhase(e, 'windup');
    } else this.chase(e, dt);
  }
  step(input: InputCommand, dt: number, view?: Rect) {
    const s = this.state, p = s.player;
    if (s.phase !== 'playing') return;
    s.time += dt; s.tick++;
    s.events = s.events.filter(event => s.time - event.time < .24);
    for (const key of ['dash', 'dashTime', 'invulnerable'] as const) p[key] = Math.max(0, p[key] - dt);
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
    this.updateWeapon(input, dt);
    for (const e of s.enemies) { this.updateEnemy(e, dt); if (p.hp === 0) break; }
    if (p.hp === 0) return;
    for (const b of s.projectiles) {
      const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 6));
      for (let n = 0; n < steps && b.life > 0; n++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (OBSTACLES.some(rect => circleRect(b, 2, rect))) { b.life = 0; this.event('impact', b); break; }
        const enemy = s.enemies.find(e => e.hp > 0 && !['dying', 'emerging'].includes(e.phase) && Math.hypot(e.x - b.x, e.y - b.y) < e.radius + 2);
        if (enemy) {
          enemy.hp = Math.max(0, enemy.hp - b.damage); enemy.hit = .15; b.life = 0; s.stats.hits++; this.event('impact', b);
          if (enemy.hp === 0) { this.setPhase(enemy, 'dying'); s.stats.kills++; this.paths.delete(enemy.id); }
          else if (enemy.kind === 'walker') this.setPhase(enemy, 'hit'); // El pesado mantiene la preparación: hay que esquivar.
        }
      }
      b.life -= dt;
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0);
    s.enemies = s.enemies.filter(e => e.phase !== 'dying' || e.phaseTime < 1.1);
    s.stats.nearby = s.enemies.filter(e => e.phase !== 'dying' && Math.hypot(e.x - p.x, e.y - p.y) < 360).length;
    s.stats.peakNearby = Math.max(s.stats.peakNearby, s.stats.nearby);
    if (SCENARIOS[this.scenario].spawns) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) { this.requestSpawn(this.random() < .35 ? 'brute' : 'walker'); this.spawnTimer = SPAWN_RULES.interval; }
    }
    const visible = view ?? { x: p.x - 800, y: p.y - 450, w: 1600, h: 900 };
    if (s.enemies.filter(e => e.phase !== 'dying').length < SPAWN_RULES.maxAlive) {
      const spawn = this.director.next(this.random, (point, kind) => validSpawn(point, ENEMY_TYPES[kind].radius, p, s.enemies, visible));
      if (spawn && this.createEnemy(spawn.kind, spawn.point.x, spawn.point.y, spawn.point)) {
        s.spawns.push({ ...spawn.point, kind: spawn.kind, pointId: spawn.point.id, time: s.time,
          visible: pointVisible(spawn.point, visible), distance: Math.hypot(spawn.point.x - p.x, spawn.point.y - p.y), view: { ...visible } });
        s.stats.spawnAccepted++;
        if (s.spawns.length > 128) s.spawns.shift();
      }
    }
  }
}
