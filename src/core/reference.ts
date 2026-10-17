// Contratos serializables de la demo local; sin objetos de Phaser ni DOM.
export interface Point { x: number; y: number }
export interface Rect extends Point { w: number; h: number }
export interface InputCommand { sequence: number; moveX: number; moveY: number; aim: Point; fire: boolean; dash: boolean }
export interface Player extends Point {
  hp: number; angle: number; moving: boolean; dash: number; dashTime: number;
  invulnerable: number; lastX: number; lastY: number; dashX: number; dashY: number;
}
export type EnemyPhase = 'emerging' | 'chasing' | 'windup' | 'strike' | 'recover' | 'hit' | 'dying';
export interface Enemy extends Point {
  id: number; kind: 'walker' | 'brute'; hp: number; radius: number;
  angle: number; hit: number; phase: EnemyPhase; phaseTime: number;
  attackAngle: number; travelled: number; moving: boolean; spawnPointId?: string;
}
export interface Projectile extends Point { id: number; vx: number; vy: number; auto: boolean; life: number; damage: number }
export interface SimulationEvent extends Point { id: number; kind: 'manual' | 'auto' | 'impact' | 'hurt'; angle: number; time: number }
export interface SpawnRecord extends Point {
  pointId: string; kind: Enemy['kind']; source: 'edge' | 'alley' | 'door'; time: number;
  visible: boolean; distance: number; view: Rect;
}
export interface WeaponState {
  mode: 'manual' | 'auto'; cooldown: number; ammo: number; capacity: number; reload: number;
  damage: number; interval: number; targetId: number | null;
}
export interface ReferenceState {
  phase: 'playing' | 'paused' | 'dead'; tick: number; time: number; player: Player;
  enemies: Enemy[]; projectiles: Projectile[]; events: SimulationEvent[];
  weapon: WeaponState; spawns: SpawnRecord[];
  stats: { manualShots: number; autoShots: number; kills: number; damageReceived: number; dashes: number;
    shots: number; reloads: number; hits: number; spawnRequests: number; spawnAccepted: number;
    firstDamageAt: number | null; peakNearby: number; nearby: number; damageByKind: { walker: number; brute: number } };
}
