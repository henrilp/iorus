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
    explanation: 'Sur les réserves de nourriture des adultes. 0 : tout le monde a la même chose ; proche de 1 : une personne a presque tout.',
    lines: [{ label: 'gini', color: '#a0525f', value: (m) => m.gini }],
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
    explanation: 'Nombre de villageois sanctionnés dans la saison (zéro si les sanctions sont interdites).',
    lines: [{ label: 'sanctions', color: '#8a5fb5', value: (m) => m.sanctions }],
  },
];

export function createCharts(container: HTMLElement): (history: SeasonMetrics[]) => void {
  const canvases = SERIES.map((s) => {
    const fig = document.createElement('figure');
    const cap = document.createElement('figcaption');
    cap.textContent = s.title;
    const small = document.createElement('small');
    small.textContent = s.explanation;
    cap.append(small);
    const canvas = document.createElement('canvas');
    fig.append(cap, canvas);
    container.append(fig);
    return canvas;
  });
  return (history) => SERIES.forEach((s, i) => draw(canvases[i]!, s, history));
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
