/**
 * L'interface d'une vie à pied (fiche 0030), en HTML par-dessus le village : le bandeau, l'invite du moment,
 * les gestes au grenier et à l'étang, les paroles des villageois, les cartes et la ligne de conduite.
 *
 * Tant qu'un panneau ou une carte est ouvert, le joueur ne bouge plus et le temps ne passe pas.
 */
import { formatNumber, tr, type TextKey } from '../../i18n';
import { isAdult, type PlayerConduct } from '../../sim';
import { villagerName } from '../../vie/names';
import { LIFE_PACING, type Card, type CardChoice, type Line, type WalkSession } from '../core/walk';
import { hasGiven } from '../core/walkChoreo';
import type { WalkContext } from '../scenes/WalkScene';
import { el } from './dom';

export interface LifeHooks {
  /** Animation : le joueur dépose n sacs au grenier. */
  give(n: number): void;
  /** Animation : un lancer à l'étang. */
  cast(): void;
  /** Le joueur marche vers ce villageois. */
  walkTo(id: number): void;
  distanceTo(id: number): number;
  replay(): void;
  newLife(): void;
}

type Panel = 'talk' | 'granary' | 'pond' | 'conduct' | 'neighbors' | 'help' | 'sleep';

/** Les mots de la ligne de conduite et la valeur que reçoit le moteur, affichée à côté (fiche 0022). */
const SHARE_STANCES: { key: TextKey; value: number | 'neighbors' }[] = [
  { key: 'life.stance.share.little', value: 0.1 },
  { key: 'life.stance.share.some', value: 0.3 },
  { key: 'life.stance.neighbors', value: 'neighbors' },
  { key: 'life.stance.share.half', value: 0.5 },
  { key: 'life.stance.share.much', value: 0.7 },
];
const RESTRAINT_STANCES: { key: TextKey; value: number | 'neighbors' }[] = [
  { key: 'life.stance.fish.max', value: 0 },
  { key: 'life.stance.fish.some', value: 0.4 },
  { key: 'life.stance.neighbors', value: 'neighbors' },
  { key: 'life.stance.fish.little', value: 0.8 },
  { key: 'life.stance.fish.none', value: 1 },
];

export const line = (l: Line): string => tr(l.key, formatVars(l.vars));

function formatVars(vars: Line['vars'] = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) out[k] = typeof v === 'number' && !Number.isInteger(v) ? formatNumber(v) : v;
  return out;
}

export class LifeUI {
  private readonly session: WalkSession;
  private readonly hooks: LifeHooks;
  private readonly bar = el('div', { class: 'life-bar' });
  /** L'invite du moment ; on peut aussi la toucher ou la cliquer à la place de la touche E. */
  private readonly prompt = el('button', { type: 'button', class: 'life-prompt' });
  private readonly panelBox = el('section', { class: 'life-panel', hidden: true });
  private readonly cardBox = el('div', { class: 'life-card-wrap', hidden: true });
  private readonly toast = el('div', { class: 'life-toast', hidden: true, role: 'status' });
  private panel: Panel | null = null;
  private context: WalkContext = { place: null, near: null };
  private talking: number | null = null;
  private pending = 0;
  private cardShown: Card | null = null;
  private toastTimer = 0;
  private firstHarvestShown = false;
  private firstFishShown = false;
  private readonly onKey = (e: KeyboardEvent) => this.key(e);

  constructor(root: HTMLElement, session: WalkSession, hooks: LifeHooks) {
    this.session = session;
    this.hooks = hooks;
    root.replaceChildren(this.bar, this.prompt, this.panelBox, this.toast, this.cardBox);
    this.toast.addEventListener('click', () => (this.toast.hidden = true));
    this.prompt.addEventListener('click', () => this.interact());
    document.addEventListener('keydown', this.onKey);
    this.refresh();
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKey);
    window.clearTimeout(this.toastTimer);
  }

  busy(): boolean {
    return this.panel !== null || this.session.cards.length > 0;
  }

  // --- Ce que la scène dit à l'interface ---

  setContext(ctx: WalkContext): void {
    this.context = ctx;
    this.renderPrompt();
  }

  interact(): void {
    const s = this.session;
    if (this.busy()) return;
    const { place, near } = this.context;
    // Au grenier et à l'étang, il y a foule : le geste passe avant la conversation (un clic sur quelqu'un pour lui parler).
    if (place === 'granary' && s.canGive()) this.openGranary();
    else if (place === 'pond' && s.canFish()) this.openPond();
    else if (near !== null) this.openTalk(near);
    else if (place === 'home') this.open('sleep');
  }

  pick(id: number): void {
    if (this.hooks.distanceTo(id) < 40) this.openTalk(id);
    else this.hooks.walkTo(id);
  }

  /** Une saison vient de se terminer : bilan, cartes. */
  seasonEnded(): void {
    const sum = this.session.summary;
    if (sum && this.session.phase === 'chapter') this.showToast(sum.lines.map(line));
    this.refresh();
  }

  refresh(): void {
    this.renderBar();
    this.renderPrompt();
    this.renderCard();
  }

  // --- Bandeau ---

  private renderBar(): void {
    const s = this.session;
    const v = s.player;
    const name = villagerName(s.playerId);
    const year = Math.floor(s.sim.state.season / s.p.seasonsPerYear) + 1;
    const progress = el('span', { class: 'life-clock', title: tr('life.bar.clock') }, el('span', { style: `width:${Math.round(s.progress * 100)}%` }));
    const info = el(
      'span',
      { class: 'life-info' },
      el('strong', {}, name),
      ` · ${v ? tr('life.bar.age', { age: s.ageYears }) : tr('life.bar.died', { age: s.ageYears })} · ${line(s.seasonName)}, ${tr('life.bar.year', { year })}`,
      v ? ` · ${tr('life.bar.wealth', { wealth: Math.round(v.wealth) })}` : '',
    );
    const buttons = el(
      'span',
      { class: 'life-buttons' },
      this.button('life.bar.conduct', () => this.open('conduct')),
      this.button('life.bar.neighbors', () => this.open('neighbors')),
      this.button('life.bar.help', () => this.open('help')),
    );
    this.bar.replaceChildren(info, progress, buttons);
  }

  /** Avance la jauge de la saison sans tout redessiner. */
  tickBar(): void {
    const fill = this.bar.querySelector<HTMLElement>('.life-clock > span');
    if (fill) fill.style.width = `${Math.round(this.session.progress * 100)}%`;
  }

  private button(key: TextKey, run: () => void, attrs: Record<string, string> = {}): HTMLButtonElement {
    const b = el('button', { type: 'button', ...attrs }, tr(key));
    b.addEventListener('click', run);
    return b;
  }

  private renderPrompt(): void {
    const s = this.session;
    const { place, near } = this.context;
    let text = '';
    if (this.busy() || s.phase !== 'chapter') text = '';
    else if (place === 'granary' && s.canGive()) text = tr('life.prompt.granary', { sacks: s.sacks }) + (near !== null ? tr('life.prompt.orClick') : '');
    else if (place === 'pond' && s.canFish()) text = tr('life.prompt.pond') + (near !== null ? tr('life.prompt.orClick') : '');
    else if (near !== null) text = tr('life.prompt.talk', { name: villagerName(near) });
    else if (place === 'granary') text = s.given !== null ? tr('life.prompt.granaryDone') : tr('life.prompt.granaryYoung');
    else if (place === 'pond') text = s.casts !== null ? tr('life.prompt.pondDone') : tr('life.prompt.pondYoung');
    else if (place === 'home') text = tr('life.prompt.home');
    else if (place === 'field') text = s.playerAdult ? tr('life.prompt.field', { sacks: s.sacks }) : tr('life.prompt.fieldYoung');
    else text = s.playerAdult && s.given === null && s.sacks > 0 ? tr('life.prompt.todo') : '';
    this.prompt.textContent = text;
    this.prompt.hidden = text === '';
  }

  // --- Panneaux ---

  private open(panel: Panel): void {
    this.panel = panel;
    this.renderPanel();
    this.renderPrompt();
  }

  private close(): void {
    this.panel = null;
    this.talking = null;
    this.panelBox.hidden = true;
    this.panelBox.replaceChildren();
    // Entre deux chapitres, le temps repart une fois la ligne de conduite revue.
    if (this.session.phase === 'between' && this.session.cards.length === 0) this.session.fastForward();
    this.renderBar();
    this.renderPrompt();
    this.renderCard();
  }

  private openTalk(id: number): void {
    this.talking = id;
    this.open('talk');
  }

  private openGranary(): void {
    const c = this.session.conduct;
    const sacks = this.session.sacks;
    this.pending = c && typeof c.share === 'number' ? Math.round(c.share * sacks) : Math.round(sacks / 3);
    this.open('granary');
  }

  private openPond(): void {
    this.pending = 0;
    this.open('pond');
  }

  private renderPanel(): void {
    const box = this.panelBox;
    box.hidden = false;
    const closeBtn = el('button', { type: 'button', class: 'life-close', 'aria-label': tr('life.close') }, '×');
    closeBtn.addEventListener('click', () => this.close());
    const content = this.panelContent();
    box.replaceChildren(closeBtn, ...content);
    box.querySelector<HTMLElement>('[data-focus]')?.focus();
  }

  private panelContent(): Node[] {
    switch (this.panel) {
      case 'talk':
        return this.talkPanel();
      case 'granary':
        return this.granaryPanel();
      case 'pond':
        return this.pondPanel();
      case 'conduct':
        return this.conductPanel();
      case 'neighbors':
        return this.neighborsPanel();
      case 'help':
        return this.helpPanel();
      case 'sleep':
        return this.sleepPanel();
      default:
        return [];
    }
  }

  private talkPanel(): Node[] {
    const talk = this.talking === null ? null : this.session.talk(this.talking);
    if (!talk) return [el('p', {}, tr('life.talk.gone'))];
    const head = el('h3', {}, talk.relation ? line(talk.relation) : talk.name);
    const lines = talk.lines.map((l) => el('p', {}, line(l)));
    const actions = talk.actions.map((a) => {
      const b = this.button('life.close', () => {
        a.run();
        this.renderPanel();
      });
      b.textContent = line(a.label);
      return el('div', { class: 'life-action' }, b, a.help ? el('small', {}, line(a.help)) : '');
    });
    const done = this.button('life.talk.bye', () => this.close(), { 'data-focus': '' });
    if (this.session.wantsToSanction.has(talk.id)) actions.push(el('p', { class: 'help' }, tr('life.talk.sanctionWanted')));
    return [head, ...lines, ...actions, el('div', { class: 'life-row' }, done)];
  }

  private granaryPanel(): Node[] {
    const s = this.session;
    const sacks = s.sacks;
    const adults = s.adults().length;
    const count = el('output', { class: 'life-count' }, `${this.pending} / ${sacks}`);
    const minus = this.button('life.granary.less', () => this.adjust(-1, sacks));
    const plus = this.button('life.granary.more', () => this.adjust(1, sacks));
    const ok = this.button('life.granary.give', () => this.confirmGive(), { class: 'primary', 'data-focus': '' });
    ok.textContent = tr('life.granary.give', { n: this.pending });
    const out: Node[] = [
      el('h3', {}, tr('life.granary.title')),
      el('p', {}, tr('life.granary.harvest', { sacks })),
      el('div', { class: 'life-row life-stepper' }, minus, count, plus),
      el('p', { class: 'help' }, tr('life.granary.rule', { mult: formatNumber(s.p.granaryMultiplier), adults, share: formatNumber(sacks > 0 ? this.pending / sacks : 0, 2) })),
    ];
    // Ce que font les voisins cette saison, s'ils sont déjà passés (moment 2 de MOMENTS.md).
    const seen = this.neighborGifts();
    out.push(el('p', {}, seen.length > 0 ? tr('life.granary.neighbors', { list: seen.join(', ') }) : tr('life.granary.nobodyYet')));
    if (!this.firstHarvestShown) {
      this.firstHarvestShown = true;
      out.push(el('p', { class: 'help' }, tr('life.granary.first')));
    }
    out.push(el('div', { class: 'life-row' }, ok), el('p', { class: 'help' }, tr('life.granary.keys')));
    return out;
  }

  private neighborGifts(): string[] {
    const s = this.session;
    const around = [...s.observed()];
    const parent = s.byId(s.parentId);
    if (parent && isAdult(parent, s.p) && !around.some((v) => v.id === parent.id)) around.unshift(parent);
    return around
      .map((v) => {
        const f = s.forecastOf(v.id);
        // Seulement ceux qui sont déjà passés : le joueur voit ce qu'ils ont versé, pas ce qu'ils vont verser.
        if (!f || f.harvest <= 0 || !hasGiven(v.id, s.progress)) return null;
        const rel = s.relation(v);
        return tr('life.granary.neighbor', { name: rel ? line(rel) : villagerName(v.id), given: Math.round(f.contributed), harvest: Math.round(f.harvest) });
      })
      .filter((x): x is string => x !== null);
  }

  private adjust(delta: number, max: number): void {
    this.pending = Math.max(0, Math.min(max, this.pending + delta));
    this.renderPanel();
  }

  private confirmGive(): void {
    const n = this.pending;
    this.session.give(n);
    this.hooks.give(n);
    this.close();
  }

  private pondPanel(): Node[] {
    const s = this.session;
    const pond = Math.round(s.pondNow * 100);
    const cast = this.button('life.pond.cast', () => {
      if (this.pending >= LIFE_PACING.maxCasts) return;
      this.pending += 1;
      this.hooks.cast();
      this.renderPanel();
    });
    if (this.pending >= LIFE_PACING.maxCasts) cast.disabled = true;
    // Entrée arrête (bouton actif), E lance (clavier).
    const stop = this.button('life.pond.stop', () => {
      s.fish(this.pending);
      this.close();
    }, { class: 'primary', 'data-focus': '' });
    stop.textContent = tr('life.pond.stop', { n: this.pending });
    const out: Node[] = [
      el('h3', {}, tr('life.pond.title')),
      el('p', {}, tr('life.pond.state', { pond })),
      el('div', { class: 'life-row life-stepper' }, el('output', { class: 'life-count' }, `${this.pending} / ${LIFE_PACING.maxCasts}`)),
      el('p', { class: 'help' }, tr('life.pond.rule', { max: LIFE_PACING.maxCasts, effort: formatNumber(this.pending / LIFE_PACING.maxCasts, 2), catch: s.p.maxCatch })),
    ];
    if (!this.firstFishShown) {
      this.firstFishShown = true;
      out.push(el('p', { class: 'help' }, tr('life.pond.first')));
    }
    out.push(el('div', { class: 'life-row' }, cast, stop), el('p', { class: 'help' }, tr('life.pond.keys')));
    return out;
  }

  private conductPanel(): Node[] {
    const s = this.session;
    const c = s.conduct;
    if (!c) return [el('p', {}, tr('life.talk.gone'))];
    const choose = (change: Partial<PlayerConduct>) => {
      s.setConduct(change);
      this.renderPanel();
    };
    const group = (title: TextKey, stances: typeof SHARE_STANCES, current: number | 'neighbors', set: (v: number | 'neighbors') => void, show: (v: number) => string) => {
      const known = stances.some((x) => x.value === current);
      const buttons = stances.map((x) => {
        const label = x.value === 'neighbors' ? tr(x.key) : `${tr(x.key)} (${show(x.value)})`;
        const b = el('button', { type: 'button', 'aria-pressed': x.value === current ? 'true' : 'false' }, label);
        b.addEventListener('click', () => set(x.value));
        return b;
      });
      if (!known && typeof current === 'number') buttons.push(el('button', { type: 'button', 'aria-pressed': 'true' }, tr('life.conduct.gesture', { value: show(current) })));
      return el('fieldset', {}, el('legend', {}, tr(title)), el('div', { class: 'life-choices' }, ...buttons));
    };
    const sacks = (v: number) => tr('life.conduct.sacks', { n: formatNumber(v * 10) });
    const casts = (v: number) => tr('life.conduct.casts', { n: formatNumber((1 - v) * LIFE_PACING.maxCasts), max: LIFE_PACING.maxCasts });
    const kids = el(
      'fieldset',
      {},
      el('legend', {}, tr('life.conduct.children')),
      el(
        'div',
        { class: 'life-choices' },
        ...([true, false] as const).map((yes) => {
          const b = el('button', { type: 'button', 'aria-pressed': c.children === yes ? 'true' : 'false' }, tr(yes ? 'life.conduct.childrenYesBtn' : 'life.conduct.childrenNoBtn'));
          b.addEventListener('click', () => choose({ children: yes }));
          return b;
        }),
      ),
    );
    return [
      el('h3', {}, tr('life.conduct.title')),
      el('p', { class: 'help' }, tr('life.conduct.help')),
      group('life.conduct.share', SHARE_STANCES, c.share, (v) => choose({ share: v }), sacks),
      group('life.conduct.fish', RESTRAINT_STANCES, c.restraint, (v) => choose({ restraint: v }), casts),
      kids,
      el('div', { class: 'life-row' }, this.button('life.close', () => this.close(), { 'data-focus': '' })),
    ];
  }

  private neighborsPanel(): Node[] {
    const s = this.session;
    const k = s.p.observedNeighbors;
    const name = (id: number) => {
      const v = s.byId(id);
      const rel = v ? s.relation(v) : null;
      return rel ? line(rel) : villagerName(id);
    };
    const share = (id: number) => {
      const v = s.byId(id);
      return v && v.last.harvest > 0 ? tr('life.neighbors.share', { given: Math.round(v.last.contributed), harvest: Math.round(v.last.harvest) }) : tr('life.neighbors.noShare');
    };
    if (k <= 0) return [el('h3', {}, tr('life.neighbors.title')), el('p', {}, tr('life.neighbors.all'))];
    const observed = s.observed();
    const observers = s.observers();
    return [
      el('h3', {}, tr('life.neighbors.title')),
      el('p', { class: 'help' }, tr('life.neighbors.rule', { k })),
      el('h4', {}, tr('life.neighbors.youSee')),
      el('ul', {}, ...observed.map((v) => el('li', {}, `${name(v.id)} : ${share(v.id)}`))),
      el('h4', {}, tr('life.neighbors.seeYou')),
      observers.length > 0 ? el('ul', {}, ...observers.map((v) => el('li', {}, name(v.id)))) : el('p', {}, tr(s.playerAdult ? 'life.neighbors.nobody' : 'life.neighbors.young')),
      el('div', { class: 'life-row' }, this.button('life.close', () => this.close(), { 'data-focus': '' })),
    ];
  }

  private helpPanel(): Node[] {
    const P = LIFE_PACING;
    return [
      el('h3', {}, tr('life.help.title')),
      el('p', {}, tr('life.help.move')),
      el('p', {}, tr('life.help.act')),
      el('h4', {}, tr('life.help.pacingTitle')),
      el(
        'ul',
        {},
        el('li', {}, tr('life.help.season', { s: Math.round(P.seasonMs / 1000) })),
        el('li', {}, tr('life.help.chapters', { ages: P.chapterAges.join(', '), years: P.chapterYears })),
        el('li', {}, tr('life.help.casts', { max: P.maxCasts })),
        el('li', {}, tr('life.help.sacks')),
        el('li', {}, tr('life.help.cooldown', { n: P.cooldown })),
      ),
      el('p', { class: 'help' }, tr('life.help.engine')),
      el('div', { class: 'life-row' }, this.button('life.close', () => this.close(), { 'data-focus': '' })),
    ];
  }

  private sleepPanel(): Node[] {
    const s = this.session;
    const warn = s.playerAdult && s.given === null && s.sacks > 0;
    const sleep = this.button('life.sleep.go', () => {
      this.close();
      s.sleep();
      this.seasonEnded();
    }, { class: 'primary', 'data-focus': '' });
    return [
      el('h3', {}, tr('life.sleep.title')),
      el('p', {}, tr('life.sleep.text')),
      warn ? el('p', { class: 'help' }, tr('life.sleep.warn')) : el('span'),
      ...s.conductLines().map((l) => el('p', { class: 'help' }, line(l))),
      el('div', { class: 'life-row' }, sleep, this.button('life.sleep.stay', () => this.close())),
    ];
  }

  // --- Cartes ---

  private renderCard(): void {
    const card = this.session.cards[0] ?? null;
    if (card === this.cardShown && !this.cardBox.hidden === !!card) return;
    this.cardShown = card;
    if (!card) {
      this.cardBox.hidden = true;
      this.cardBox.replaceChildren();
      return;
    }
    const speaker = card.speaker === undefined ? null : this.session.byId(card.speaker);
    // Une vraie question (un enfant, une règle, changer de conduite) n'a pas de réponse mise en avant :
    // seul « continuer » est un bouton principal.
    const CONTINUE = ['go', 'epilogue', 'replay'];
    const choices = card.choices.map((c) => {
      const b = el('button', { type: 'button', class: CONTINUE.includes(c.id) ? 'primary' : '' }, line(c.label));
      b.addEventListener('click', () => this.choose(c));
      return b;
    });
    const box = el(
      'div',
      { class: 'life-card', role: 'dialog', 'aria-modal': 'true' },
      el('h2', {}, line(card.title)),
      speaker ? el('p', { class: 'life-speaker' }, villagerName(speaker.id)) : '',
      ...card.lines.map((l) => el('p', {}, line(l))),
      el('div', { class: 'life-row life-card-choices' }, ...choices),
    );
    this.cardBox.replaceChildren(box);
    this.cardBox.hidden = false;
    const main = card.choices.findIndex((c) => CONTINUE.includes(c.id));
    if (main >= 0) choices[main]?.focus();
    else {
      box.setAttribute('tabindex', '-1');
      box.focus();
    }
  }

  private choose(c: CardChoice): void {
    const s = this.session;
    if (c.id === 'replay') return this.hooks.replay();
    if (c.id === 'new') return this.hooks.newLife();
    s.resolve(c);
    this.cardShown = null;
    if (c.id === 'conduct') this.open('conduct');
    this.refresh();
  }

  // --- Bilan ---

  private showToast(lines: string[]): void {
    const [title, ...rest] = lines;
    this.toast.replaceChildren(el('strong', {}, title ?? ''), ...rest.map((t) => el('p', {}, t)));
    this.toast.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.toast.hidden = true), 9000);
  }

  // --- Clavier ---

  private key(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (this.panel === null) return;
    // Entrée ou Espace sur un bouton : le bouton s'en charge déjà.
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const sacks = this.session.sacks;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (this.panel === 'granary') {
      if (e.key === 'ArrowLeft' || e.key === '-' || e.key === 'q' || e.key === 'a') this.adjust(-1, sacks);
      else if (e.key === 'ArrowRight' || e.key === '+' || e.key === 'e' || e.key === 'd') this.adjust(1, sacks);
      else if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmGive();
      }
    } else if (this.panel === 'pond') {
      if ((e.key === 'e' || e.key === ' ') && this.pending < LIFE_PACING.maxCasts) {
        e.preventDefault();
        this.pending += 1;
        this.hooks.cast();
        this.renderPanel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.session.fish(this.pending);
        this.close();
      }
    }
  }
}
