import type { Point, Rect } from '../core/reference';
import { OBSTACLES, WORLD } from '../content/reference-district';

// Prueba continua de segmento contra AABB expandida: sirve para rutas y línea de tiro.
export function segmentBlocked(a: Point, b: Point, radius = 0): boolean {
  return OBSTACLES.some(rect => {
    let low = 0, high = 1;
    for (const axis of ['x', 'y'] as const) {
      const d = b[axis] - a[axis], min = rect[axis] - radius;
      const max = rect[axis] + (axis === 'x' ? rect.w : rect.h) + radius;
      if (Math.abs(d) < 1e-8) { if (a[axis] < min || a[axis] > max) return false; }
      else {
        const t1 = (min - a[axis]) / d, t2 = (max - a[axis]) / d;
        low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2));
        if (low > high) return false;
      }
    }
    return high >= 0 && low <= 1;
  });
}
function inside(p: Point, r: Rect, padding: number) {
  return p.x > r.x - padding && p.x < r.x + r.w + padding && p.y > r.y - padding && p.y < r.y + r.h + padding;
}
function targetForRadius(target: Point, radius: number): Point {
  let p = { ...target };
  for (const rect of OBSTACLES) if (inside(p, rect, radius + 1)) {
    const candidates = [{ x: rect.x - radius - 2, y: p.y }, { x: rect.x + rect.w + radius + 2, y: p.y },
      { x: p.x, y: rect.y - radius - 2 }, { x: p.x, y: rect.y + rect.h + radius + 2 }];
    p = candidates.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  }
  return p;
}
export class Navigation {
  private corners: Point[];
  private links: { to: number; cost: number }[][];
  constructor(private radius: number) {
    const padding = radius + 5;
    this.corners = OBSTACLES.flatMap(r => [
      { x: r.x - padding, y: r.y - padding }, { x: r.x + r.w + padding, y: r.y - padding },
      { x: r.x + r.w + padding, y: r.y + r.h + padding }, { x: r.x - padding, y: r.y + r.h + padding },
    ]).filter(p => p.x >= radius && p.y >= radius && p.x <= WORLD.w - radius && p.y <= WORLD.h - radius
      && !OBSTACLES.some(rect => inside(p, rect, radius)));
    this.links = this.corners.map((a, i) => this.corners.flatMap((b, j) =>
      i !== j && !segmentBlocked(a, b, radius) ? [{ to: j, cost: Math.hypot(a.x - b.x, a.y - b.y) }] : []));
  }
  route(from: Point, target: Point): Point[] {
    const safeStart = targetForRadius(from, this.radius);
    if (Math.hypot(safeStart.x - from.x, safeStart.y - from.y) > .01) {
      return [safeStart, ...this.route(safeStart, target)];
    }
    const goal = targetForRadius(target, this.radius);
    if (!segmentBlocked(from, goal, this.radius)) return [goal];
    const points = [...this.corners, from, goal], start = points.length - 2, end = points.length - 1;
    const links = this.links.map(list => [...list]); links.push([], []);
    for (let i = 0; i < this.corners.length; i++) {
      for (const j of [start, end]) if (!segmentBlocked(points[i], points[j], this.radius)) {
        const cost = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        links[i].push({ to: j, cost }); links[j].push({ to: i, cost });
      }
    }
    const costs = points.map(() => Infinity), previous = points.map(() => -1), visited = new Set<number>();
    costs[start] = 0;
    for (let n = 0; n < points.length; n++) {
      let current = -1;
      for (let i = 0; i < points.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
      if (current < 0 || costs[current] === Infinity) break;
      if (current === end) {
        const route: Point[] = [];
        for (let at = end; at !== start; at = previous[at]) route.unshift({ ...points[at] });
        return route;
      }
      visited.add(current);
      for (const edge of links[current]) if (costs[current] + edge.cost < costs[edge.to]) {
        costs[edge.to] = costs[current] + edge.cost; previous[edge.to] = current;
      }
    }
    return []; // Nunca sustituir una ruta fallida por atravesar una fachada.
  }
}
