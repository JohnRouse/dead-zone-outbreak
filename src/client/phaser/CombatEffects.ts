import Phaser from 'phaser';
import type { ReferenceState } from '../../core/reference';

// Solo presentación: consume eventos y proyectiles ya resueltos por la simulación.
export class CombatEffects {
  private flashes: Phaser.GameObjects.Image[];
  constructor(scene: Phaser.Scene) {
    this.flashes = Array.from({ length: 4 }, () => scene.add.image(0, 0, 'muzzle-v3')
      .setOrigin(.04, .5).setDisplaySize(31, 21).setDepth(3550).setVisible(false));
  }
  draw(state: ReferenceState, g: Phaser.GameObjects.Graphics) {
    this.flashes.forEach(image => image.setVisible(false));
    let flash = 0;
    for (const b of state.projectiles) {
      const angle = Math.atan2(b.vy, b.vx), dx = Math.cos(angle), dy = Math.sin(angle);
      const x = b.x, y = b.y - 26;
      // Cola suave, núcleo estrecho y punta: misma bala en ambos modos.
      g.lineStyle(5, 0xe5a45c, .15).lineBetween(x - dx * 26, y - dy * 26, x, y);
      g.lineStyle(2.5, 0xf1c97c, .75).lineBetween(x - dx * 18, y - dy * 18, x, y);
      g.fillStyle(0xfff4cf, 1).fillTriangle(x + dy * 1.8, y - dx * 1.8, x - dy * 1.8, y + dx * 1.8, x + dx * 6, y + dy * 6);
      g.lineStyle(1, 0xfff8e2, .9).lineBetween(x - dx * 8, y - dy * 8, x + dx * 3, y + dy * 3);
    }
    // Cantidad acotada al intervalo corto de eventos de simulación; no deja partículas permanentes.
    for (const event of state.events.slice(-10)) {
      const age = state.time - event.time;
      if (event.kind === 'manual' || event.kind === 'auto') {
        if (age > .06 || flash >= this.flashes.length) continue;
        const x = event.x + Math.cos(event.angle) * 51, y = event.y - 30 + Math.sin(event.angle) * 51;
        this.flashes[flash++].setPosition(x, y).setRotation(event.angle).setAlpha(1 - age / .075).setVisible(true);
        g.fillStyle(0xf7c370, .12 * (1 - age / .06)).fillCircle(x, y, 21);
      } else if (event.kind === 'impact') {
        if (age > .18) continue;
        const enemy = state.enemies.find(e => Math.hypot(e.x - event.x, e.y - event.y) <= e.radius + 7);
        const x = event.x, y = event.y - 26, alpha = 1 - age / .18;
        const incoming = Math.atan2(event.y - state.player.y, event.x - state.player.x);
        if (enemy) {
          g.fillStyle(0xffe1a2, alpha * .9).fillCircle(x, y, 4 * alpha + 1);
          g.lineStyle(1.7, 0xf4dbab, alpha * .7).strokeEllipse(x, y, 10 + age * 50, 6 + age * 30);
        }
        for (let i = 0; i < (enemy ? 5 : 3); i++) {
          const angle = incoming + (i - 2) * .68 + (event.id % 3) * .13;
          const distance = 3 + age * (enemy ? 94 : 74);
          const px = x + Math.cos(angle) * distance, py = y + Math.sin(angle) * distance + age * age * 100;
          g.lineStyle(enemy ? 2.1 : 1.7, enemy ? (i % 2 ? 0x92965d : 0xdac994) : 0xd0d6bd, alpha)
            .lineBetween(px, py, px + Math.cos(angle) * 4, py + Math.sin(angle) * 4);
        }
      } else {
        g.lineStyle(2.2, 0xf0a082, Math.max(0, 1 - age / .22));
        g.lineBetween(event.x - 14, event.y - 56 + age * 20, event.x + 12, event.y - 18 + age * 20);
      }
    }
  }
}
