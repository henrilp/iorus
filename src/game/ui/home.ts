/**
 * L'accueil du jeu : vivre une vie à pied (fiche 0030), ou régler un village et le regarder (fiche 0019).
 */
import { tr } from '../../i18n';
import { GAME_PARAMS, type Composition } from '../../sim';
import type { LifeSettings } from '../core/walk';
import { el } from './dom';

type Village = 'mix' | 'free';

/** Les deux villages proposés, les mêmes que dans le prototype en texte. */
const VILLAGES: Record<Village, Composition> = {
  mix: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  free: { mode: 'twoGroups', shareA: 0.15, groupA: { disposition: 0, influence: 0 }, groupB: { disposition: 0.6, influence: 0.7 } },
};

export interface LifeChoice {
  seed: number;
  village: Village;
  settings(): LifeSettings;
}

export function defaultLife(): LifeChoice {
  return {
    seed: Math.floor(Math.random() * 1_000_000),
    village: 'mix',
    settings() {
      return { seed: this.seed, size: 30, composition: VILLAGES[this.village], params: { ...GAME_PARAMS } };
    },
  };
}

export function renderHome(root: HTMLElement, life: LifeChoice, onLife: (c: LifeChoice) => void, onWatch: () => void): void {
  const village = el(
    'select',
    { name: 'village' },
    el('option', { value: 'mix', selected: life.village === 'mix' }, tr('home.village.mix')),
    el('option', { value: 'free', selected: life.village === 'free' }, tr('home.village.free')),
  );
  village.addEventListener('change', () => (life.village = village.value as Village));
  const seed = el('input', { type: 'number', name: 'seed', min: 0, step: 1, value: life.seed });
  seed.addEventListener('change', () => (life.seed = Math.max(0, Math.floor(Number(seed.value) || 0))));
  const start = el('button', { type: 'button', class: 'primary' }, tr('home.life.start'));
  start.addEventListener('click', () => onLife(life));
  const watch = el('button', { type: 'button' }, tr('home.watch.start'));
  watch.addEventListener('click', onWatch);

  root.replaceChildren(
    el(
      'div',
      { class: 'home' },
      el('h2', {}, tr('home.heading')),
      el('p', { class: 'lead' }, tr('home.lead')),
      el(
        'article',
        { class: 'home-card main' },
        el('h3', {}, tr('home.life.title')),
        el('p', {}, tr('home.life.text')),
        el('div', { class: 'field' }, el('label', {}, tr('home.village')), village),
        el('div', { class: 'field' }, el('label', {}, tr('home.seed')), seed),
        start,
      ),
      el('article', { class: 'home-card' }, el('h3', {}, tr('home.watch.title')), el('p', {}, tr('home.watch.text')), watch),
    ),
  );
}
