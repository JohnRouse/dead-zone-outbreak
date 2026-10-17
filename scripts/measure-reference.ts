import { mkdirSync, writeFileSync } from 'node:fs';
import { ReferenceSimulation } from '../src/simulation/reference';
import { normalized } from '../src/simulation/geometry';
import type { InputCommand } from '../src/core/reference';
import { ENEMY_TYPES, PERSONAL_WEAPON, SPAWN_RULES } from '../src/content/reference-district';
const directory = 'test-results/reference-iteration-2';
mkdirSync(directory, { recursive: true });
const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010];
const policies = ['idle-auto', 'idle-manual-away', 'moving-manual'] as const;
const runs = [];
for (const policy of policies) for (const seed of seeds) {
  const sim = new ReferenceSimulation(seed);
  const waypoints = [{ x: 1410, y: 930 }, { x: 1630, y: 1020 }, { x: 1560, y: 1270 }, { x: 1220, y: 1180 }];
  let waypoint = 0;
  const samples = [];
  for (let tick = 0; tick < 3600 && sim.state.phase === 'playing'; tick++) {
    const p = sim.state.player;
    if (Math.hypot(p.x - waypoints[waypoint].x, p.y - waypoints[waypoint].y) < 20) waypoint = (waypoint + 1) % waypoints.length;
    const direction = normalized(waypoints[waypoint].x - p.x, waypoints[waypoint].y - p.y);
    const enemies = sim.state.enemies.filter(e => !['dying', 'emerging'].includes(e.phase));
    const nearest = [...enemies].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    const command: InputCommand = { sequence: tick, moveX: policy === 'moving-manual' ? direction.x : 0,
      moveY: policy === 'moving-manual' ? direction.y : 0,
      aim: policy === 'moving-manual' && nearest ? { x: nearest.x, y: nearest.y } : { x: p.x + 1000, y: p.y + 1000 },
      fire: policy !== 'idle-auto', dash: policy === 'moving-manual' && !!nearest && Math.hypot(nearest.x - p.x, nearest.y - p.y) < 150 };
    sim.step(command, 1 / 60, { x: Math.max(0, Math.min(1200, p.x - 800)), y: Math.max(0, Math.min(1200, p.y - 450)), w: 1600, h: 900 });
    if (tick % 600 === 599) samples.push({ time: Number(sim.state.time.toFixed(2)), hp: p.hp, nearby: sim.state.stats.nearby,
      damageReceived: sim.state.stats.damageReceived, kills: sim.state.stats.kills });
  }
  runs.push({ policy, seed, seconds: Number(sim.state.time.toFixed(3)), phase: sim.state.phase, hp: sim.state.player.hp,
    ...sim.state.stats, samples });
}
const summaries = policies.map(policy => {
  const rows = runs.filter(run => run.policy === policy);
  const average = (field: 'seconds' | 'damageReceived' | 'peakNearby' | 'kills') => Number((rows.reduce((sum, row) => sum + row[field], 0) / rows.length).toFixed(2));
  const deaths = rows.filter(row => row.phase === 'dead').length;
  return { policy, seeds: rows.length, deaths, survived60s: rows.length - deaths,
    meanSeconds: average('seconds'), meanDamageReceived: average('damageReceived'), meanPeakNearby: average('peakNearby'), meanKills: average('kills') };
});
writeFileSync(`${directory}/difficulty.json`, JSON.stringify({ rules: 'reference-02', fixedStep: 1 / 60, duration: 60,
  weapon: PERSONAL_WEAPON, enemies: ENEMY_TYPES, spawns: SPAWN_RULES, seeds, summaries, runs }, null, 2));
console.table(summaries);
