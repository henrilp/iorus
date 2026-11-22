import { describe, expect, test } from 'vitest';
import { Simulation } from '../engine';
import type { SimConfig } from '../types';

const config: SimConfig = {
  seed: 7,
  size: 30,
  composition: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  player: { disposition: 0.7, influence: 0.4 },
  params: { sanctionsEnabled: true },
};

describe('moteur', () => {
  test('même graine et mêmes réglages : partie identique', () => {
    const a = new Simulation(config).run(100);
    const b = new Simulation(config).run(100);
    expect(a).toEqual(b);
  });

  test('graine différente : partie différente', () => {
    const a = new Simulation(config).run(100);
    const b = new Simulation({ ...config, seed: 8 }).run(100);
    expect(a).not.toEqual(b);
  });

  test('invariants : réserves positives, étang borné, dispositions et influençabilités dans [0, 1]', () => {
    const sim = new Simulation(config);
    for (let i = 0; i < 400 && !sim.state.extinct; i++) {
      sim.step();
      const s = sim.state;
      expect(s.pondStock).toBeGreaterThanOrEqual(0);
      expect(s.pondStock).toBeLessThanOrEqual(s.pondCapacity);
      for (const v of s.villagers) {
        expect(v.wealth).toBeGreaterThanOrEqual(0);
        for (const trait of [v.disposition, v.influence]) {
          expect(trait).toBeGreaterThanOrEqual(0);
          expect(trait).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('le villageois du joueur existe et sa lignée est suivie', () => {
    const sim = new Simulation(config);
    const player = sim.state.villagers.filter((v) => v.isPlayer);
    expect(player).toHaveLength(1);
    expect(player[0]?.disposition).toBe(0.7);
    expect(player[0]?.influence).toBe(0.4);
    const playerIds = new Set(player.map((v) => v.id));
    let descendants = 0;
    for (let i = 0; i < 30 * 4 && !sim.state.extinct; i++) {
      sim.step();
      for (const v of sim.state.villagers) {
        if (playerIds.has(v.id)) continue;
        // Un descendant du joueur est marqué, et seulement lui.
        expect(v.isPlayer).toBe(v.parentId !== null && playerIds.has(v.parentId));
        if (v.isPlayer) {
          playerIds.add(v.id);
          descendants += 1;
        }
      }
    }
    expect(descendants).toBeGreaterThan(0);
  });

  test('composition en deux groupes', () => {
    const sim = new Simulation({
      seed: 1,
      size: 20,
      composition: {
        mode: 'twoGroups',
        shareA: 0.25,
        groupA: { disposition: 0, influence: 0.1 },
        groupB: { disposition: 1, influence: 0.9 },
      },
    });
    const vs = sim.state.villagers;
    expect(vs.filter((v) => v.disposition === 0 && v.influence === 0.1)).toHaveLength(5);
    expect(vs.filter((v) => v.disposition === 1 && v.influence === 0.9)).toHaveLength(15);
  });
});
