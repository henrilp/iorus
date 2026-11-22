/** Onglet « Règles du moteur » : tout ce que fait le moteur, dans l'ordre, avec ses formules. */
import { PARAM_SPECS, PHASES, RULES, conditionalChoice, type Rule, type SimParams } from '../sim';
import { reveal } from './nav';
import { formatValue, isModified, onParamChange, params, t } from './state';

function paramChip(key: keyof SimParams): HTMLButtonElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.dataset.param = key;
  chip.title = t(PARAM_SPECS[key].help);
  chip.append(`${t(PARAM_SPECS[key].label)} `);
  chip.append(document.createElement('b'));
  chip.addEventListener('click', () => reveal('params', `param-${key}`));
  return chip;
}

function syncChips(root: ParentNode, key?: keyof SimParams): void {
  const selector = key ? `.chip[data-param="${key}"]` : '.chip[data-param]';
  root.querySelectorAll<HTMLButtonElement>(selector).forEach((chip) => {
    const k = chip.dataset.param as keyof SimParams;
    chip.querySelector('b')!.textContent = formatValue(params[k]);
    chip.classList.toggle('modified', isModified(k));
  });
}

/** Remplace chaque [paramètre] de la formule par une pastille qui montre sa valeur actuelle. */
function renderFormula(formula: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'formula';
  let last = 0;
  for (const match of formula.matchAll(/\[(\w+)\]/g)) {
    box.append(formula.slice(last, match.index));
    box.append(paramChip(match[1] as keyof SimParams));
    last = (match.index ?? 0) + match[0].length;
  }
  box.append(formula.slice(last));
  return box;
}

function renderRule(rule: Rule): HTMLElement {
  const card = document.createElement('article');
  card.className = 'rule';
  card.id = `rule-${rule.id}`;
  const h = document.createElement('h3');
  h.textContent = t(rule.title);
  const p = document.createElement('p');
  p.textContent = t(rule.text);
  card.append(h, p);
  if (rule.formula) card.append(renderFormula(rule.formula));
  if (rule.id === 'share') card.append(renderBehaviorFigure());
  return card;
}

const DISPOSITIONS = [
  { d: 0, color: '#a0525f' },
  { d: 0.25, color: '#c9822b' },
  { d: 0.5, color: '#8a8a3a' },
  { d: 0.75, color: '#5a8f5a' },
  { d: 1, color: '#3f7fb5' },
];

/** La règle de comportement en image : part versée selon ce qu'on croit que versent les autres. */
function renderBehaviorFigure(): HTMLElement {
  const fig = document.createElement('figure');
  fig.className = 'behavior-figure';
  const cap = document.createElement('figcaption');
  cap.textContent =
    'La règle en image : part versée (verticale) selon ce qu’on croit que versent les autres (horizontale), pour cinq dispositions et l’influençabilité choisie ci-dessous, sans peur ni imprévisibilité. À gauche : ce qu’on donne quand personne ne donne.';
  const influenceLabel = document.createElement('label');
  const influenceOut = document.createElement('output');
  const influenceInput = document.createElement('input');
  influenceInput.type = 'range';
  influenceInput.min = '0';
  influenceInput.max = '1';
  influenceInput.step = '0.05';
  influenceInput.value = '0.7';
  influenceOut.value = formatValue(0.7);
  influenceLabel.append('Influençabilité de l’exemple ', influenceOut, influenceInput);
  const canvas = document.createElement('canvas');
  const legend = document.createElement('div');
  legend.className = 'legend';
  for (const { d, color } of DISPOSITIONS) {
    const s = document.createElement('span');
    s.style.setProperty('--c', color);
    s.textContent = `disposition ${formatValue(d)}`;
    legend.append(s);
  }
  fig.append(cap, influenceLabel, canvas, legend);

  const draw = () => {
    if (!canvas.isConnected || canvas.clientWidth === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.body);
    const pad = { l: 28, r: 6, t: 6, b: 22 };
    const x = (v: number) => pad.l + v * (w - pad.l - pad.r);
    const y = (v: number) => h - pad.b - v * (h - pad.t - pad.b);

    ctx.strokeStyle = css.getPropertyValue('--line');
    ctx.fillStyle = css.getPropertyValue('--muted');
    ctx.font = '11px system-ui';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x(0), y(0));
    ctx.lineTo(x(1), y(0));
    ctx.moveTo(x(0), y(0));
    ctx.lineTo(x(0), y(1));
    ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x(0), y(0));
    ctx.lineTo(x(1), y(1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('0', pad.l - 12, y(0) + 4);
    ctx.fillText('1', pad.l - 12, y(1) + 8);
    ctx.fillText('croyance : 0', x(0), h - 6);
    ctx.fillText('1', x(1) - 6, h - 6);

    for (const { d, color } of DISPOSITIONS) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const b = i / 50;
        const share = Math.min(1, Math.max(0, conditionalChoice(d, Number(influenceInput.value), b, params)));
        if (i === 0) ctx.moveTo(x(b), y(share));
        else ctx.lineTo(x(b), y(share));
      }
      ctx.stroke();
    }
  };
  onParamChange((key) => key === 'conditionalSlope' && draw());
  influenceInput.addEventListener('input', () => {
    influenceOut.value = formatValue(Number(influenceInput.value));
    draw();
  });
  new ResizeObserver(draw).observe(canvas);
  return fig;
}

export function renderRulesPanel(container: HTMLElement): void {
  const intro = document.createElement('p');
  intro.className = 'help';
  intro.textContent =
    'Tout ce que fait le moteur, dans l’ordre où il le fait. Les pastilles montrent la valeur actuelle de chaque paramètre ; cliquez pour la modifier. La diagonale en pointillés de la figure correspond à « je fais exactement comme les autres ».';
  container.append(intro);
  for (const phase of PHASES) {
    const h = document.createElement('h2');
    h.className = 'phase';
    h.textContent = t(phase.label);
    container.append(h);
    for (const rule of RULES.filter((r) => r.phase === phase.id)) container.append(renderRule(rule));
  }
  syncChips(container);
  onParamChange((key) => syncChips(container, key));
}
