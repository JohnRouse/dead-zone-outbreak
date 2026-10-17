import type { Enemy, Point } from '../core/reference';
export type ReferenceScenario = 'district' | 'contact-walker' | 'contact-brute' | 'navigation' | 'cadence' | 'door';
export const SCENARIOS: Record<ReferenceScenario, { player: Point; spawns: boolean; enemies: (Point & { kind: Enemy['kind']; hp?: number })[] }> = {
  district: { player: { x: 1400, y: 1070 }, spawns: true, enemies: [
    { kind: 'walker', x: 1660, y: 1030 }, { kind: 'brute', x: 1680, y: 1200 },
    { kind: 'walker', x: 1220, y: 1260 }, { kind: 'walker', x: 1530, y: 730 }, { kind: 'brute', x: 1960, y: 1320 },
  ] },
  'contact-walker': { player: { x: 1400, y: 1070 }, spawns: false, enemies: [{ kind: 'walker', x: 1400, y: 890 }] },
  'contact-brute': { player: { x: 1400, y: 1070 }, spawns: false, enemies: [{ kind: 'brute', x: 1400, y: 890 }] },
  navigation: { player: { x: 1100, y: 1240 }, spawns: false, enemies: [{ kind: 'walker', x: 1100, y: 900 }] },
  cadence: { player: { x: 1400, y: 1070 }, spawns: false, enemies: [{ kind: 'brute', x: 1660, y: 1070, hp: 10000 }] },
  door: { player: { x: 1400, y: 1070 }, spawns: false, enemies: [] },
};
export function isReferenceScenario(value: string): value is ReferenceScenario { return Object.hasOwn(SCENARIOS, value); }
