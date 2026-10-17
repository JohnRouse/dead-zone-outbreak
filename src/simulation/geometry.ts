import type { Point, Rect } from '../core/reference';
import { OBSTACLES, WORLD } from '../content/reference-district';
export function circleRect(p: Point, radius: number, rect: Rect) {
  return Math.hypot(p.x - Math.max(rect.x, Math.min(p.x, rect.x + rect.w)),
    p.y - Math.max(rect.y, Math.min(p.y, rect.y + rect.h))) < radius;
}
export function normalized(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function moveBody(p: Point, radius: number, dx: number, dy: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  for (let i = 0; i < steps; i++) {
    const x = Math.max(radius, Math.min(WORLD.w - radius, p.x + dx / steps));
    if (!OBSTACLES.some(rect => circleRect({ x, y: p.y }, radius, rect))) p.x = x;
    const y = Math.max(radius, Math.min(WORLD.h - radius, p.y + dy / steps));
    if (!OBSTACLES.some(rect => circleRect({ x: p.x, y }, radius, rect))) p.y = y;
  }
}
