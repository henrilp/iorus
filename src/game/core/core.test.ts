import { describe, expect, it } from 'vitest';
import { isAdult, Simulation, type SimConfig } from '../../sim';
import { positionAt } from './choreography';
import { SEASON_MS, SKIP_YEARS } from './display';
import { HOUSE_SLOTS, Houses } from './layout';
import { GameSession } from './session';

const CONFIG: SimConfig = {
  seed: 7,
  size: 30,
  composition: {
    mode: 'twoGroups',
    shareA: 0.15,
    groupA: { disposition: 0, influence: 0 },
    groupB: { disposition: 0.6, influence: 0.7 },
  },
};

/** Fait tourner une session à la vitesse donnée, image par image, jusqu'à la saison voulue. */
function playUntil(session: GameSession, season: number, frameMs = 16): void {
  while (session.sim.state.season < season && !session.ended) session.tick(frameMs);
}

describe('le temps du jeu', () => {
  it('passer 10 ans donne exactement le même état que laisser tourner à ×32', () => {
    const skipped = new GameSession(CONFIG, null);
    skipped.skipYears(SKIP_YEARS);

    const played = new GameSession(CONFIG, null);
    played.speed = 32;
    playUntil(played, SKIP_YEARS * 4);

    const reference = new Simulation(CONFIG);
    reference.runYears(SKIP_YEARS);

    expect(skipped.sim.state).toEqual(reference.state);
    expect(played.sim.state).toEqual(reference.state);
  });

  it('changer de vitesse en cours de partie ne change pas la partie', () => {
    const varied = new GameSession(CONFIG, null);
    const speeds = [1, 4, 0, 32, 1] as const;
    let i = 0;
    while (varied.sim.state.season < 20) {
      varied.speed = speeds[i++ % speeds.length]!;
      varied.tick(SEASON_MS * 0.7);
    }
    const reference = new Simulation(CONFIG);
    reference.run(varied.sim.state.season);
    expect(varied.sim.state).toEqual(reference.state);
  });

  it('en pause, aucune saison n’est calculée', () => {
    const session = new GameSession(CONFIG, null);
    session.speed = 0;
    expect(session.tick(10_000)).toEqual([]);
    expect(session.sim.state.season).toBe(0);
  });

  it('la première saison commence dès qu’on lance le temps', () => {
    const session = new GameSession(CONFIG, null);
    const records = session.tick(16);
    expect(records).toHaveLength(1);
    expect(session.current?.metrics.season).toBe(1);
    expect(session.progress).toBeGreaterThan(0);
    expect(session.progress).toBeLessThan(0.01);
  });

  it('une longue absence ne calcule qu’un nombre borné de saisons par image', () => {
    const session = new GameSession(CONFIG, null);
    session.speed = 32;
    session.tick(16);
    expect(session.tick(60_000).length).toBeLessThanOrEqual(8);
  });

  it('la partie s’arrête à la durée choisie, même en passant des années', () => {
    const session = new GameSession(CONFIG, 5);
    session.skipYears(SKIP_YEARS);
    expect(session.sim.state.season).toBe(5 * 4);
    expect(session.ended).toBe('duration');
    expect(session.skipYears(SKIP_YEARS)).toEqual([]);
  });

  it('la partie s’arrête quand le village s’éteint', () => {
    // Personne ne mange à sa faim : le village meurt vite.
    const session = new GameSession({ ...CONFIG, params: { baseHarvest: 1 } }, null);
    session.skipYears(50);
    expect(session.sim.state.extinct).toBe(true);
    expect(session.ended).toBe('extinct');
  });

  it('naissances et morts de la saison sont repérées', () => {
    const session = new GameSession(CONFIG, null);
    const records = session.skipYears(30);
    const born = records.reduce((n, r) => n + r.born.length, 0);
    const died = records.reduce((n, r) => n + r.died.length, 0);
    expect(born).toBe(records.reduce((n, r) => n + r.metrics.births, 0));
    expect(died).toBe(records.reduce((n, r) => n + r.metrics.deaths, 0));
  });
});

describe('le plan du village', () => {
  it('il y a assez d’emplacements de maisons pour bien plus que la population maximale observée', () => {
    expect(HOUSE_SLOTS.length).toBeGreaterThan(300);
  });

  it('chaque maison a au plus un occupant, et les maisons des morts restent vides', () => {
    const sim = new Simulation(CONFIG);
    const houses = new Houses();
    const adult = (v: Parameters<typeof isAdult>[0]) => isAdult(v, sim.state.params);
    let sawEmpty = false;
    for (let s = 0; s < 400; s++) {
      sim.step();
      houses.update(sim.state.villagers, adult);
      const owners = houses.owners.filter((o) => o !== null);
      expect(new Set(owners).size).toBe(owners.length);
      const alive = new Set(sim.state.villagers.map((v) => v.id));
      for (const o of owners) expect(alive.has(o!)).toBe(true);
      for (const v of sim.state.villagers) if (adult(v)) expect(owners).toContain(v.id);
      if (houses.owners.includes(null)) sawEmpty = true;
    }
    expect(sawEmpty).toBe(true);
  });

  it('un enfant reste à la maison toute la saison', () => {
    const home = { x: 100, y: 100 };
    const start = positionAt(home, 3, false, 0, true);
    expect(positionAt(home, 3, false, 0.5, true)).toEqual(start);
  });

  it('un adulte part de chez lui et y revient', () => {
    const home = { x: 100, y: 100 };
    expect(positionAt(home, 3, true, 0, true)).toEqual(positionAt(home, 3, true, 1, true));
    expect(positionAt(home, 3, true, 0.25, true)).not.toEqual(positionAt(home, 3, true, 0, true));
  });
});

describe('séparation du rendu', () => {
  it('la logique du jeu n’importe ni Phaser ni le DOM', () => {
    const sources = import.meta.glob<string>(['./*.ts', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true });
    expect(Object.keys(sources).length).toBeGreaterThan(3);
    for (const [file, source] of Object.entries(sources)) {
      expect(source, file).not.toMatch(/from ['"]phaser['"]|\bdocument\.|\bwindow\./);
    }
  });
});
