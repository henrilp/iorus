/**
 * Page du prototype « une vie », en texte. Toute la logique est dans life.ts ; ici, seulement l'affichage.
 */
import { DEFAULT_PARAMS, PARAM_SPECS, type Composition, type SimParams } from '../sim';
import { LifeSession, PACING, RESTRAINT_STANCES, SHARE_STANCES, type LifeSettings, type Stance } from './life';

const setupEl = document.querySelector<HTMLElement>('#setup')!;
const lifeEl = document.querySelector<HTMLElement>('#life')!;
const sideEl = document.querySelector<HTMLElement>('#side')!;
const logEl = document.querySelector<HTMLElement>('#log')!;
const momentEl = document.querySelector<HTMLElement>('#moment')!;
const controlsEl = document.querySelector<HTMLElement>('#controls')!;

const num = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

const COMPOSITIONS: Record<string, { label: string; composition: Composition }> = {
  mix: {
    label: 'Village mélangé',
    composition: { mode: 'mix', mean: { disposition: 0.5, influence: 0.7 }, spread: { disposition: 0.2, influence: 0.15 } },
  },
  free: {
    label: 'Avec 15 % de profiteurs',
    composition: {
      mode: 'twoGroups',
      shareA: 0.15,
      groupA: { disposition: 0, influence: 0 },
      groupB: { disposition: 0.6, influence: 0.7 },
    },
  },
};

// --- Réglages ---

let settings: LifeSettings | null = null;
let session: LifeSession | null = null;

function presetSelect(key: 'pondCapacityPerVillager' | 'observedNeighbors', value: number): HTMLSelectElement {
  const select = el('select', { name: key });
  for (const p of PARAM_SPECS[key].presets ?? []) {
    const option = el('option', { value: String(p.value) }, p.label.fr);
    if (p.value === value) option.selected = true;
    select.append(option);
  }
  return select;
}

function renderSetup(): void {
  const form = el('form');
  const compo = el('select', { name: 'composition' });
  for (const [k, c] of Object.entries(COMPOSITIONS)) compo.append(el('option', { value: k }, c.label));
  form.append(
    el(
      'fieldset',
      {},
      el('legend', {}, 'Le village'),
      el('label', {}, 'Graine du hasard ', el('input', { type: 'number', name: 'seed', value: String(settings?.seed ?? 42) })),
      el('label', {}, 'Villageois au départ ', el('input', { type: 'number', name: 'size', min: '5', max: '120', value: String(settings?.size ?? 30) })),
      el('label', {}, 'Population ', compo),
      el('label', {}, `${PARAM_SPECS.pondCapacityPerVillager.label.fr} `, presetSelect('pondCapacityPerVillager', DEFAULT_PARAMS.pondCapacityPerVillager)),
      el('p', { class: 'help' }, 'Avec le grand étang, les poissons se renouvellent assez pour que l’étang ne meure jamais ; avec le petit, un village qui pêche sans retenue peut le vider.'),
    ),
    el(
      'fieldset',
      {},
      el('legend', {}, 'Règles du village'),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', name: 'sanctionsEnabled' }), ` ${PARAM_SPECS.sanctionsEnabled.label.fr}`),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', name: 'pondSanctionsEnabled' }), ` ${PARAM_SPECS.pondSanctionsEnabled.label.fr}`),
    ),
    el(
      'fieldset',
      {},
      el('legend', {}, 'Ce que chacun voit'),
      el('label', {}, `${PARAM_SPECS.observedNeighbors.label.fr} `, presetSelect('observedNeighbors', 2)),
      el('p', { class: 'help' }, PARAM_SPECS.observedNeighbors.help.fr),
    ),
    el('button', { type: 'submit', class: 'primary' }, 'Commencer une vie'),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const params: Partial<SimParams> = {
      pondCapacityPerVillager: Number(f.get('pondCapacityPerVillager')),
      observedNeighbors: Number(f.get('observedNeighbors')),
      sanctionsEnabled: f.get('sanctionsEnabled') === 'on',
      pondSanctionsEnabled: f.get('pondSanctionsEnabled') === 'on',
    };
    settings = {
      seed: Number(f.get('seed')),
      size: Number(f.get('size')),
      composition: COMPOSITIONS[String(f.get('composition'))]!.composition,
      params,
    };
    start();
  });
  setupEl.replaceChildren(el('h2', {}, 'Le village où tu vas vivre'), form);
}

function start(): void {
  if (!settings) return;
  session = new LifeSession(settings);
  setupEl.hidden = true;
  lifeEl.hidden = false;
  render();
}

// --- La vie ---

function stanceRadios(name: string, stances: Stance<number | 'neighbors'>[], current: number | 'neighbors', unit: string, onPick: (v: number | 'neighbors') => void): HTMLElement {
  const box = el('div', { class: 'stances' });
  stances.forEach((st, i) => {
    const input = el('input', { type: 'radio', name, value: String(i) });
    input.checked = st.value === current;
    input.disabled = !session?.player;
    input.addEventListener('change', () => {
      onPick(st.value);
      render();
    });
    const value = st.value === 'neighbors' ? 'ce que tu crois qu’ils font' : `${num.format(st.value * 100)} % ${unit}`;
    box.append(el('label', {}, input, ` ${st.label}`, el('span', { class: 'value' }, value)));
  });
  return box;
}

function modifiedParams(): string {
  if (!settings) return '';
  const keys = Object.keys(settings.params) as (keyof SimParams)[];
  const changed = keys.filter((k) => settings!.params[k] !== DEFAULT_PARAMS[k]);
  if (changed.length === 0) return 'Aucun paramètre modifié par rapport aux valeurs par défaut.';
  const show = (v: unknown) => (typeof v === 'boolean' ? (v ? 'oui' : 'non') : num.format(Number(v)));
  return `Paramètres modifiés : ${changed.map((k) => `${PARAM_SPECS[k].label.fr} ${show(DEFAULT_PARAMS[k])} → ${show(settings!.params[k])}`).join(' ; ')}.`;
}

function renderSide(s: LifeSession): void {
  const v = s.player;
  const conduct = s.conduct;
  const children = s.sim.state.villagers.filter((c) => c.parentId === s.playerId).length;
  const status = el(
    'dl',
    { class: 'status' },
    el('dt', {}, 'Âge'),
    el('dd', {}, v ? `${Math.floor(s.ageYears)} ans` : `mort à ${Math.floor(s.ageYears)} ans`),
    el('dt', {}, 'Réserve'),
    el('dd', {}, v ? num.format(v.wealth) : '—'),
    el('dt', {}, 'Enfants en vie'),
    el('dd', {}, String(children)),
    el('dt', {}, 'Village'),
    el('dd', {}, `${s.sim.state.villagers.length} habitants`),
    el('dt', {}, 'Étang'),
    el('dd', {}, `${Math.round((s.sim.state.pondStock / s.sim.state.pondCapacity) * 100)} %`),
  );
  const sections: HTMLElement[] = [el('section', {}, el('h2', {}, `Chapitre ${s.chapter + 1} sur ${PACING.chapterAges.length}`), status)];

  if (conduct) {
    const kids = el('div', { class: 'stances' });
    for (const [label, value] of [['oui', true], ['non', false]] as const) {
      const input = el('input', { type: 'radio', name: 'children', value: label });
      input.checked = conduct.children === value;
      input.disabled = !v;
      input.addEventListener('change', () => {
        s.setConduct({ children: value });
        render();
      });
      kids.append(el('label', {}, input, ` ${label}`, el('span', { class: 'value' }, '')));
    }
    sections.push(
      el(
        'section',
        {},
        el('h2', {}, 'Ta ligne de conduite'),
        el('p', { class: 'help' }, 'Elle s’applique chaque saison, jusqu’à ce que tu la changes. Les valeurs à droite sont ce que reçoit le moteur : un choix du prototype, pas une donnée observée.'),
        el('strong', {}, 'Au grenier, verser'),
        stanceRadios('share', SHARE_STANCES, conduct.share, 'de la récolte', (value) => s.setConduct({ share: value })),
        el('strong', {}, 'À l’étang, pêcher'),
        stanceRadios('restraint', RESTRAINT_STANCES, conduct.restraint, 'de retenue', (value) => s.setConduct({ restraint: value })),
        el('strong', {}, 'Avoir des enfants'),
        kids,
      ),
    );
  }

  const c = PACING.cooldown;
  sections.push(
    el(
      'section',
      {},
      el('h2', {}, 'Le rythme'),
      el(
        'p',
        { class: 'help' },
        `Ces réglages du prototype ne touchent pas le moteur, mais ils décident quand on te demande ton avis. Chapitres à ${PACING.chapterAges.join(', ')} ans, d’un an chacun (le premier va jusqu’à la fin de ta première année adulte). ` +
          `Un même moment ne revient pas avant : faim et sanction ${c.hunger / 4} ans, enfant ${c.childOffer / 4} ans, voisin qui verse peu ou qui a faim ${c.cheater / 4} an. ` +
          `Un voisin est signalé après ${PACING.cheaterStreak} saisons de suite nettement sous la moyenne.`,
      ),
      el('p', { class: 'help' }, `Graine ${settings?.seed}. ${modifiedParams()}`),
    ),
  );
  sideEl.replaceChildren(...sections);
}

function renderLog(s: LifeSession): void {
  logEl.replaceChildren(...s.log.map((e) => el('p', { class: e.kind }, e.text)));
  logEl.scrollTop = logEl.scrollHeight;
}

function renderMoment(s: LifeSession): void {
  const m = s.moments[0];
  momentEl.hidden = !m;
  if (!m) return;
  const choices = el('div', { class: 'choices' });
  const options = m.choices.length > 0 ? m.choices : [{ label: 'Continuer', run: () => undefined }];
  options.forEach((choice, i) => {
    const button = el('button', { type: 'button', class: i === 0 && m.choices.length === 0 ? 'primary' : '' }, choice.label);
    button.addEventListener('click', () => {
      s.resolve(m.choices.length > 0 ? choice : undefined);
      render();
    });
    choices.append(button);
  });
  momentEl.replaceChildren(
    el('h2', {}, m.title),
    ...(m.speaker ? [el('p', { class: 'speaker' }, m.speaker)] : []),
    ...m.lines.map((line) => el('p', {}, line)),
    choices,
  );
}

function button(label: string, action: () => void, primary = true): HTMLButtonElement {
  const b = el('button', { type: 'button', class: primary ? 'primary' : '' }, label);
  b.disabled = (session?.moments.length ?? 0) > 0;
  b.addEventListener('click', () => {
    action();
    render();
  });
  return b;
}

function renderControls(s: LifeSession): void {
  const buttons: HTMLButtonElement[] = [];
  if (s.phase === 'chapter') buttons.push(button('Saison suivante', () => s.nextSeason()));
  if (s.phase === 'between') {
    buttons.push(
      s.isLastChapter
        ? button('Laisser passer le temps', () => s.fastForwardToEnd())
        : button(`Passer à tes ${PACING.chapterAges[s.chapter + 1]} ans`, () => s.fastForward()),
    );
  }
  if (s.phase === 'dead') buttons.push(button('Voir ce qui reste', () => s.epilogue()));
  if (s.phase === 'over') {
    buttons.push(button('Revivre une vie dans ce village', start));
    buttons.push(
      button(
        'Changer de village',
        () => {
          lifeEl.hidden = true;
          setupEl.hidden = false;
          renderSetup();
        },
        false,
      ),
    );
  }
  controlsEl.replaceChildren(...buttons);
}

function render(): void {
  const s = session;
  if (!s) return;
  renderSide(s);
  renderLog(s);
  renderMoment(s);
  renderControls(s);
}

renderSetup();
