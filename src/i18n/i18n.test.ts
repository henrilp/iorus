import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './index';

describe('textes du jeu', () => {
  it('le français et l’anglais ont exactement les mêmes clés', () => {
    expect(Object.keys(DICTIONARIES.en).sort()).toEqual(Object.keys(DICTIONARIES.fr).sort());
  });

  it('chaque texte utilise les mêmes variables dans les deux langues', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(DICTIONARIES.fr) as (keyof typeof DICTIONARIES.fr)[]) {
      expect(vars(DICTIONARIES.en[key]), key).toEqual(vars(DICTIONARIES.fr[key]));
    }
  });

  it('aucun texte n’est vide', () => {
    for (const dict of Object.values(DICTIONARIES)) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('');
    }
  });
});
