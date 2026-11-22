/**
 * Labo : page de mise au point du moteur, sans graphismes.
 * Trois onglets : les réglages essentiels, tous les paramètres, et les règles du moteur.
 */
import { DEFAULT_PARAMS, PARAM_SPECS, Simulation, type Composition } from '../sim';
import { createCharts } from './charts';
import { selectTab, type TabId } from './nav';
import { createParamInput, renderParamsPanel } from './paramsPanel';
import { renderRulesPanel } from './rulesPanel';
import { PARAM_KEYS, formatValue, isModified, onParamChange, params, t } from './state';

const form = document.querySelector<HTMLFormElement>('#simple')!;
const summaryEl = document.querySelector<HTMLElement>('#summary')!;
const modifiedEl = document.querySelector<HTMLElement>('#modified')!;
const drawCharts = createCharts(document.querySelector<HTMLElement>('#charts')!);

// Onglets
document.querySelectorAll<HTMLButtonElement>('nav [role=tab]').forEach((button) => {
  button.addEventListener('click', () => selectTab(button.dataset.tab as TabId));
});
renderParamsPanel(document.querySelector<HTMLElement>('#tab-params')!);
renderRulesPanel(document.querySelector<HTMLElement>('#tab-rules')!);

// Les sanctions apparaissent aussi dans les réglages simples, liées au même paramètre.
const sanctionsLabel = document.createElement('label');
sanctionsLabel.className = 'check';
sanctionsLabel.append(createParamInput('sanctionsEnabled'), ` ${t(PARAM_SPECS.sanctionsEnabled.label)}`);
const sanctionsHelp = document.createElement('p');
sanctionsHelp.className = 'help';
sanctionsHelp.textContent = t(PARAM_SPECS.sanctionsEnabled.help);
document.querySelector('#simple-sanctions')!.append(sanctionsLabel, sanctionsHelp);

// Réglages simples
function num(name: string): number {
  return Number((form.elements.namedItem(name) as HTMLInputElement).value);
}

function composition(): Composition {
  const mode = (form.elements.namedItem('mode') as RadioNodeList).value;
  if (mode === 'uniform') return { mode, disposition: num('d'), influence: num('i') };
  if (mode === 'mix') {
    return {
      mode,
      mean: { disposition: num('mean'), influence: num('iMean') },
      spread: { disposition: num('spread'), influence: num('iSpread') },
    };
  }
  return {
    mode: 'twoGroups',
    shareA: num('shareA'),
    groupA: { disposition: num('dA'), influence: num('iA') },
    groupB: { disposition: num('dB'), influence: num('iB') },
  };
}

function syncForm(): void {
  const mode = (form.elements.namedItem('mode') as RadioNodeList).value;
  form.querySelectorAll<HTMLElement>('[data-mode]').forEach((el) => {
    el.hidden = el.dataset.mode !== mode;
  });
  form.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((input) => {
    const out = form.elements.namedItem(`o_${input.name}`) as HTMLOutputElement | null;
    if (out) out.value = input.value;
  });
}

/** Signale tout paramètre qui s'écarte des valeurs par défaut, pour qu'aucune capture ne cache un réglage. */
function showModified(): void {
  const changed = PARAM_KEYS.filter(isModified);
  modifiedEl.hidden = changed.length === 0;
  modifiedEl.textContent =
    `Paramètres modifiés par rapport aux valeurs par défaut : ` +
    changed
      .map((k) => `${t(PARAM_SPECS[k].label)} ${formatValue(DEFAULT_PARAMS[k])} → ${formatValue(params[k])}`)
      .join(' ; ');
}

function run(): void {
  const sim = new Simulation({ seed: num('seed'), size: num('size'), composition: composition(), params: { ...params } });
  const history = sim.runYears(num('years'));
  drawCharts(history);
  const last = history.at(-1);
  summaryEl.textContent = sim.state.extinct
    ? `Le village s’est éteint en l’an ${last?.year ?? 0}.`
    : `An ${last?.year ?? 0} : ${last?.population ?? 0} villageois, étang à ${Math.round((last?.pond ?? 0) * 100)} %.`;
}

form.addEventListener('input', syncForm);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  run();
});
document.querySelector('#run')!.addEventListener('click', run);
onParamChange(showModified);
window.addEventListener('resize', run);
syncForm();
showModified();
run();
