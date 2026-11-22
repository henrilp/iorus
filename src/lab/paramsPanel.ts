/** Onglet « Tous les paramètres » : chaque paramètre du moteur, sans exception. */
import { DEFAULT_PARAMS, GROUPS, PARAM_SPECS, RULES, STATUS_LABELS, type ParamStatus, type SimParams } from '../sim';
import { reveal } from './nav';
import { PARAM_KEYS, formatValue, isModified, onParamChange, params, resetParams, setParam, t } from './state';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function statusBadge(status: ParamStatus): HTMLElement {
  return el('span', `badge ${status}`, t(STATUS_LABELS[status]));
}

/** Champ de saisie lié à un paramètre : il se met à jour si le paramètre change ailleurs. */
export function createParamInput(key: keyof SimParams): HTMLInputElement {
  const spec = PARAM_SPECS[key];
  const input = document.createElement('input');
  const isBool = typeof DEFAULT_PARAMS[key] === 'boolean';
  input.name = `param-${key}`;
  if (isBool) {
    input.type = 'checkbox';
    input.checked = params[key] as boolean;
    input.addEventListener('change', () => setParam(key, input.checked as never));
  } else {
    input.type = 'number';
    if (spec.min !== undefined) input.min = String(spec.min);
    if (spec.max !== undefined) input.max = String(spec.max);
    if (spec.step !== undefined) input.step = String(spec.step);
    input.value = String(params[key]);
    input.addEventListener('change', () => {
      let value = Number(input.value);
      if (!Number.isFinite(value)) value = DEFAULT_PARAMS[key] as number;
      if (spec.min !== undefined) value = Math.max(spec.min, value);
      if (spec.max !== undefined) value = Math.min(spec.max, value);
      setParam(key, value as never);
    });
  }
  onParamChange((changed) => {
    if (changed !== key) return;
    if (isBool) input.checked = params[key] as boolean;
    else if (Number(input.value) !== params[key]) input.value = String(params[key]);
  });
  return input;
}

export function renderParamsPanel(container: HTMLElement): void {
  const intro = el('div', 'params-intro');
  intro.append(
    el(
      'p',
      'help',
      'Tous les paramètres du moteur, sans exception. Chacun indique sa valeur par défaut, ce qu’il fait, les règles qui l’utilisent, et son statut :',
    ),
  );
  const legend = el('p', 'help');
  legend.append(
    statusBadge('source'),
    ' valeur vérifiée dans une publication ; ',
    statusBadge('a-sourcer'),
    ' la littérature donne une valeur ou une forme, pas encore vérifiée ; ',
    statusBadge('hypothese'),
    ' choix de conception, sans source directe.',
  );
  intro.append(legend);

  const counts = el('div', 'counts');
  const total: Record<ParamStatus, number> = { source: 0, 'a-sourcer': 0, hypothese: 0 };
  PARAM_KEYS.forEach((k) => (total[PARAM_SPECS[k].status] += 1));
  counts.append(el('span', undefined, `${PARAM_KEYS.length} paramètres :`));
  (['source', 'a-sourcer', 'hypothese'] as ParamStatus[]).forEach((s) => {
    const b = statusBadge(s);
    b.textContent = `${total[s]} ${b.textContent}`;
    counts.append(b);
  });
  const resetAll = el('button', 'link', 'Tout remettre par défaut');
  resetAll.type = 'button';
  resetAll.addEventListener('click', resetParams);
  counts.append(resetAll);
  intro.append(counts);

  const search = el('input', 'search');
  search.type = 'search';
  search.placeholder = 'Rechercher un paramètre (nom, rôle, règle…)';
  search.setAttribute('aria-label', 'Rechercher un paramètre');
  const searchStatus = el('p', 'help search-status');
  intro.append(search, searchStatus);
  container.append(intro);

  const sections: { heading: HTMLElement; cards: { card: HTMLElement; haystack: string }[] }[] = [];
  for (const group of GROUPS) {
    const keys = PARAM_KEYS.filter((k) => PARAM_SPECS[k].group === group.id);
    if (keys.length === 0) continue;
    const heading = el('h2', 'group', t(group.label));
    container.append(heading);
    const cards = keys.map((key) => {
      const card = renderParam(key);
      container.append(card);
      return { card, haystack: searchText(key, t(group.label)) };
    });
    sections.push({ heading, cards });
  }

  const empty = el('p', 'help', 'Aucun paramètre ne correspond.');
  empty.hidden = true;
  container.append(empty);

  search.addEventListener('input', () => {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const section of sections) {
      let visibleInSection = 0;
      for (const { card, haystack } of section.cards) {
        const match = words.every((w) => haystack.includes(w));
        card.hidden = !match;
        if (match) visibleInSection += 1;
      }
      section.heading.hidden = visibleInSection === 0;
      shown += visibleInSection;
    }
    empty.hidden = shown > 0;
    searchStatus.textContent = words.length === 0 ? '' : `${shown} paramètre${shown > 1 ? 's' : ''} sur ${PARAM_KEYS.length}`;
  });
}

/** Minuscules, sans accents : « Écart » se trouve en tapant « ecart ». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Tout ce qui décrit un paramètre, dans les deux langues : on le retrouve par n'importe quel mot qui en parle. */
function searchText(key: keyof SimParams, groupLabel: string): string {
  const spec = PARAM_SPECS[key];
  const parts = [
    key,
    groupLabel,
    spec.label.fr,
    spec.label.en,
    spec.help.fr,
    spec.help.en,
    spec.unit?.fr,
    spec.unit?.en,
    spec.note?.fr,
    spec.note?.en,
    t(STATUS_LABELS[spec.status]),
    ...RULES.filter((r) => r.params.includes(key)).flatMap((r) => [r.title.fr, r.title.en]),
  ];
  return normalize(parts.filter(Boolean).join(' '));
}

function renderParam(key: keyof SimParams): HTMLElement {
  const spec = PARAM_SPECS[key];
  const card = el('div', 'param');
  card.id = `param-${key}`;

  const head = el('div', 'param-head');
  const name = el('div', 'param-name', t(spec.label));
  name.append(el('code', undefined, key));
  const inputWrap = el('div', 'param-input');
  inputWrap.append(createParamInput(key));
  if (spec.unit) inputWrap.append(el('span', 'unit', t(spec.unit)));
  head.append(name, inputWrap);

  const meta = el('div', 'param-meta');
  meta.append(el('span', undefined, `défaut : ${formatValue(DEFAULT_PARAMS[key])}`), statusBadge(spec.status));
  const reset = el('button', 'link', 'remettre par défaut');
  reset.type = 'button';
  reset.addEventListener('click', () => setParam(key, DEFAULT_PARAMS[key] as never));
  meta.append(reset);

  card.append(head, meta, el('p', 'help', t(spec.help)));

  if (spec.note) {
    const details = el('details');
    details.append(el('summary', undefined, 'Pourquoi cette valeur ?'), el('p', 'help', t(spec.note)));
    card.append(details);
  }

  const usedBy = RULES.filter((r) => r.params.includes(key));
  const used = el('div', 'param-meta used-by');
  used.append(el('span', undefined, 'Utilisé par :'));
  for (const rule of usedBy) {
    const chip = el('button', 'chip', t(rule.title));
    chip.type = 'button';
    chip.addEventListener('click', () => reveal('rules', `rule-${rule.id}`));
    used.append(chip);
  }
  card.append(used);

  const sync = () => {
    card.classList.toggle('modified', isModified(key));
    reset.hidden = !isModified(key);
  };
  sync();
  onParamChange((changed) => changed === key && sync());
  return card;
}
