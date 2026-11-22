/**
 * La journée d'un villageois quand le joueur se promène (fiche 0030) : où il se trouve à chaque instant de la saison.
 *
 * Même cycle que la chorégraphie de l'observateur (champ, grenier, étang, retour), mais les villageois suivent le
 * chemin qui fait le tour du village et passent par les trouées de l'anneau. La position ne dépend que de
 * l'identifiant, de la maison et de l'instant : aucun tirage dans le hasard du moteur.
 */
import { PHASES } from './choreography';
import { doorPoint, exitPoint, polar, roadArc, type Point, type VillageMap } from './villageMap';
import { hash01 } from './visualHash';

interface Leg {
  t0: number;
  t1: number;
  path: Point[];
}

function lag(id: number): number {
  return (hash01(id, 9) - 0.5) * 0.05;
}

export function walkFieldSpot(map: VillageMap, id: number): Point {
  const f = map.field;
  return { x: f.x + 24 + hash01(id, 1) * (f.width - 48), y: f.y + 24 + hash01(id, 2) * (f.height - 48) };
}

/** Devant le grenier, en demi-cercle autour de la porte. */
export function walkGranarySpot(map: VillageMap, id: number): Point {
  const angle = Math.PI * (-0.08 + 1.16 * hash01(id, 3));
  const r = 62 + 30 * hash01(id, 4);
  return { x: map.center.x + r * Math.cos(angle), y: map.center.y + 8 + r * Math.sin(angle) * 0.75 };
}

export function walkPondSpot(map: VillageMap, id: number): Point {
  // Sur la rive, plutôt du côté du village.
  const angle = Math.PI * (0.45 + 1.1 * hash01(id, 5));
  const k = 1.07 + 0.06 * hash01(id, 6);
  return { x: map.pond.x + map.pond.rx * k * Math.cos(angle), y: map.pond.y + map.pond.ry * k * Math.sin(angle) };
}

/** Devant sa porte, un peu décalé pour que la famille ne s'empile pas. */
export function walkHomeSpot(map: VillageMap, home: number, id: number): Point {
  const d = doorPoint(map, home);
  return { x: d.x + (hash01(id, 7) - 0.5) * 22, y: d.y + (hash01(id, 8) - 0.5) * 12 };
}

function angleOf(map: VillageMap, p: Point): number {
  return Math.atan2(p.y - map.center.y, p.x - map.center.x);
}

/** Les trajets ne dépendent que du plan, de la maison et de l'identifiant : on les calcule une fois. */
const cache = new WeakMap<VillageMap, Map<string, Leg[]>>();

function legs(map: VillageMap, home: number, id: number): Leg[] {
  let byMap = cache.get(map);
  if (!byMap) cache.set(map, (byMap = new Map()));
  const key = `${home}:${id}`;
  let out = byMap.get(key);
  if (!out) byMap.set(key, (out = computeLegs(map, home, id)));
  return out;
}

function computeLegs(map: VillageMap, home: number, id: number): Leg[] {
  const l = lag(id);
  const h = walkHomeSpot(map, home, id);
  const f = walkFieldSpot(map, id);
  const g = walkGranarySpot(map, id);
  const p = walkPondSpot(map, id);
  const homeAngle = angleOf(map, h);
  const fieldRoad = polar(map, map.exits.field, map.roadRadius);
  const pondRoad = polar(map, map.exits.pond, map.roadRadius);
  const fieldExit = exitPoint(map, 'field');
  const pondExit = exitPoint(map, 'pond');
  return [
    { t0: 0.04 + l, t1: PHASES.fieldArrive + l, path: [h, ...roadArc(map, homeAngle, map.exits.field), fieldExit, f] },
    { t0: PHASES.fieldLeave + l, t1: PHASES.granaryArrive + l, path: [f, fieldExit, fieldRoad, g] },
    { t0: PHASES.granaryLeave + l, t1: PHASES.pondArrive + l, path: [g, pondRoad, pondExit, p] },
    { t0: PHASES.pondLeave + l, t1: PHASES.homeArrive + l, path: [p, pondExit, ...roadArc(map, map.exits.pond, homeAngle), h] },
  ];
}

const smooth = (u: number) => u * u * (3 - 2 * u);

function along(path: Point[], u: number): Point {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
    lengths.push(d);
    total += d;
  }
  let target = u * total;
  for (let i = 1; i < path.length; i++) {
    const d = lengths[i - 1]!;
    if (target <= d || i === path.length - 1) {
      const k = d > 0 ? Math.min(1, target / d) : 1;
      const a = path[i - 1]!;
      const b = path[i]!;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    target -= d;
  }
  return path[path.length - 1]!;
}

export interface Pose extends Point {
  /** Vrai s'il marche à cet instant (pour l'animation). */
  moving: boolean;
  /** Vrai s'il travaille au champ (il se penche sur ses plants). */
  working?: boolean;
}

/**
 * Où se trouve un villageois à l'instant t (0 à 1) de la saison. Les adultes font le tour des lieux ;
 * les enfants jouent devant chez eux, puis rentrent à la nuit.
 */
export function walkPose(map: VillageMap, home: number, id: number, adult: boolean, t: number): Pose {
  const h = walkHomeSpot(map, home, id);
  if (!adult) {
    if (t > PHASES.homeArrive) return { ...h, moving: false };
    const phase = 2 * Math.PI * (t * 3 + hash01(id, 10));
    return { x: h.x + 16 * Math.cos(phase), y: h.y - 14 - 8 * Math.sin(phase), moving: true };
  }
  const all = legs(map, home, id);
  let last: Point = h;
  for (const [i, leg] of all.entries()) {
    if (t < leg.t0) return { ...last, moving: false, working: i === 1 };
    if (t <= leg.t1) return { ...along(leg.path, smooth((t - leg.t0) / (leg.t1 - leg.t0))), moving: true };
    last = leg.path[leg.path.length - 1]!;
  }
  return { ...last, moving: false };
}

/** Vrai quand le villageois a déjà déposé sa part au grenier cette saison. */
export function hasGiven(id: number, t: number): boolean {
  return t >= PHASES.granaryArrive + lag(id);
}

/** Vrai pendant qu'il se tient devant le grenier. */
export function atGranary(id: number, t: number): boolean {
  return t >= PHASES.granaryArrive + lag(id) && t < PHASES.granaryLeave + lag(id);
}

/** Vrai pendant qu'il pêche. */
export function atPond(id: number, t: number): boolean {
  return t >= PHASES.pondArrive + lag(id) && t < PHASES.pondLeave + lag(id);
}
