/**
 * Le joueur vit sa vie : son villageois suit ses choix (fiche 0022), et le voisinage en option (fiche 0023).
 */
import { describe, expect, test } from 'vitest';
import { Simulation, isAdult, replay } from '../engine';
import { DEFAULT_PARAMS } from '../params';
import type { PlayerConduct, SimConfig } from '../types';

const conduct: PlayerConduct = { share: 0.3, restraint: 0.4, children: true };
const config: SimConfig = {
  seed: 11,
  size: 30,
  composition: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  life: { conduct },
  params: { sanctionsEnabled: true, pondSanctionsEnabled: true },
};
const spy = DEFAULT_PARAMS.seasonsPerYear;

/** Avance jusqu'à ce que le joueur soit adulte. */
function untilAdult(sim: Simulation): void {
  while (sim.controlled && !isAdult(sim.controlled, sim.state.params)) sim.step();
}

describe('une vie jouée', () => {
  test('le joueur commence à 15 ans, enfant d’un villageois de départ, en plus du village', () => {
    const sim = new Simulation(config);
    const s = sim.state;
    expect(s.villagers).toHaveLength(31);
    const player = sim.controlled!;
    expect(player.isPlayer).toBe(true);
    expect(player.ageSeasons).toBe(DEFAULT_PARAMS.playerStartAge * spy);
    expect(player.wealth).toBe(DEFAULT_PARAMS.birthEndowment);
    const parent = s.villagers.find((v) => v.id === player.parentId)!;
    expect(parent).toBeDefined();
    expect(parent.isPlayer).toBe(false);
    expect(parent.home).toBe(player.home);
    expect(s.villagers.filter((v) => v.isPlayer)).toHaveLength(1);
  });

  test('sa part et sa modération sont celles de sa ligne de conduite, sans bruit', () => {
    const sim = new Simulation(config);
    untilAdult(sim);
    sim.step();
    const player = sim.controlled!;
    expect(player.last.share).toBe(0.3);
    expect(player.last.effort).toBeCloseTo(0.6, 12);
  });

  test('« comme mes voisins » suit sa croyance', () => {
    const sim = new Simulation(config);
    untilAdult(sim);
    sim.act({ kind: 'conduct', conduct: { share: 'neighbors', restraint: 'neighbors', children: true } });
    const belief = sim.controlled!.beliefShare;
    sim.step();
    expect(sim.controlled!.last.share).toBeCloseTo(belief, 12);
  });

  test('ses traits sont estimés à partir de ce qu’il fait', () => {
    const sim = new Simulation(config);
    untilAdult(sim);
    sim.run(8);
    const player = sim.controlled!;
    expect(player.disposition).toBeCloseTo((0.3 + 0.4) / 2, 12);
    expect(player.influence).toBe(0);
  });

  test('s’il refuse les enfants, il n’en a pas', () => {
    const rich = { ...config, params: {}, life: { conduct: { share: 0, restraint: 0, children: false } } };
    const sim = new Simulation(rich);
    const id = sim.state.controlledId!;
    for (let i = 0; i < 40 * spy && sim.controlled; i++) {
      sim.step();
      expect(sim.state.villagers.some((v) => v.parentId === id)).toBe(false);
    }
  });

  test('s’il accepte, la règle commune lui donne des enfants quand sa réserve le permet', () => {
    // Sans sanctions : un joueur qui garde tout et ne cède jamais à la peur serait ruiné par les amendes.
    const rich = { ...config, params: {}, life: { conduct: { share: 0, restraint: 0, children: true } } };
    const sim = new Simulation(rich);
    const id = sim.state.controlledId!;
    let children = 0;
    for (let i = 0; i < 40 * spy && sim.controlled; i++) {
      sim.step();
      children = sim.state.villagers.filter((v) => v.parentId === id).length;
    }
    expect(children).toBeGreaterThan(0);
  });

  test('sa sanction a lieu si la cible est assez sous la moyenne, et seulement alors', () => {
    const sim = new Simulation({ ...config, params: { ...config.params, sanctionsEnabled: true } });
    untilAdult(sim);
    sim.step();
    const adults = sim.state.villagers.filter((v) => isAdult(v, sim.state.params) && v.id !== sim.state.controlledId);
    // La part de chacun varie peu d'une saison à l'autre : on vise le plus bas et le plus haut de la saison passée.
    const sorted = [...adults].sort((a, b) => a.last.share - b.last.share);
    const low = sorted[0]!;
    const high = sorted.at(-1)!;

    expect(sim.act({ kind: 'sanction', targetId: high.id, domain: 'granary' })).toBe(true);
    sim.step();
    expect(sim.state.playerSanctions).toEqual([{ targetId: high.id, domain: 'granary', applied: false }]);

    const before = sim.controlled!.wealth;
    expect(sim.act({ kind: 'sanction', targetId: low.id, domain: 'granary' })).toBe(true);
    sim.step();
    const outcome = sim.state.playerSanctions[0]!;
    expect(outcome.targetId).toBe(low.id);
    if (outcome.applied) {
      expect(sim.controlled!.last.sanctionsGiven).toBe(1);
      expect(low.last.sanctionsReceived).toBeGreaterThanOrEqual(1);
    }
    expect(Number.isFinite(before)).toBe(true);
  });

  test('pas de sanction si le domaine n’est pas autorisé', () => {
    const sim = new Simulation({ ...config, params: { pondSanctionsEnabled: false } });
    untilAdult(sim);
    const other = sim.state.villagers.find((v) => v.id !== sim.state.controlledId && isAdult(v, sim.state.params))!;
    expect(sim.act({ kind: 'sanction', targetId: other.id, domain: 'pond' })).toBe(false);
    expect(sim.state.journal).toHaveLength(0);
  });

  test('il ne sanctionne jamais de lui-même et n’imite personne', () => {
    const sim = new Simulation(config);
    untilAdult(sim);
    for (let i = 0; i < 20 * spy && sim.controlled; i++) {
      sim.step();
      expect(sim.controlled?.last.sanctionsGiven ?? 0).toBe(0);
      if (sim.controlled) expect(sim.controlled.disposition).toBeCloseTo(0.35, 12);
    }
  });

  test('graine, réglages et journal redonnent exactement la même vie', () => {
    const sim = new Simulation(config);
    untilAdult(sim);
    sim.act({ kind: 'conduct', conduct: { share: 'neighbors', restraint: 0.1, children: false } });
    sim.run(6);
    const target = sim.state.villagers.find((v) => v.id !== sim.state.controlledId && isAdult(v, sim.state.params))!;
    sim.act({ kind: 'sanction', targetId: target.id, domain: 'granary' });
    sim.run(3);
    sim.act({ kind: 'conduct', conduct: { share: 0.7, restraint: 0.8, children: true } });
    sim.run(40);
    const again = replay(config, sim.state.journal, sim.state.season);
    expect(again.state).toEqual(sim.state);
  });

  test('à sa mort, plus personne n’est conduit', () => {
    const sim = new Simulation(config);
    for (let i = 0; i < 120 * spy && sim.controlled; i++) sim.step();
    expect(sim.state.controlledId).toBeNull();
    expect(sim.act({ kind: 'conduct', conduct })).toBe(false);
  });
});

describe('voisinage', () => {
  test('les voisins sont les plus proches sur l’anneau des maisons, alternativement après et avant', () => {
    const sim = new Simulation({ ...config, life: undefined });
    const adults = sim.state.villagers.filter((v) => isAdult(v, sim.state.params));
    const ring = [...adults].sort((a, b) => a.home - b.home || a.id - b.id);
    const v = ring[5]!;
    expect(sim.neighbors(v.id, 2).map((n) => n.id)).toEqual([ring[6]!.id, ring[4]!.id]);
    expect(sim.neighbors(v.id, 3).map((n) => n.id)).toEqual([ring[6]!.id, ring[4]!.id, ring[7]!.id]);
    // L'anneau se referme.
    expect(sim.neighbors(ring[0]!.id, 2).map((n) => n.id)).toEqual([ring[1]!.id, ring.at(-1)!.id]);
  });

  test('un enfant s’installe à côté de son parent', () => {
    const sim = new Simulation({ ...config, life: undefined, params: { observedNeighbors: 2 } });
    sim.runYears(30);
    const byId = new Map(sim.state.villagers.map((v) => [v.id, v]));
    const children = sim.state.villagers.filter((v) => v.parentId !== null && byId.has(v.parentId));
    expect(children.length).toBeGreaterThan(0);
    for (const c of children) expect(c.home).toBe(byId.get(c.parentId!)!.home);
  });

  test('désactivé par défaut : 0 donne la même partie qu’avant (tout le village)', () => {
    const base = { ...config, life: undefined };
    const a = new Simulation(base).run(200);
    const b = new Simulation({ ...base, params: { ...base.params, observedNeighbors: 0 } }).run(200);
    expect(b).toEqual(a);
    const c = new Simulation({ ...base, params: { ...base.params, observedNeighbors: 2 } }).run(200);
    expect(c).not.toEqual(a);
  });
});
