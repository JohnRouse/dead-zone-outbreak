import Phaser from 'phaser';

// Coordenadas en mundo y puntos de anclaje de presentación: no son hitboxes.
export const PAINTED_STYLE = {
  survivor: { bodyW: 63, bodyH: 66, bodyY: -20, armY: -67, armX: 27, armW: 18, armH: 43, legW: 14, legH: 31, legX: 11 },
  walker: { bodyW: 49, bodyH: 62, bodyY: -18, armY: -57, armX: 22, armW: 13, armH: 48, legW: 13, legH: 29, legX: 10 },
  brute: { bodyW: 89, bodyH: 80, bodyY: -23, armY: -76, armX: 39, armW: 30, armH: 65, legW: 22, legH: 36, legX: 22 },
} as const;
export type PaintedKind = keyof typeof PAINTED_STYLE;
export interface PaintedRig {
  rig: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image;
  arms: Phaser.GameObjects.Image[]; legs: Phaser.GameObjects.Image[];
}
export function makePaintedRig(scene: Phaser.Scene, kind: PaintedKind): PaintedRig {
  const style = PAINTED_STYLE[kind];
  const rig = scene.add.container(0, 0);
  const legs = [-1, 1].map(side => scene.add.image(side * style.legX, 1, 'painted-actors', `${kind}-leg`)
    .setOrigin(.5, 1).setDisplaySize(style.legW, style.legH).setFlipX(side < 0));
  const body = scene.add.image(0, style.bodyY, 'painted-actors', `${kind}-body`).setOrigin(.5, 1).setDisplaySize(style.bodyW, style.bodyH);
  const arms = [-1, 1].map((side, i) => scene.add.image(side * style.armX, style.armY, 'painted-actors', `${kind}-${i ? 'right' : 'left'}-arm`)
    .setOrigin(.5, .1).setDisplaySize(style.armW * (kind === 'brute' && i ? 1.17 : 1), style.armH));
  rig.add([...legs, arms[0], body, arms[1]]);
  return { rig, body, arms, legs };
}
