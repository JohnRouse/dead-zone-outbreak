import Phaser from 'phaser';
import type { Enemy } from '../../core/reference';
import { ENEMY_TYPES } from '../../content/reference-district';
import { makePaintedRig, PAINTED_STYLE } from './PaintedActor';

export class EnemyActor {
  readonly container: Phaser.GameObjects.Container;
  private rig: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Image;
  private hitOverlay: Phaser.GameObjects.Image;
  private legs: Phaser.GameObjects.Image[];
  private arms: Phaser.GameObjects.Image[];
  private shadow: Phaser.GameObjects.Image;
  private portal?: Phaser.GameObjects.Image;
  private warning?: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, enemy: Enemy) {
    this.container = scene.add.container(enemy.x, enemy.y);
    this.shadow = scene.add.image(0, 1, 'contact-shadow').setDisplaySize(enemy.radius * 2.8, enemy.radius * .9).setAlpha(.85);
    const layers = makePaintedRig(scene, enemy.kind);
    this.rig = layers.rig; this.body = layers.body; this.legs = layers.legs; this.arms = layers.arms;
    this.hitOverlay = scene.add.image(0, 0, 'painted-actors', `${enemy.kind}-body`).setOrigin(.5, 1)
      .setDisplaySize(this.body.displayWidth, this.body.displayHeight).setTintFill(0xffe2b0).setAlpha(0);
    this.rig.add(this.hitOverlay);
    this.container.add([this.shadow, this.rig]);
    if (enemy.phase === 'emerging') {
      this.portal = scene.add.image(enemy.x, enemy.y - 38, 'door-exit').setOrigin(.5, 1).setScale(.8).setDepth(enemy.y - 1);
      this.warning = scene.add.text(enemy.x, enemy.y - 147, '!', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffcf83', backgroundColor: '#172b35' }).setOrigin(.5).setDepth(3400);
    }
  }
  update(e: Enemy) {
    const heavy = e.kind === 'brute', definition = ENEMY_TYPES[e.kind];
    const style = PAINTED_STYLE[e.kind];
    this.container.setPosition(e.x, e.y).setDepth(e.phase === 'dying' ? e.y - 4 : e.y);
    const facing = Math.cos(e.angle) < -.1 ? -1 : 1;
    const walking = e.phase === 'chasing' && e.moving;
    const gait = walking ? Math.sin(e.travelled / (heavy ? 14 : 10)) : 0;
    this.rig.setPosition(0, 0).setScale(facing, 1).setRotation(0).setAlpha(1);
    this.shadow.setDisplaySize(e.radius * 2.8, e.radius * .9);
    this.body.setPosition(e.hit > 0 ? -3 : 0, style.bodyY + (walking ? Math.abs(gait) * (heavy ? .5 : -.7) : 0)).setRotation(e.hit > 0 ? -.055 : 0);
    this.legs.forEach((leg, i) => leg.setY(1 - Math.max(0, gait * (i ? -1 : 1)) * (heavy ? 2.5 : 4)).setRotation(gait * (i ? -.065 : .065)));
    this.arms.forEach((arm, i) => arm.setRotation((i ? -.13 : .2) + gait * (i ? -.12 : .12)));
    if (e.phase === 'windup') {
      const progress = Math.min(1, e.phaseTime / definition.windup);
      this.arms[0].setRotation(.4 + progress * (heavy ? 2.1 : .8));
      this.arms[1].setRotation(-.4 - progress * (heavy ? 2.1 : .8));
      this.body.setY(style.bodyY + progress * (heavy ? 3 : 1));
    } else if (e.phase === 'strike') {
      const progress = Math.sin(Math.min(1, e.phaseTime / definition.strike) * Math.PI);
      this.arms[0].setRotation(-1.4 * progress); this.arms[1].setRotation(-1.4 * progress);
      this.body.setX(progress * 5); this.body.setRotation(progress * .1);
    } else if (e.phase === 'recover') {
      const progress = 1 - Math.min(1, e.phaseTime / definition.recovery);
      this.arms[0].setRotation(-.6 * progress); this.arms[1].setRotation(.3 * progress);
      this.body.setY(style.bodyY + progress * 3);
    } else if (e.phase === 'emerging') {
      const progress = Phaser.Math.Clamp((e.phaseTime - .45) / .85, 0, 1);
      this.rig.setY(-38 * (1 - progress)).setScale(facing * (.75 + .25 * progress), .75 + .25 * progress).setAlpha(progress);
      this.shadow.setAlpha(.7 * progress);
      this.warning?.setAlpha(.65 + Math.sin(e.phaseTime * 20) * .3);
    } else if (e.phase === 'dying') {
      const progress = Math.min(1, e.phaseTime / .45);
      // Caer alrededor del centro del cuerpo, no del pie: mantener volumen y
      // sombra bajo el cadáver evita la silueta fina que parecía suspendida.
      this.rig.setPosition(-facing * progress * 28, progress * 2)
        .setRotation(facing * progress * 1.48).setScale(facing, 1 - progress * .2)
        .setAlpha(e.phaseTime < .7 ? 1 : Math.max(0, (1.1 - e.phaseTime) / .4));
      this.shadow.setDisplaySize(e.radius * 2.8 * (1 + progress * .4), e.radius * .9 * (1 + progress * .5));
      this.shadow.setAlpha(.7 * Math.max(0, 1 - e.phaseTime / 1.1));
    } else this.shadow.setAlpha(.7);
    if (e.phase !== 'emerging') { this.portal?.destroy(); this.warning?.destroy(); this.portal = undefined; this.warning = undefined; }
    this.hitOverlay.setPosition(this.body.x, this.body.y).setRotation(this.body.rotation).setAlpha(e.hit / .15 * .28);
    for (const part of [this.body, ...this.arms]) { if (e.hit > 0) part.setTint(0xffe2b0); else part.clearTint(); }
  }
  destroy() { this.portal?.destroy(); this.warning?.destroy(); this.container.destroy(); }
}
