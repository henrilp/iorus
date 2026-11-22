import { describe, expect, it } from 'vitest';
import { GAME_PARAMS, replay } from '../../sim';
import { buildVillageMap, blocked, doorPoint, housePoint, moveBody, placeAt } from './villageMap';
import { LIFE_PACING, WalkSession, type LifeSettings } from './walk';
import { walkPose } from './walkChoreo';

const SETTINGS: LifeSettings = {
  seed: 11,
  size: 30,
  composition: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  params: { ...GAME_PARAMS, sanctionsEnabled: true },
};

/** Ferme les cartes en prenant toujours le dernier choix proposé (« continuer »). */
function closeCards(s: WalkSession): void {
  while (s.cards.length > 0) {
    const card = s.cards[0]!;
    s.resolve(card.choices.at(-1));
  }
}

/** Joue une saison à pied, en un seul pas de temps. */
function playSeason(s: WalkSession): void {
  closeCards(s);
  s.tick(LIFE_PACING.seasonMs);
}

describe('le plan du village à pied', () => {
  it('les maisons suivent l’anneau du moteur : deux emplacements qui se suivent sont proches', () => {
    const map = buildVillageMap(30);
    for (let h = 1; h < 30; h++) {
      const d = Math.hypot(housePoint(map, h).x - housePoint(map, h - 1).x, housePoint(map, h).y - housePoint(map, h - 1).y);
      expect(d).toBeLessThan(200);
    }
  });

  it('on ne traverse ni le grenier ni les maisons, mais on glisse le long', () => {
    const map = buildVillageMap(30);
    expect(blocked(map, map.center)).toBe(true);
    expect(blocked(map, housePoint(map, 3))).toBe(true);
    const door = doorPoint(map, 3);
    expect(blocked(map, door)).toBe(false);
    const moved = moveBody(map, door, 4, 0);
    expect(blocked(map, moved)).toBe(false);
  });

  it('les lieux des gestes sont reconnus', () => {
    const map = buildVillageMap(30);
    expect(placeAt(map, { x: map.center.x, y: map.granary.y - 20 }, 0)).toBe('granary');
    expect(placeAt(map, { x: map.pond.x - map.pond.rx - 20, y: map.pond.y }, 0)).toBe('pond');
    expect(placeAt(map, doorPoint(map, 5), 5)).toBe('home');
  });

  it('les villageois partent de chez eux et y reviennent', () => {
    const map = buildVillageMap(30);
    const start = walkPose(map, 4, 17, true, 0);
    const end = walkPose(map, 4, 17, true, 1);
    expect(Math.hypot(start.x - end.x, start.y - end.y)).toBeLessThan(1);
    const field = walkPose(map, 4, 17, true, 0.25);
    expect(placeAt(map, field, 4)).toBe('field');
  });
});

describe('une vie à pied', () => {
  it('commence à 15 ans chez un parent, avec une carte d’ouverture', () => {
    const s = new WalkSession(SETTINGS);
    expect(s.ageYears).toBe(15);
    expect(s.parentId).not.toBeNull();
    expect(s.cards[0]?.id).toBe('opening');
    expect(s.sacks).toBe(0);
    expect(s.canGive()).toBe(false);
  });

  it('le temps ne passe pas tant qu’une carte est ouverte', () => {
    const s = new WalkSession(SETTINGS);
    expect(s.tick(LIFE_PACING.seasonMs)).toBe(false);
    expect(s.sim.state.season).toBe(0);
  });

  it('la prévision de la saison est exacte, quoi que décide le joueur', () => {
    const s = new WalkSession(SETTINGS);
    closeCards(s);
    // Jusqu'à l'âge adulte.
    while (!s.playerAdult) playSeason(s);
    const choices = [0, 3, 10, 6];
    for (const n of choices) {
      closeCards(s);
      const forecast = new Map([...s.sim.state.villagers].map((v) => [v.id, s.forecastOf(v.id)]));
      s.give(n);
      s.fish(n % (LIFE_PACING.maxCasts + 1));
      s.tick(LIFE_PACING.seasonMs);
      for (const v of s.sim.state.villagers) {
        const f = forecast.get(v.id);
        if (!f) continue;
        expect(v.last.harvest).toBeCloseTo(f.harvest, 10);
        if (v.id !== s.playerId) expect(v.last.share).toBeCloseTo(f.share, 10);
      }
    }
  });

  it('les sacs portés au grenier fixent la part versée, qui devient la ligne de conduite', () => {
    const s = new WalkSession(SETTINGS);
    closeCards(s);
    while (!s.playerAdult) playSeason(s);
    closeCards(s);
    const sacks = s.sacks;
    expect(sacks).toBeGreaterThan(0);
    s.give(Math.round(sacks / 2));
    expect(s.canGive()).toBe(false);
    s.fish(1);
    s.tick(LIFE_PACING.seasonMs);
    const me = s.player!;
    expect(me.last.share).toBeCloseTo(Math.round(sacks / 2) / sacks, 10);
    expect(me.last.effort).toBeCloseTo(1 / LIFE_PACING.maxCasts, 10);
    expect(s.conduct?.share).toBeCloseTo(Math.round(sacks / 2) / sacks, 10);
  });

  it('dormir termine la saison', () => {
    const s = new WalkSession(SETTINGS);
    closeCards(s);
    s.sleep();
    expect(s.sim.state.season).toBe(1);
    expect(s.summary?.lines.length).toBeGreaterThan(0);
  });

  it('le premier chapitre finit après la première année adulte, puis le temps file jusqu’à 25 ans', () => {
    const s = new WalkSession(SETTINGS);
    let guard = 0;
    while (s.phase === 'chapter' && guard++ < 20) playSeason(s);
    expect(s.player!.ageSeasons).toBe((SETTINGS.params.adultAge ?? 16) * 4 + 4);
    expect(s.phase).toBe('between');
    guard = 0;
    while (s.phase === 'between' && guard++ < 50) closeCards(s);
    if (s.phase === 'chapter') {
      expect(s.chapter).toBe(1);
      expect(s.ageYears).toBe(25);
    } else {
      expect(['dead', 'over']).toContain(s.phase);
    }
  });

  it('changer de ligne de conduite en fin de chapitre ne laisse pas filer le temps avant', () => {
    const s = new WalkSession(SETTINGS);
    let guard = 0;
    while (s.phase === 'chapter' && guard++ < 20) playSeason(s);
    const season = s.sim.state.season;
    const card = s.cards[0]!;
    s.resolve(card.choices.find((c) => c.id === 'conduct'));
    expect(s.sim.state.season).toBe(season);
    s.setConduct({ share: 0.9 });
    s.fastForward();
    expect(s.sim.state.season).toBeGreaterThan(season);
    expect(s.sim.state.journal.some((j) => j.season === season && j.action.kind === 'conduct')).toBe(true);
  });

  it('une vie jouée se rejoue exactement à partir du journal', () => {
    const s = new WalkSession(SETTINGS);
    let guard = 0;
    while (s.phase === 'chapter' && guard++ < 20) {
      closeCards(s);
      s.give(2);
      s.fish(3);
      s.tick(LIFE_PACING.seasonMs);
    }
    const again = replay(s.config, s.sim.state.journal, s.sim.state.season);
    expect(again.state).toEqual(s.sim.state);
  });

  it('une vie va jusqu’à la mort et à la chronique de l’après', () => {
    const s = new WalkSession({ ...SETTINGS, seed: 3 });
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 400) {
      if (s.cards.length > 0) {
        const card = s.cards[0]!;
        s.resolve(card.choices.find((c) => c.id === 'epilogue') ?? card.choices.at(-1));
      } else s.tick(LIFE_PACING.seasonMs);
    }
    expect(s.phase).toBe('over');
    expect(s.cards[0]?.id).toBe('epilogue');
  });
});
