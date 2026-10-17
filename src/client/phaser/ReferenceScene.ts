import Phaser from 'phaser';
import { ReferenceSimulation } from '../../simulation/reference';
import { ENEMY_TYPES, LAMPS, WORLD } from '../../content/reference-district';
import type { ReferenceScenario } from '../../content/reference-scenarios';
import type { ReferenceState } from '../../core/reference';
import { ReferenceInput } from '../input/ReferenceInput';
import { EnemyActor } from './EnemyActor';

interface Actor {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  head?: Phaser.GameObjects.Image;
  boots?: Phaser.GameObjects.Image[];
  weapon?: Phaser.GameObjects.Image;
}
export interface ReferenceView {
  state: ReferenceState;
  camera: { x: number; y: number; zoom: number; width: number; height: number };
  world: typeof WORLD;
  light: 'night' | 'day';
  renderer: string;
  scenario: ReferenceScenario;
}
const STEP = 1 / 60;
export class ReferenceScene extends Phaser.Scene {
  onReady?: () => void;
  private simulation: ReferenceSimulation;
  private controls!: ReferenceInput;
  private survivor!: Actor;
  private enemies = new Map<number, EnemyActor>();
  private graphics!: Phaser.GameObjects.Graphics;
  private worldArt!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Image;
  private lightPools: Phaser.GameObjects.Image[] = [];
  private accumulator = 0;
  private started = false;
  private night = true;
  private onView: (view: ReferenceView) => void;
  private hudTimer = 0;
  constructor(onView: (view: ReferenceView) => void, private scenario: ReferenceScenario = 'district', private seed = 9231) {
    super('ReferenceDistrict'); this.onView = onView; this.simulation = new ReferenceSimulation({ scenario, seed });
  }
  preload() {
    const assets = {
      district: 'world/district.svg', body: 'characters/soldier-body.svg', head: 'characters/soldier-head.svg',
      boot: 'characters/boot.svg', rifle: 'characters/rifle.svg', 'door-exit': 'world/door-exit.svg',
      light: 'vfx/light.svg', vignette: 'vfx/vignette.svg',
      'walker-body': 'enemies/walker-body.svg', 'walker-arm': 'enemies/walker-arm.svg', 'walker-leg': 'enemies/walker-leg.svg',
      'brute-body': 'enemies/brute-body.svg', 'brute-arm': 'enemies/brute-arm.svg', 'brute-leg': 'enemies/brute-leg.svg',
    };
    for (const [key, path] of Object.entries(assets)) this.load.svg(key, `/assets/${path}`);
  }
  create() {
    this.worldArt = this.add.image(0, 0, 'district').setOrigin(0).setDepth(-10);
    for (const lamp of LAMPS) {
      this.lightPools.push(this.add.image(lamp.x + 35, lamp.y - 8, 'light').setDisplaySize(480, 340).setDepth(-5).setBlendMode(Phaser.BlendModes.SCREEN));
      this.lightPools.push(this.add.image(lamp.x + 48, lamp.y - 108, 'light').setDisplaySize(130, 95).setDepth(4000).setAlpha(.7).setBlendMode(Phaser.BlendModes.SCREEN));
    }
    const container = this.add.container(1400, 1070);
    const shadow = this.add.ellipse(0, 2, 48, 20, 0x0b202d, .65);
    const boots = [-11, 11].map(x => this.add.image(x, 1, 'boot').setOrigin(.5, 1).setScale(.58));
    const body = this.add.image(0, 12, 'body').setOrigin(.5, 1).setScale(.8);
    const head = this.add.image(0, 12, 'head').setOrigin(.5, 1).setScale(.8);
    const weapon = this.add.image(8, -34, 'rifle').setOrigin(.24, .5).setScale(.68);
    container.add([shadow, ...boots, body, head, weapon]);
    this.survivor = { container, body, head, weapon, boots };
    this.graphics = this.add.graphics().setDepth(3500);
    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(5000);
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.w, WORLD.h);
    camera.startFollow(container, false, .14, .14);
    this.resize();
    const p = this.simulation.state.player;
    container.setPosition(p.x, p.y); camera.centerOn(p.x, p.y);
    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Distrito urbano. WASD o flechas para moverse, mouse y clic para disparar, Espacio o Shift para dash.');
    this.controls = new ReferenceInput(canvas, () => this.pause(), () => {
      if (this.started && this.simulation.state.phase === 'playing') this.pause();
    });
    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => { this.controls.destroy(); this.scale.off('resize', this.resize, this); });
    this.setLighting(true);
    this.renderState();
    this.onView(this.snapshot());
    this.onReady?.();
  }
  begin() { this.started = true; this.controls.enable(true); this.game.canvas.focus(); this.onView(this.snapshot()); }
  pause() {
    if (!this.started) return;
    this.simulation.togglePause(); this.accumulator = 0;
    this.controls.enable(this.simulation.state.phase === 'playing');
    if (this.simulation.state.phase === 'playing') this.game.canvas.focus();
    this.onView(this.snapshot());
  }
  restart() {
    for (const actor of this.enemies.values()) actor.destroy(); this.enemies.clear();
    this.simulation = new ReferenceSimulation({ scenario: this.scenario, seed: this.seed }); this.accumulator = 0;
    const p = this.simulation.state.player;
    this.cameras.main.centerOn(p.x, p.y);
    this.survivor.container.setPosition(p.x, p.y);
    this.controls.enable(true); this.started = true; this.game.canvas.focus();
    this.renderState(); this.onView(this.snapshot());
  }
  setLighting(night: boolean) {
    this.night = night;
    if (!this.worldArt) return;
    this.worldArt.setTint(night ? 0xa9bdd2 : 0xffffff);
    this.vignette.setAlpha(night ? .7 : .16);
    this.lightPools.forEach((light, i) => light.setAlpha(night ? (i % 2 ? .7 : .8) : .15));
    this.onView(this.snapshot());
  }
  private resize() {
    // Campo vertical estable en unidades de mundo, sin filtro ni redondeo pixelado.
    this.cameras.main.setZoom(this.scale.height / 900);
    const zoom = this.cameras.main.zoom;
    this.vignette.setDisplaySize(this.scale.width / zoom, this.scale.height / zoom);
    // Los objetos scrollFactor=0 reciben también la transformación de zoom.
    this.vignette.setPosition((this.scale.width - this.scale.width / zoom) / 2,
      (this.scale.height - this.scale.height / zoom) / 2);
  }
  snapshot(): ReferenceView {
    const camera = this.cameras.main;
    return { state: this.simulation.snapshot(), world: WORLD, light: this.night ? 'night' : 'day',
      camera: { x: camera.scrollX, y: camera.scrollY, zoom: camera.zoom, width: camera.width / camera.zoom, height: camera.height / camera.zoom },
      renderer: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas', scenario: this.scenario };
  }
  update(_time: number, delta: number) {
    if (!this.controls) return;
    if (this.started && this.simulation.state.phase === 'playing') {
      // Máximo 6 pasos al recuperar foco; no simular minutos de pestaña oculta.
      this.accumulator = Math.min(this.accumulator + delta / 1000, STEP * 6);
      const pointer = this.input.activePointer;
      const aim = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      while (this.accumulator >= STEP) {
        // La simulación usa pies en el suelo; las balas se dibujan a 26 u de altura.
        // Compensar esa altura hace que la trayectoria visible alcance la mira.
        const visible = this.cameras.main.worldView;
        this.simulation.step(this.controls.sample({ x: aim.x, y: aim.y + 26 }), STEP,
          { x: visible.x, y: visible.y, w: visible.width, h: visible.height });
        this.accumulator -= STEP;
      }
    }
    this.renderState();
    this.hudTimer += delta;
    if (this.hudTimer >= 80) { this.onView(this.snapshot()); this.hudTimer = 0; }
  }
  private renderState() {
    const s = this.simulation.state, p = s.player, t = s.time;
    const g = this.graphics;
    g.clear();
    this.survivor.container.setPosition(p.x, p.y).setDepth(p.y);
    const walk = p.moving || p.dashTime > 0;
    const bob = walk ? Math.sin(t * 17) * 2 : Math.sin(t * 3) * .7;
    const facing = Math.cos(p.angle) < 0 ? -1 : 1;
    this.survivor.body.setY(12 + bob).setScale(.8 * facing, .8);
    this.survivor.head!.setY(12 + bob).setScale(.8 * facing, .8);
    this.survivor.boots!.forEach((boot, i) => boot.setY(1 - (walk ? Math.max(0, Math.sin(t * 17 + i * Math.PI)) * 4 : 0)));
    const shooting = s.events.some(e => (e.kind === 'manual' || e.kind === 'auto') && t - e.time < .08);
    this.survivor.weapon!.setRotation(p.angle).setPosition(8 - (shooting ? Math.cos(p.angle) * 5 : 0), -34 + bob);
    this.survivor.weapon!.setFlipY(facing < 0);
    this.survivor.container.setAlpha(p.invulnerable > .25 ? .65 + Math.sin(t * 45) * .25 : 1);
    g.lineStyle(2, 0x99d4c3, .65).strokeEllipse(p.x, p.y + 2, 52, 21);
    if (p.dashTime > 0) {
      for (let i = 1; i < 4; i++) g.lineStyle(4 - i, 0x8bdfd0, .5 / i)
        .lineBetween(p.x - p.dashX * 24 * i, p.y - p.dashY * 24 * i,
          p.x - p.dashX * (24 * i + 24), p.y - p.dashY * (24 * i + 24));
    }
    for (const [id, actor] of this.enemies) {
      if (!s.enemies.some(enemy => enemy.id === id)) { actor.destroy(); this.enemies.delete(id); }
    }
    for (const e of s.enemies) {
      let actor = this.enemies.get(e.id);
      if (!actor) {
        actor = new EnemyActor(this, e); this.enemies.set(e.id, actor);
      }
      actor.update(e);
      if (e.phase === 'windup' || e.phase === 'strike') {
        const reach = e.radius + 17 + ENEMY_TYPES[e.kind].reach;
        const arc = ENEMY_TYPES[e.kind].arc;
        g.fillStyle(e.phase === 'strike' ? 0xf3c27d : 0xe65d40, e.phase === 'strike' ? .35 : .13);
        g.beginPath().slice(e.x, e.y, reach, e.attackAngle - arc, e.attackAngle + arc, false).fillPath();
        g.lineStyle(2, 0xf5a860, .85).beginPath().arc(e.x, e.y, reach, e.attackAngle - arc, e.attackAngle + arc).strokePath();
      }
      if (e.hit > 0) {
        const maxhp = ENEMY_TYPES[e.kind].hp;
        g.fillStyle(0x172b35, .9).fillRoundedRect(e.x - 23, e.y - (e.kind === 'brute' ? 111 : 88), 46, 5, 2);
        g.fillStyle(0xd6b97b, 1).fillRoundedRect(e.x - 23, e.y - (e.kind === 'brute' ? 111 : 88), 46 * Math.min(1, e.hp / maxhp), 5, 2);
      }
    }
    for (const b of s.projectiles) {
      const angle = Math.atan2(b.vy, b.vx);
      g.lineStyle(3, 0xffd68d, .9)
        .lineBetween(b.x, b.y - 26, b.x - Math.cos(angle) * 17, b.y - 26 - Math.sin(angle) * 17);
      g.fillStyle(0xfff2c9, 1).fillCircle(b.x, b.y - 26, 2);
    }
    for (const event of s.events) {
      const age = t - event.time;
      if (event.kind === 'manual' || event.kind === 'auto') {
        if (age > .065) continue;
        const x = event.x + Math.cos(event.angle) * 47, y = event.y - 32 + Math.sin(event.angle) * 47;
        g.fillStyle(0xffd58b, .85).fillCircle(x, y, 8 - age * 60);
        g.lineStyle(2, 0xffebbd, .8).lineBetween(x - 10, y, x + 10, y);
      } else {
        g.lineStyle(2, event.kind === 'hurt' ? 0xef8b74 : 0xd1df9a, Math.max(0, 1 - age * 4));
        for (let i = 0; i < 5; i++) {
          const angle = i * Math.PI * .4 + event.id;
          g.lineBetween(event.x + Math.cos(angle) * age * 65, event.y - 28 + Math.sin(angle) * age * 65,
            event.x + Math.cos(angle) * (age * 65 + 5), event.y - 28 + Math.sin(angle) * (age * 65 + 5));
        }
      }
    }
    if (this.started) {
      const pointer = this.input.activePointer;
      const target = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      g.lineStyle(1.5, 0xe7e9c9, .8).strokeCircle(target.x, target.y, 8);
      for (const dx of [-1, 1]) g.lineBetween(target.x + dx * 11, target.y, target.x + dx * 16, target.y);
      g.lineBetween(target.x, target.y - 11, target.x, target.y - 16);
      g.lineBetween(target.x, target.y + 11, target.x, target.y + 16);
    }
  }
}
