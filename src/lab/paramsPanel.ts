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
  container.append(intro);

  for (const group of GROUPS) {
    const keys = PARAM_KEYS.filter((k) => PARAM_SPECS[k].group === group.id);
    if (keys.length === 0) continue;
    container.append(el('h2', 'group', t(group.label)));
    for (const key of keys) container.append(renderParam(key));
  }
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
