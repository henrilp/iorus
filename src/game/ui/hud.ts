/** Bandeau du village : où en est le temps, quelques niveaux, et les commandes du temps. */
import { formatNumber, tr, type TextKey } from '../../i18n';
import { SKIP_YEARS, SPEEDS, type Speed } from '../core/display';
import type { GameSession } from '../core/session';
import { el } from './dom';

export interface HudActions {
  setSpeed(speed: Speed): void;
  skip(): void;
  newSetup(): void;
}

export interface Hud {
  /** Met à jour les chiffres et l'état des boutons. */
  refresh(): void;
}

export function renderHud(root: HTMLElement, session: GameSession, actions: HudActions): Hud {
  root.replaceChildren();
  const clock = el('strong', { class: 'clock' });
  const stats = el('span', { class: 'stats' });
  const ended = el('p', { class: 'ended', role: 'status', hidden: true });

  const speedButtons = SPEEDS.map((speed) => {
    const button = el('button', { type: 'button', class: 'speed' }, speed === 0 ? tr('hud.pause') : `×${speed}`);
    button.addEventListener('click', () => actions.setSpeed(speed));
    return { speed, button };
  });
  const skip = el('button', { type: 'button' }, tr('hud.skip', { n: SKIP_YEARS }));
  skip.addEventListener('click', () => actions.skip());
  const newSetup = el('button', { type: 'button', class: 'secondary' }, tr('hud.newSetup'));
  newSetup.addEventListener('click', () => actions.newSetup());
  const seed = el('span', { class: 'seed' }, tr('hud.seed', { seed: session.config.seed }));

  root.append(
    el('div', { class: 'hud-row' }, clock, stats),
    el('div', { class: 'hud-row controls', role: 'group' }, ...speedButtons.map((b) => b.button), skip, newSetup, seed),
    ended,
  );

  function refresh(): void {
    const current = session.current;
    const season = session.sim.state.season;
    // Le moteur compte les années à partir de 0 ; le joueur, à partir de 1.
    const year = (current?.metrics.year ?? 0) + 1;
    const seasonName = tr(`season.${season === 0 ? 0 : (season - 1) % 4}` as TextKey);
    clock.textContent = `${tr('hud.year', { year })} · ${seasonName}`;
    const pop = current?.metrics.population ?? session.sim.state.villagers.length;
    const pond = current?.metrics.pond ?? 1;
    const granary = current?.granaryFill ?? 0;
    stats.textContent = [
      tr('hud.population', { n: pop }),
      tr('hud.granary', { pct: formatNumber(granary * 100, 0) }),
      tr('hud.pond', { pct: formatNumber(pond * 100, 0) }),
    ].join(' · ');
    for (const { speed, button } of speedButtons) {
      button.setAttribute('aria-pressed', String(session.speed === speed));
      button.disabled = session.ended !== null;
    }
    skip.disabled = session.ended !== null;
    ended.hidden = session.ended === null;
    if (session.ended) ended.textContent = tr(session.ended === 'extinct' ? 'hud.ended.extinct' : 'hud.ended.duration', { year });
  }

  refresh();
  return { refresh };
}
