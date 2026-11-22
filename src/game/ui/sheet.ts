/**
 * Fiche d'un villageois : ce qu'on peut savoir en le regardant vivre.
 * Ses traits (disposition, influençabilité) ne sont pas affichés (spec v1).
 */
import { isAdult } from '../../sim';
import { formatNumber, tr } from '../../i18n';
import type { GameSession } from '../core/session';
import { el } from './dom';

export function renderSheet(root: HTMLElement, session: GameSession, id: number | null, onClose: () => void): void {
  root.hidden = id === null;
  if (id === null) return;
  const state = session.sim.state;
  const v = state.villagers.find((x) => x.id === id);

  const close = el('button', { type: 'button', class: 'close', 'aria-label': tr('sheet.close') }, '×');
  close.addEventListener('click', onClose);
  const header = el('header', {}, el('h3', {}, tr('sheet.title', { id })), close);

  if (!v) {
    root.replaceChildren(header, el('p', {}, tr('sheet.dead')));
    return;
  }

  const age = Math.floor(v.ageSeasons / state.params.seasonsPerYear);
  const parentAlive = v.parentId !== null && state.villagers.some((x) => x.id === v.parentId);
  const facts = el(
    'ul',
    {},
    el('li', {}, tr('sheet.age', { age })),
    el('li', {}, tr('sheet.wealth', { wealth: formatNumber(v.wealth, 0) })),
    el('li', {}, v.parentId === null ? tr('sheet.parentUnknown') : tr('sheet.parent', { id: v.parentId }) + (parentAlive ? '' : ' †')),
  );

  const recent = session.recentSeasons(v.id);
  const seasonLabel = (season: number) =>
    `${tr(`season.${(season - 1) % 4}` as 'season.0')} ${tr('hud.year', { year: Math.floor((season - 1) / state.params.seasonsPerYear) + 1 })}`;
  const table = recent.length
    ? el(
        'table',
        {},
        el(
          'thead',
          {},
          el(
            'tr',
            {},
            ...(['season', 'harvest', 'given', 'received', 'caught', 'sanctioned'] as const).map((c) => el('th', {}, tr(`sheet.col.${c}`))),
          ),
        ),
        el(
          'tbody',
          {},
          ...[...recent].reverse().map((r) =>
            el(
              'tr',
              {},
              el('td', {}, seasonLabel(r.season)),
              el('td', {}, formatNumber(r.harvest)),
              el('td', {}, formatNumber(r.contributed)),
              el('td', {}, formatNumber(r.received)),
              el('td', {}, formatNumber(r.caught)),
              el('td', {}, String(r.sanctionsReceived + r.pondSanctionsReceived)),
            ),
          ),
        ),
      )
    : el('p', { class: 'help' }, tr('sheet.none'));

  root.replaceChildren(header, facts);
  if (!isAdult(v, state.params)) root.append(el('p', { class: 'help' }, tr('sheet.child')));
  root.append(el('h4', {}, tr('sheet.recent')), table);
}
