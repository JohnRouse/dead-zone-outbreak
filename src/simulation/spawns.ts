import type { Enemy, Point, Rect } from '../core/reference';
import { SPAWN_POINTS, SPAWN_RULES, type SpawnPoint } from '../content/reference-district';
import { circleRect } from './geometry';
import { OBSTACLES, WORLD } from '../content/reference-district';

export function pointVisible(p: Point, view: Rect, padding = 80) {
  return p.x >= view.x - padding && p.y >= view.y - padding && p.x <= view.x + view.w + padding && p.y <= view.y + view.h + padding;
}
export function validSpawn(point: SpawnPoint, radius: number, player: Point, enemies: Enemy[], view: Rect) {
  const distance = Math.hypot(point.x - player.x, point.y - player.y);
  return distance >= SPAWN_RULES.minDistance && distance <= SPAWN_RULES.maxDistance && point.x >= radius && point.y >= radius
    && point.x <= WORLD.w - radius && point.y <= WORLD.h - radius
    && !OBSTACLES.some(rect => circleRect(point, radius + 2, rect))
    && !enemies.some(e => e.phase !== 'dying' && Math.hypot(e.x - point.x, e.y - point.y) < radius + e.radius + 30)
    && (point.source === 'door' || !pointVisible(point, view));
}
// Cola de intenciones: un futuro director de hordas puede pedir tipo/punto sin crear entidades directamente.
export class SpawnDirector {
  private requests: { kind: Enemy['kind']; pointId?: string }[] = [];
  enqueue(kind: Enemy['kind'], pointId?: string) { if (this.requests.length < 32) this.requests.push({ kind, pointId }); }
  next(random: () => number, eligible: (point: SpawnPoint, kind: Enemy['kind']) => boolean) {
    const request = this.requests[0];
    if (!request) return null;
    const points = SPAWN_POINTS.filter(p => (!request.pointId || p.id === request.pointId) && eligible(p, request.kind));
    if (!points.length) return null; // Se aplaza; no se fuerza un punto inválido.
    const point = points[Math.floor(random() * points.length)];
    this.requests.shift();
    return { point, kind: request.kind };
  }
}
