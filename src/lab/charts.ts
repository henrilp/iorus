/** Courbes des indicateurs d'une partie. */
import type { SeasonMetrics } from '../sim';

interface Series {
  title: string;
  explanation: string;
  lines: { label: string; color: string; value: (m: SeasonMetrics) => number }[];
  max?: number;
}

const SERIES: Series[] = [
  {
    title: 'Part de la récolte versée au grenier',
    explanation: 'Moyenne sur les adultes. 1 : chacun verse toute sa récolte au pot commun ; 0 : personne ne verse rien.',
    lines: [{ label: 'part moyenne', color: '#c9822b', value: (m) => m.meanShare }],
    max: 1,
  },
  {
    title: 'Traits moyens de la population',
    explanation: 'Vert : disposition (0 = tout pour soi, 1 = tout pour le groupe). Violet clair : influençabilité (0 = ne regarde pas les autres, 1 = fait comme eux). Ils changent par les naissances ; la disposition aussi par l’imitation.',
    lines: [
      { label: 'disposition', color: '#5a8f5a', value: (m) => m.meanDisposition },
      { label: 'influençabilité', color: '#b08fd6', value: (m) => m.meanInfluence },
    ],
    max: 1,
  },
  {
    title: 'Étang',
    explanation: 'Poissons restants, en part de la capacité. 1 : plein ; 0 : vidé par la pêche.',
    lines: [{ label: 'stock', color: '#3f7fb5', value: (m) => m.pond }],
    max: 1,
  },
  {
    title: 'Inégalités (indice de Gini)',
    explanation: '0 : tout le monde pareil ; proche de 1 : une personne a presque tout. Rouge : revenus de la saison, qui reflètent les comportements. Gris : patrimoine accumulé, qui reflète surtout l’âge et l’héritage (environ 0,6 même entre villageois identiques).',
    lines: [
      { label: 'revenus', color: '#a0525f', value: (m) => m.incomeGini },
      { label: 'patrimoine', color: '--muted', value: (m) => m.wealthGini },
    ],
    max: 1,
  },
  {
    title: 'Population',
    explanation: 'Trait clair : tous les villageois ; trait foncé : les adultes seulement.',
    lines: [
      { label: 'tous', color: '--muted', value: (m) => m.population },
      { label: 'adultes', color: '--fg', value: (m) => m.adults },
    ],
  },
  {
    title: 'Sanctions par saison',
    explanation: 'Violet : sanctions pour le grenier. Bleu : sanctions contre la surpêche. Zéro si elles sont interdites.',
    lines: [
      { label: 'grenier', color: '#8a5fb5', value: (m) => m.sanctions - m.pondSanctions },
      { label: 'pêche', color: '#3f7fb5', value: (m) => m.pondSanctions },
    ],
  },
];

export function createCharts(container: HTMLElement): (history: SeasonMetrics[]) => void {
  const heatmap = createFigure(
    container,
    'Répartition des dispositions dans le temps',
    'Chaque colonne est un moment de la partie ; de bas en haut, les dispositions de 0 (tout pour soi) à 1 (tout pour le groupe). Plus c’est foncé, plus il y a de villageois dans cette tranche. Montre ce que la moyenne cache : convergence, village coupé en deux, invasion.',
  );
  heatmap.parentElement!.classList.add('wide');
  const canvases = SERIES.map((s) => createFigure(container, s.title, s.explanation));
  return (history) => {
    drawHeatmap(heatmap, history);
    SERIES.forEach((s, i) => draw(canvases[i]!, s, history));
  };
}

function createFigure(container: HTMLElement, title: string, explanation: string): HTMLCanvasElement {
  const fig = document.createElement('figure');
  const cap = document.createElement('figcaption');
  cap.textContent = title;
  const small = document.createElement('small');
  small.textContent = explanation;
  cap.append(small);
  const canvas = document.createElement('canvas');
  fig.append(cap, canvas);
  container.append(fig);
  return canvas;
}

/** Carte de chaleur : temps en abscisse, tranches de disposition en ordonnée, part de la population en intensité. */
function drawHeatmap(canvas: HTMLCanvasElement, history: SeasonMetrics[]): void {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  if (history.length === 0) return;
  const pad = { l: 22, r: 4, t: 4, b: 4 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const columns = Math.max(1, Math.min(history.length, Math.floor(plotW / 3)));
  const colW = plotW / columns;
  const rowH = plotH / 10;
  for (let c = 0; c < columns; c++) {
    const from = Math.floor((c * history.length) / columns);
    const to = Math.max(from + 1, Math.floor(((c + 1) * history.length) / columns));
    const slice = history.slice(from, to);
    for (let b = 0; b < 10; b++) {
      const share = slice.reduce((a, m) => a + (m.dispositionBins[b] ?? 0), 0) / slice.length;
      if (share <= 0) continue;
      ctx.fillStyle = `rgba(90, 143, 90, ${Math.min(1, 0.08 + share * 2.5)})`;
      ctx.fillRect(pad.l + c * colW, pad.t + (9 - b) * rowH, Math.ceil(colW), Math.ceil(rowH));
    }
  }
  ctx.fillStyle = color('--muted');
  ctx.font = '11px system-ui';
  ctx.fillText('1', 6, pad.t + 10);
  ctx.fillText('0', 6, h - pad.b - 2);
}

function color(c: string): string {
  // Une couleur « --nom » renvoie à une variable CSS, pour suivre le thème clair/sombre.
  return c.startsWith('--') ? getComputedStyle(document.body).getPropertyValue(c) : c;
}

function draw(canvas: HTMLCanvasElement, series: Series, history: SeasonMetrics[]): void {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const max = series.max ?? Math.max(1, ...history.flatMap((m) => series.lines.map((l) => l.value(m))));
  const pad = 4;
  const x = (i: number) => pad + (i / Math.max(1, history.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);

  ctx.strokeStyle = color('--line');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y(0));
  ctx.lineTo(w - pad, y(0));
  ctx.stroke();

  for (const line of series.lines) {
    ctx.strokeStyle = color(line.color);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((m, i) => {
      if (i === 0) ctx.moveTo(x(i), y(line.value(m)));
      else ctx.lineTo(x(i), y(line.value(m)));
    });
    ctx.stroke();
  }

  const last = history.at(-1);
  ctx.fillStyle = color('--muted');
  ctx.font = '11px system-ui';
  ctx.fillText(`max ${Math.round(max * 100) / 100}`, pad + 2, pad + 10);
  if (last) ctx.fillText(`an ${last.year}`, w - pad - 40, h - pad - 4);
}
