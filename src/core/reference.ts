// Contratos serializables de la demo local; sin objetos de Phaser ni DOM.
export interface Point { x: number; y: number }
export interface Rect extends Point { w: number; h: number }
export interface InputCommand { sequence: number; moveX: number; moveY: number; aim: Point; fire: boolean; dash: boolean }
export interface Player extends Point {
  hp: number; angle: number; moving: boolean; dash: number; dashTime: number;
  invulnerable: number; lastX: number; lastY: number; dashX: number; dashY: number;
}
export interface Enemy extends Point {
  id: number; kind: 'walker' | 'brute'; hp: number; radius: number;
  angle: number; hit: number; attack: number; recovery: number;
}
export interface Projectile extends Point { id: number; vx: number; vy: number; auto: boolean; life: number }
export interface SimulationEvent extends Point { id: number; kind: 'manual' | 'auto' | 'impact' | 'hurt'; angle: number; time: number }
export interface ReferenceState {
  phase: 'playing' | 'paused' | 'dead'; tick: number; time: number; player: Player;
  enemies: Enemy[]; projectiles: Projectile[]; events: SimulationEvent[];
  stats: { manualShots: number; autoShots: number; kills: number; damageReceived: number; dashes: number };
}
