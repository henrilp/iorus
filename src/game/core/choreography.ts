/**
 * Chorégraphie d'une saison : où se trouve chaque villageois à chaque instant.
 *
 * La saison est déjà calculée par le moteur quand on la joue ; l'animation ne fait que
 * raconter ce qui s'est passé, dans l'ordre du cycle : champ, grenier, étang, sanctions, retour.
 * Les enfants restent à la maison.
 */
import { FIELD, GRANARY, POND, type Point } from './layout';
import { hash01 } from './visualHash';

/** Bornes des étapes, en fraction de la saison. */
export const PHASES = {
  fieldArrive: 0.18,
  fieldLeave: 0.3,
  granaryArrive: 0.42,
  granaryLeave: 0.5,
  pondArrive: 0.62,
  pondLeave: 0.8,
  homeArrive: 0.95,
} as const;

/** Moment où le grenier se remplit, et où l'étang change, à l'écran. */
export const GRANARY_WINDOW = [PHASES.granaryArrive - 0.06, PHASES.granaryLeave] as const;
export const POND_WINDOW = [PHASES.pondArrive - 0.04, PHASES.pondLeave] as const;
/** Les sanctions se montrent à la fin du passage à l'étang. */
export const SANCTION_WINDOW = [0.66, 0.84] as const;

interface Waypoint extends Point {
  t: number;
}

export function fieldSpot(id: number): Point {
  return {
    x: FIELD.x + 20 + hash01(id, 1) * (FIELD.width - 40),
    y: FIELD.y + 20 + hash01(id, 2) * (FIELD.height - 40),
  };
}

export function granarySpot(id: number): Point {
  const angle = Math.PI * (0.15 + 0.7 * hash01(id, 3)); // devant le grenier, côté maisons
  const r = 85 + 16 * hash01(id, 4);
  return { x: GRANARY.x + GRANARY.width / 2 + r * Math.cos(angle), y: GRANARY.y + GRANARY.height / 2 + r * Math.sin(angle) };
}

export function pondSpot(id: number): Point {
  const angle = 2 * Math.PI * hash01(id, 5);
  const k = 1.06 + 0.08 * hash01(id, 6);
  return { x: POND.x + POND.rx * k * Math.cos(angle), y: POND.y + POND.ry * k * Math.sin(angle) };
}

/** Petit décalage autour de la maison, pour que la famille ne s'empile pas. */
export function homeSpot(home: Point, id: number): Point {
  return { x: home.x + (hash01(id, 7) - 0.5) * 20, y: home.y + 12 + (hash01(id, 8) - 0.5) * 8 };
}

function adultPath(home: Point, id: number): Waypoint[] {
  const h = homeSpot(home, id);
  const f = fieldSpot(id);
  const g = granarySpot(id);
  const p = pondSpot(id);
  // Chacun part un peu plus tôt ou plus tard que les autres.
  const lag = (hash01(id, 9) - 0.5) * 0.04;
  return [
    { t: 0, ...h },
    { t: 0.04 + lag, ...h },
    { t: PHASES.fieldArrive + lag, ...f },
    { t: PHASES.fieldLeave + lag, ...f },
    { t: PHASES.granaryArrive + lag, ...g },
    { t: PHASES.granaryLeave + lag, ...g },
    { t: PHASES.pondArrive + lag, ...p },
    { t: PHASES.pondLeave + lag, ...p },
    { t: PHASES.homeArrive + lag, ...h },
    { t: 1, ...h },
  ];
}

const smooth = (u: number) => u * u * (3 - 2 * u);

/** Position d'un villageois à l'instant t (0 à 1) de la saison. */
export function positionAt(home: Point, id: number, adult: boolean, t: number, walking: boolean): Point {
  const h = homeSpot(home, id);
  if (!adult || !walking) return h;
  const path = adultPath(home, id);
  for (let i = 1; i < path.length; i++) {
    const b = path[i]!;
    if (t <= b.t) {
      const a = path[i - 1]!;
      const u = b.t > a.t ? smooth((t - a.t) / (b.t - a.t)) : 1;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
  }
  return h;
}

/** Interpolation entre l'ancienne et la nouvelle valeur d'un niveau, pendant sa fenêtre. */
export function levelAt(from: number, to: number, t: number, [start, end]: readonly [number, number]): number {
  if (t <= start) return from;
  if (t >= end) return to;
  return from + (to - from) * smooth((t - start) / (end - start));
}
