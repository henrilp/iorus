/**
 * Le plan du village quand le joueur s'y promène (fiche 0030).
 *
 * Les maisons sont posées sur un cercle, dans l'ordre de l'anneau du moteur (`Villager.home`) : les voisins que le
 * moteur fait observer sont donc les maisons d'à côté, à l'écran aussi. Le grenier commun est au milieu, le champ au
 * nord, l'étang à l'est ; deux trouées dans l'anneau mènent à l'un et à l'autre.
 *
 * Pas de Phaser ni de DOM ici : la géométrie, les obstacles et les trajets sont testés sans navigateur.
 */
import { hash01 } from './visualHash';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ellipse {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface Tree extends Point {
  /** 0 à 1 : taille et teinte, tirées de la position. */
  size: number;
}

export interface VillageMap {
  width: number;
  height: number;
  center: Point;
  /** Rayon du cercle des maisons. */
  ringRadius: number;
  /** Rayon du chemin qui fait le tour du village, à l'intérieur des maisons. */
  roadRadius: number;
  /** Nombre d'emplacements de maisons (le plus grand `home` + 1). */
  houseCount: number;
  /** Angle de chaque maison, par emplacement. */
  houseAngles: number[];
  granary: Rect;
  field: Rect;
  pond: Ellipse;
  /** Angles des deux trouées de l'anneau. */
  exits: { field: number; pond: number };
  trees: Tree[];
}

/** Écart entre deux maisons sur le cercle, en pixels du monde. */
const PLOT = 74;
/** Largeur d'une trouée, en emplacements de maison. */
const EXIT_PLOTS = 1.6;
export const HOUSE_SIZE = { width: 38, height: 30 } as const;
const GRANARY_SIZE = { width: 74, height: 62 } as const;
const FIELD_SIZE = { width: 560, height: 250 } as const;
const POND_SIZE = { rx: 200, ry: 135 } as const;
const MARGIN = 240;
/** Rayon d'un personnage, pour les collisions. */
export const BODY_RADIUS = 6;

const EXIT_FIELD = -Math.PI / 2;
const EXIT_POND = 0;

export function buildVillageMap(houseCount: number): VillageMap {
  const n = Math.max(1, houseCount);
  const slots = n + 2 * EXIT_PLOTS;
  const ringRadius = Math.max(250, (slots * PLOT) / (2 * Math.PI));
  const roadRadius = ringRadius - 48;

  const center = { x: MARGIN + ringRadius + 40, y: MARGIN + FIELD_SIZE.height + 110 + ringRadius };
  const field: Rect = {
    x: center.x - FIELD_SIZE.width / 2,
    y: center.y - ringRadius - 100 - FIELD_SIZE.height,
    width: FIELD_SIZE.width,
    height: FIELD_SIZE.height,
  };
  const pond: Ellipse = { x: center.x + ringRadius + 120 + POND_SIZE.rx, y: center.y + 10, ...POND_SIZE };
  const granary: Rect = {
    x: center.x - GRANARY_SIZE.width / 2,
    y: center.y - GRANARY_SIZE.height / 2,
    ...GRANARY_SIZE,
  };
  const width = Math.ceil(pond.x + pond.rx + MARGIN);
  const height = Math.ceil(center.y + ringRadius + MARGIN);

  // Les maisons font le tour dans le sens des aiguilles d'une montre, en partant juste après la trouée de l'étang
  // (à l'est), jusqu'à la trouée du champ (au nord), puis de là jusqu'à l'étang. Chaque trouée prend la place de
  // EXIT_PLOTS maisons ; les maisons se répartissent sur les deux arcs selon leur longueur.
  const gapHalf = (Math.PI * EXIT_PLOTS) / slots;
  const fieldAngle = norm(EXIT_FIELD);
  const arcs = [
    { start: norm(EXIT_POND) + gapHalf, end: fieldAngle - gapHalf },
    { start: fieldAngle + gapHalf, end: 2 * Math.PI + norm(EXIT_POND) - gapHalf },
  ];
  const len0 = arcs[0]!.end - arcs[0]!.start;
  const len1 = arcs[1]!.end - arcs[1]!.start;
  const n0 = Math.round((n * len0) / (len0 + len1));
  const houseAngles: number[] = [];
  [n0, n - n0].forEach((count, k) => {
    const arc = arcs[k]!;
    const spacing = (arc.end - arc.start) / Math.max(1, count);
    for (let j = 0; j < count; j++) houseAngles.push(arc.start + spacing * (j + 0.5));
  });

  const map: VillageMap = {
    width,
    height,
    center,
    ringRadius,
    roadRadius,
    houseCount: n,
    houseAngles,
    granary,
    field,
    pond,
    exits: { field: EXIT_FIELD, pond: EXIT_POND },
    trees: [],
  };
  map.trees = plantTrees(map);
  return map;
}

/** Angle ramené dans [0, 2π[. */
function norm(a: number): number {
  const t = a % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}

export function polar(map: VillageMap, angle: number, radius: number): Point {
  return { x: map.center.x + radius * Math.cos(angle), y: map.center.y + radius * Math.sin(angle) };
}

/** Centre de la maison d'un emplacement. */
export function housePoint(map: VillageMap, home: number): Point {
  const angle = map.houseAngles[Math.min(Math.max(0, home), map.houseAngles.length - 1)] ?? 0;
  return polar(map, angle, map.ringRadius);
}

/** Le pas de la porte, côté chemin. */
export function doorPoint(map: VillageMap, home: number): Point {
  const angle = map.houseAngles[Math.min(Math.max(0, home), map.houseAngles.length - 1)] ?? 0;
  return polar(map, angle, map.ringRadius - 36);
}

export function houseRect(map: VillageMap, home: number): Rect {
  const p = housePoint(map, home);
  return { x: p.x - HOUSE_SIZE.width / 2, y: p.y - HOUSE_SIZE.height / 2, width: HOUSE_SIZE.width, height: HOUSE_SIZE.height };
}

const inRect = (p: Point, r: Rect, m = 0) => p.x >= r.x - m && p.x <= r.x + r.width + m && p.y >= r.y - m && p.y <= r.y + r.height + m;
const inEllipse = (p: Point, e: Ellipse, k = 1) => ((p.x - e.x) / (e.rx * k)) ** 2 + ((p.y - e.y) / (e.ry * k)) ** 2 <= 1;
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Le chemin vers le champ et celui vers l'étang : on n'y plante pas d'arbres. */
function onPaths(map: VillageMap, p: Point, m: number): boolean {
  const c = map.center;
  const toField = Math.abs(p.x - c.x) < 30 + m && p.y < c.y && p.y > map.field.y + map.field.height - 10;
  const toPond = Math.abs(p.y - c.y) < 30 + m && p.x > c.x && p.x < map.pond.x;
  return toField || toPond;
}

function plantTrees(map: VillageMap): Tree[] {
  const trees: Tree[] = [];
  const stepPx = 46;
  let i = 0;
  for (let y = 20; y < map.height - 10; y += stepPx) {
    for (let x = 20; x < map.width - 10; x += stepPx) {
      i++;
      const p = { x: x + (hash01(i, 31) - 0.5) * 34, y: y + (hash01(i, 32) - 0.5) * 34 };
      const fromCenter = dist(p, map.center);
      if (fromCenter < map.ringRadius + 70) continue;
      if (inRect(p, map.field, 50) || inEllipse(p, map.pond, 1.3) || onPaths(map, p, 20)) continue;
      // Plus dense loin du village : une clairière autour, la forêt au bord du monde.
      const edge = Math.min(p.x, p.y, map.width - p.x, map.height - p.y);
      const density = edge < 150 ? 0.95 : fromCenter < map.ringRadius + 200 ? 0.12 : 0.4;
      if (hash01(i, 33) > density) continue;
      trees.push({ ...p, size: hash01(i, 34) });
    }
  }
  return trees;
}

/** Vrai si un personnage centré en p ne peut pas s'y tenir. */
export function blocked(map: VillageMap, p: Point, r = BODY_RADIUS, occupied?: ReadonlySet<number>): boolean {
  if (p.x < r || p.y < r || p.x > map.width - r || p.y > map.height - r) return true;
  if (inRect(p, map.granary, r)) return true;
  if (inEllipse(p, { x: map.pond.x, y: map.pond.y, rx: map.pond.rx - 10 + r, ry: map.pond.ry - 10 + r })) return true;
  for (let h = 0; h < map.houseCount; h++) {
    if (occupied && !occupied.has(h)) continue;
    if (inRect(p, houseRect(map, h), r)) return true;
  }
  for (const t of map.trees) if (dist(p, t) < 9 + r) return true;
  return false;
}

/**
 * Déplace un personnage de (dx, dy) en glissant le long des obstacles. Renvoie la nouvelle position.
 * `occupied` : emplacements où une maison est bâtie (sinon toutes les maisons comptent).
 */
export function moveBody(map: VillageMap, from: Point, dx: number, dy: number, occupied?: ReadonlySet<number>): Point {
  const full = { x: from.x + dx, y: from.y + dy };
  if (!blocked(map, full, BODY_RADIUS, occupied)) return full;
  const xOnly = { x: from.x + dx, y: from.y };
  if (dx !== 0 && !blocked(map, xOnly, BODY_RADIUS, occupied)) return xOnly;
  const yOnly = { x: from.x, y: from.y + dy };
  if (dy !== 0 && !blocked(map, yOnly, BODY_RADIUS, occupied)) return yOnly;
  return from;
}

/** Les lieux où le joueur peut agir. */
export type Place = 'granary' | 'pond' | 'field' | 'home' | null;

/** Où se trouve le joueur, pour les gestes. `home` : l'emplacement de sa maison. */
export function placeAt(map: VillageMap, p: Point, home: number): Place {
  // Toute la place du grenier, là où les villageois se tiennent pour verser.
  if (((p.x - map.center.x) / 100) ** 2 + ((p.y - map.center.y - 10) / 80) ** 2 <= 1) return 'granary';
  if (inEllipse(p, { x: map.pond.x, y: map.pond.y, rx: map.pond.rx + 40, ry: map.pond.ry + 40 })) return 'pond';
  if (inRect(p, map.field, 6)) return 'field';
  if (dist(p, doorPoint(map, home)) < 34) return 'home';
  return null;
}

/** Points du chemin circulaire entre deux angles, par le plus court. */
export function roadArc(map: VillageMap, from: number, to: number): Point[] {
  let d = norm(to - from);
  if (d > Math.PI) d -= 2 * Math.PI;
  const steps = Math.max(1, Math.ceil(Math.abs(d) / 0.12));
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) out.push(polar(map, from + (d * i) / steps, map.roadRadius));
  return out;
}

/** Le point où le chemin du champ (ou de l'étang) sort de l'anneau. */
export function exitPoint(map: VillageMap, exit: 'field' | 'pond'): Point {
  return polar(map, map.exits[exit], map.ringRadius + 60);
}
