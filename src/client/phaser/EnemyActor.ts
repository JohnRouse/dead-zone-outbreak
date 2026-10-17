import Phaser from 'phaser';
import type { Enemy } from '../../core/reference';
import { ENEMY_TYPES } from '../../content/reference-district';

export class EnemyActor {
  readonly container: Phaser.GameObjects.Container;
  private rig: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Image;
  private legs: Phaser.GameObjects.Image[];
  private arms: Phaser.GameObjects.Image[];
  private shadow: Phaser.GameObjects.Ellipse;
  private portal?: Phaser.GameObjects.Image;
  private warning?: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, enemy: Enemy) {
    const heavy = enemy.kind === 'brute', scale = .78;
    this.container = scene.add.container(enemy.x, enemy.y);
    this.shadow = scene.add.ellipse(0, 1, enemy.radius * 2.3, enemy.radius * .62, 0x0a1c28, .7);
    this.rig = scene.add.container(0, 0);
    this.legs = [-1, 1].map(side => scene.add.image(side * (heavy ? 18 : 11), 2, `${enemy.kind}-leg`).setOrigin(.5, 1).setScale(scale));
    this.body = scene.add.image(0, 7, `${enemy.kind}-body`).setOrigin(.5, 1).setScale(scale);
    this.arms = [-1, 1].map(side => scene.add.image(side * (heavy ? 37 : 25), heavy ? -65 : -47, `${enemy.kind}-arm`).setOrigin(.5, .08).setScale(heavy ? .88 : .68));
    this.rig.add([...this.legs, this.arms[0], this.body, this.arms[1]]);
    this.container.add([this.shadow, this.rig]);
    if (enemy.phase === 'emerging') {
      this.portal = scene.add.image(enemy.x, enemy.y - 38, 'door-exit').setOrigin(.5, 1).setScale(.8).setDepth(enemy.y - 1);
      this.warning = scene.add.text(enemy.x, enemy.y - 147, '!', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffcf83', backgroundColor: '#172b35' }).setOrigin(.5).setDepth(3400);
    }
  }
  update(e: Enemy) {
    const heavy = e.kind === 'brute', definition = ENEMY_TYPES[e.kind];
    this.container.setPosition(e.x, e.y).setDepth(e.phase === 'dying' ? e.y - 4 : e.y);
    const facing = Math.cos(e.angle) < -.1 ? -1 : 1;
    const walking = e.phase === 'chasing' && e.moving;
    const gait = walking ? Math.sin(e.travelled / (heavy ? 14 : 10)) : 0;
    this.rig.setPosition(0, 0).setScale(facing, 1).setRotation(0).setAlpha(1);
    this.shadow.setScale(1);
    this.body.setPosition(0, 7 + (walking ? Math.abs(gait) * (heavy ? -.5 : -1) : 0)).setRotation(e.hit > 0 ? -.08 : 0);
    this.legs.forEach((leg, i) => leg.setY(2 - Math.max(0, gait * (i ? -1 : 1)) * 4).setRotation(gait * (i ? -.09 : .09)));
    this.arms.forEach((arm, i) => arm.setRotation(gait * (i ? -.15 : .15)));
    if (e.phase === 'windup') {
      const progress = Math.min(1, e.phaseTime / definition.windup);
      this.arms[0].setRotation(.4 + progress * (heavy ? 2.1 : .8));
      this.arms[1].setRotation(-.4 - progress * (heavy ? 2.1 : .8));
      this.body.setY(7 + progress * (heavy ? 3 : 1));
    } else if (e.phase === 'strike') {
      const progress = Math.sin(Math.min(1, e.phaseTime / definition.strike) * Math.PI);
      this.arms[0].setRotation(-1.4 * progress); this.arms[1].setRotation(-1.4 * progress);
      this.body.setX(progress * 5); this.body.setRotation(progress * .1);
    } else if (e.phase === 'recover') {
      const progress = 1 - Math.min(1, e.phaseTime / definition.recovery);
      this.arms[0].setRotation(-.6 * progress); this.arms[1].setRotation(.3 * progress);
      this.body.setY(7 + progress * 3);
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
      this.shadow.setScale(1 + progress * .4, 1 + progress * .5);
      this.shadow.setAlpha(.7 * Math.max(0, 1 - e.phaseTime / 1.1));
    } else this.shadow.setAlpha(.7);
    if (e.phase !== 'emerging') { this.portal?.destroy(); this.warning?.destroy(); this.portal = undefined; this.warning = undefined; }
    for (const part of [this.body, ...this.arms]) { if (e.hit > 0) part.setTint(0xffd29c); else part.clearTint(); }
  }
  destroy() { this.portal?.destroy(); this.warning?.destroy(); this.container.destroy(); }
}
