/**
 * Écran de réglage, en HTML : curseurs, choix et graine se lisent et se traduisent mieux
 * hors du canevas (fiche 0019).
 */
import { DEFAULT_PARAMS, PARAM_SPECS, type Composition, type SimConfig, type Traits } from '../../sim';
import { formatNumber, text, tr, type TextKey } from '../../i18n';
import { DEFAULT_DURATION, DURATIONS, SIZE_DEFAULT, SIZE_MAX, SIZE_MIN } from '../core/display';
import { el } from './dom';

type Mode = Composition['mode'];

export interface SetupState {
  size: number;
  mode: Mode;
  uniform: Traits;
  shareA: number;
  groupA: Traits;
  groupB: Traits;
  mean: Traits;
  spread: Traits;
  pond: number;
  sanctions: boolean;
  pondSanctions: boolean;
  duration: number | null;
  seed: number;
}

/** Réglages par défaut : les mêmes que ceux du labo. */
export function defaultSetup(): SetupState {
  return {
    size: SIZE_DEFAULT,
    mode: 'twoGroups',
    uniform: { disposition: 0.5, influence: 0.7 },
    shareA: 0.15,
    groupA: { disposition: 0, influence: 0 },
    groupB: { disposition: 0.6, influence: 0.7 },
    mean: { disposition: 0.5, influence: 0.7 },
    spread: { disposition: 0.2, influence: 0.15 },
    pond: DEFAULT_PARAMS.pondCapacityPerVillager,
    sanctions: DEFAULT_PARAMS.sanctionsEnabled,
    pondSanctions: DEFAULT_PARAMS.pondSanctionsEnabled,
    duration: DEFAULT_DURATION,
    // La graine du moteur, pas son aléa : tirée ici une fois, affichée et modifiable.
    seed: Math.floor(Math.random() * 1_000_000),
  };
}

export function toConfig(s: SetupState): SimConfig {
  const composition: Composition =
    s.mode === 'uniform'
      ? { mode: 'uniform', ...s.uniform }
      : s.mode === 'twoGroups'
        ? { mode: 'twoGroups', shareA: s.shareA, groupA: { ...s.groupA }, groupB: { ...s.groupB } }
        : { mode: 'mix', mean: { ...s.mean }, spread: { ...s.spread } };
  return {
    seed: s.seed,
    size: s.size,
    composition,
    params: {
      pondCapacityPerVillager: s.pond,
      sanctionsEnabled: s.sanctions,
      pondSanctionsEnabled: s.pondSanctions,
    },
  };
}

function slider(labelKey: TextKey, value: number, max: number, onInput: (v: number) => void, prefix = ''): HTMLElement {
  const out = el('output', {}, formatNumber(value, 2));
  const input = el('input', { type: 'range', min: 0, max, step: 0.05, value });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    out.textContent = formatNumber(v, 2);
    onInput(v);
  });
  return el('label', { class: 'slider' }, el('span', {}, prefix + tr(labelKey)), input, out);
}

function traitSliders(t: Traits, prefix = ''): HTMLElement[] {
  return [
    slider('setup.disposition', t.disposition, 1, (v) => (t.disposition = v), prefix),
    slider('setup.influence', t.influence, 1, (v) => (t.influence = v), prefix),
  ];
}

function check(label: string, help: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', checked: value });
  input.addEventListener('change', () => onChange(input.checked));
  return el('div', {}, el('label', { class: 'check' }, input, ` ${label}`), el('p', { class: 'help' }, help));
}

/** Dessine l'écran de réglage. `s` est modifié sur place : un changement de langue le redessine sans rien perdre. */
export function renderSetup(root: HTMLElement, s: SetupState, onStart: (s: SetupState) => void): void {
  root.replaceChildren();

  // Taille et graine
  const size = el('input', { type: 'number', min: SIZE_MIN, max: SIZE_MAX, value: s.size, required: true });
  size.addEventListener('input', () => {
    s.size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(Number(size.value) || SIZE_DEFAULT)));
  });
  const seed = el('input', { type: 'number', value: s.seed, required: true });
  seed.addEventListener('input', () => (s.seed = Math.round(Number(seed.value) || 0)));

  // Composition
  const modes: Mode[] = ['uniform', 'twoGroups', 'mix'];
  const panels: Record<Mode, HTMLElement> = {
    uniform: el('div', { class: 'traits' }, ...traitSliders(s.uniform)),
    twoGroups: el(
      'div',
      { class: 'traits' },
      slider('setup.shareA', s.shareA, 1, (v) => (s.shareA = v)),
      el('h4', {}, tr('setup.profileA')),
      ...traitSliders(s.groupA),
      el('h4', {}, tr('setup.profileB')),
      ...traitSliders(s.groupB),
    ),
    mix: el(
      'div',
      { class: 'traits' },
      el('h4', {}, tr('setup.mean')),
      ...traitSliders(s.mean),
      el('h4', {}, tr('setup.spread')),
      slider('setup.disposition', s.spread.disposition, 0.5, (v) => (s.spread.disposition = v)),
      slider('setup.influence', s.spread.influence, 0.5, (v) => (s.spread.influence = v)),
    ),
  };
  const showMode = () => modes.forEach((m) => (panels[m].hidden = m !== s.mode));
  const modeChoices = modes.map((m) => {
    const input = el('input', { type: 'radio', name: 'mode', value: m, checked: s.mode === m });
    input.addEventListener('change', () => {
      s.mode = m;
      showMode();
    });
    return el('label', { class: 'check' }, input, ` ${tr(`setup.mode.${m}`)}`);
  });
  showMode();

  // Étang
  const pondChoices = (PARAM_SPECS.pondCapacityPerVillager.presets ?? []).map((preset) => {
    const input = el('input', { type: 'radio', name: 'pond', value: preset.value, checked: s.pond === preset.value });
    input.addEventListener('change', () => (s.pond = preset.value));
    return el('label', { class: 'check' }, input, ` ${text(preset.label)}`);
  });

  // Durée
  const duration = el(
    'select',
    {},
    ...DURATIONS.map((d) =>
      el(
        'option',
        { value: d ?? '', selected: d === s.duration },
        d === null ? tr('setup.duration.open') : tr('setup.duration.years', { n: d }),
      ),
    ),
  );
  duration.addEventListener('change', () => (s.duration = duration.value === '' ? null : Number(duration.value)));

  const form = el(
    'form',
    { class: 'setup' },
    el('h2', {}, tr('setup.heading')),
    el('p', { class: 'lead' }, tr('setup.intro')),
    el(
      'fieldset',
      {},
      el('legend', {}, tr('setup.composition')),
      el('label', { class: 'field' }, el('span', {}, tr('setup.size')), size),
      el('div', { class: 'modes' }, ...modeChoices),
      panels.uniform,
      panels.twoGroups,
      panels.mix,
      el('p', { class: 'help' }, tr('setup.compositionHelp')),
    ),
    el('fieldset', {}, el('legend', {}, tr('setup.pond')), el('div', { class: 'modes' }, ...pondChoices), el('p', { class: 'help' }, tr('setup.pondHelp'))),
    el(
      'fieldset',
      {},
      el('legend', {}, tr('setup.rules')),
      check(text(PARAM_SPECS.sanctionsEnabled.label), tr('setup.sanctionsHelp'), s.sanctions, (v) => (s.sanctions = v)),
      check(text(PARAM_SPECS.pondSanctionsEnabled.label), tr('setup.pondSanctionsHelp'), s.pondSanctions, (v) => (s.pondSanctions = v)),
    ),
    el(
      'fieldset',
      {},
      el('legend', {}, tr('setup.duration')),
      el('label', { class: 'field' }, el('span', {}, tr('setup.duration')), duration),
      el('label', { class: 'field' }, el('span', {}, tr('setup.seed')), seed),
      el('p', { class: 'help' }, tr('setup.seedHelp')),
    ),
    el('button', { type: 'submit', class: 'primary' }, tr('setup.start')),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onStart(s);
  });
  root.append(form);
}
