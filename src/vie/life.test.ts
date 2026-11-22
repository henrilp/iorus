import { describe, expect, test } from 'vitest';
import { LifeSession, PACING, type LifeSettings } from './life';
import { villagerName } from './names';

const settings: LifeSettings = {
  seed: 42,
  size: 30,
  composition: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  params: { observedNeighbors: 2, sanctionsEnabled: true },
};

/** Joue une vie entière en prenant toujours le choix d'indice `pick` (ou le dernier s'il y en a moins). */
function playLife(s: LifeSettings, pick: number): { session: LifeSession; chapters: number[]; moments: string[] } {
  const session = new LifeSession(s);
  const chapters: number[] = [];
  const moments: string[] = [];
  for (let guard = 0; guard < 5000 && session.phase !== 'over'; guard++) {
    const m = session.moments[0];
    if (m) {
      moments.push(m.id);
      session.resolve(m.choices[Math.min(pick, m.choices.length - 1)]);
      continue;
    }
    const before = session.chapter;
    if (session.phase === 'chapter') session.nextSeason();
    else if (session.phase === 'between') session.isLastChapter ? session.fastForwardToEnd() : session.fastForward();
    else if (session.phase === 'dead') session.epilogue();
    if (session.chapter !== before) chapters.push(Math.floor(session.ageYears));
  }
  return { session, chapters, moments };
}

describe('une vie en texte', () => {
  test('une vie se joue jusqu’au bout, chapitre après chapitre', () => {
    const { session, chapters, moments } = playLife(settings, 0);
    expect(session.phase).toBe('over');
    expect(moments.slice(0, 3)).toEqual(['arrival', 'first-harvest', 'first-fishing']);
    // Les chapitres atteints commencent aux âges prévus.
    for (const age of chapters) expect(PACING.chapterAges).toContain(age);
    expect(session.log.some((e) => e.kind === 'death')).toBe(true);
    expect(session.log.filter((e) => e.kind === 'epilogue').length).toBeGreaterThan(0);
  });

  test('mêmes réglages et mêmes choix : même vie', () => {
    const a = playLife(settings, 1).session.log;
    const b = playLife(settings, 1).session.log;
    expect(b).toEqual(a);
  });

  test('le journal du moteur suffit à rejouer la vie', () => {
    const { session } = playLife(settings, 2);
    expect(session.sim.state.journal.length).toBeGreaterThan(0);
  });

  test('des choix différents donnent des vies différentes', () => {
    const a = playLife(settings, 0).session.log.map((e) => e.text);
    const b = playLife(settings, 3).session.log.map((e) => e.text);
    expect(b).not.toEqual(a);
  });

  test('une sécheresse arrête le temps et demande un choix', () => {
    const { moments, session } = playLife({ ...settings, params: { ...settings.params, droughtProbability: 0.3 } }, 3);
    expect(moments).toContain('drought');
    expect(session.log.some((e) => e.text.includes('Sécheresse'))).toBe(true);
  });

  test('des nouveaux venus sont racontés', () => {
    const { session } = playLife({ ...settings, params: { ...settings.params, arrivalProbability: 0.3 } }, 1);
    expect(session.log.some((e) => e.text.includes('venues d’ailleurs'))).toBe(true);
  });

  test('les noms sont stables et distincts', () => {
    const names = new Set(Array.from({ length: 1728 }, (_, i) => villagerName(i)));
    expect(names.size).toBe(1728);
    // Des identifiants qui se suivent ne partagent pas la même fin de nom.
    const endings = new Set([100, 101, 102, 103, 104].map((i) => villagerName(i).slice(-2)));
    expect(endings.size).toBeGreaterThan(1);
    expect(villagerName(5)).toBe(villagerName(5));
  });
});
