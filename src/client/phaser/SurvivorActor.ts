import Phaser from 'phaser';
import type { ReferenceState } from '../../core/reference';
import { makePaintedRig, PAINTED_STYLE, type PaintedRig } from './PaintedActor';

export class SurvivorActor {
  readonly container: Phaser.GameObjects.Container;
  private layers: PaintedRig;
  private weapon: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(1400, 1070);
    const shadow = scene.add.image(0, 2, 'contact-shadow').setDisplaySize(64, 24).setAlpha(.85);
    this.layers = makePaintedRig(scene, 'survivor');
    this.weapon = scene.add.image(0, -30, 'rifle-v3').setOrigin(.24, .5).setDisplaySize(70, 25);
    this.container.add([shadow, this.layers.rig, this.weapon]);
  }
  update(s: ReferenceState) {
    const p = s.player, t = s.time, style = PAINTED_STYLE.survivor;
    const walking = p.moving || p.dashTime > 0;
    const stride = walking ? Math.sin(t * (p.dashTime > 0 ? 27 : 15)) : 0;
    const facing = Math.cos(p.angle) < 0 ? -1 : 1;
    const shot = s.events.find(e => (e.kind === 'manual' || e.kind === 'auto') && t - e.time < .1);
    const recoil = shot ? (1 - (t - shot.time) / .1) * 4 : 0;
    this.container.setPosition(p.x, p.y).setDepth(p.y);
    this.layers.rig.setScale(facing, 1).setRotation(walking ? stride * .018 : 0);
    this.layers.body.setY(style.bodyY - Math.abs(stride) * .8 + Math.sin(t * 2.8) * .35);
    this.layers.legs.forEach((leg, i) => leg.setY(1 - Math.max(0, stride * (i ? -1 : 1)) * 4).setRotation(stride * (i ? -.08 : .08)));
    this.layers.arms[0].setRotation(-.65 + Math.sin(p.angle) * .22 + recoil * .013);
    this.layers.arms[1].setRotation(.22 + Math.sin(p.angle) * .22 - recoil * .02);
    this.weapon.setRotation(p.angle).setFlipY(facing < 0)
      .setPosition(-Math.cos(p.angle) * recoil, -30 - Math.sin(p.angle) * recoil);
    if (p.invulnerable > .25) this.layers.body.setTint(0xffb39b); else this.layers.body.clearTint();
    this.container.setAlpha(p.invulnerable > .25 ? .8 + Math.sin(t * 45) * .15 : 1);
  }
}
