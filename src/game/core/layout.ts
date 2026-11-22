/**
 * Plan du village, en coordonnées du monde (le canevas est mis à l'échelle de l'écran).
 * Formes provisoires : le champ, le grenier, l'étang et des maisons.
 */
import type { Villager } from '../../sim';

export const WORLD = { width: 1200, height: 800 } as const;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export const FIELD: Rect = { x: 60, y: 60, width: 380, height: 250 };
export const GRANARY: Rect = { x: 550, y: 250, width: 100, height: 120 };
export const POND = { x: 950, y: 250, rx: 170, ry: 120 } as const;
/** Les maisons se rangent autour de ce point, les plus proches d'abord. */
const HOUSES_CENTER: Point = { x: 600, y: 520 };
const HOUSE_STEP = 34;
const MARGIN = 30;

const inflate = (r: Rect, m: number): Rect => ({ x: r.x - m, y: r.y - m, width: r.width + 2 * m, height: r.height + 2 * m });
const inside = (p: Point, r: Rect) => p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
const pondBox: Rect = { x: POND.x - POND.rx, y: POND.y - POND.ry, width: 2 * POND.rx, height: 2 * POND.ry };

/** Emplacements de maisons possibles, du plus proche au plus éloigné du centre du village. */
export const HOUSE_SLOTS: readonly Point[] = (() => {
  const blocked = [inflate(FIELD, MARGIN), inflate(GRANARY, MARGIN + 20), inflate(pondBox, MARGIN)];
  const slots: Point[] = [];
  for (let y = 40; y <= WORLD.height - 40; y += HOUSE_STEP) {
    for (let x = 40; x <= WORLD.width - 40; x += HOUSE_STEP) {
      const p = { x, y };
      if (!blocked.some((r) => inside(p, r))) slots.push(p);
    }
  }
  const d = (p: Point) => (p.x - HOUSES_CENTER.x) ** 2 + (p.y - HOUSES_CENTER.y) ** 2;
  return slots.sort((a, b) => d(a) - d(b) || a.y - b.y || a.x - b.x);
})();

/**
 * Qui habite où. Chaque adulte a sa maison ; un enfant vit chez son parent,
 * ou dans sa propre maison s'il est orphelin. Une maison libérée par un mort reste debout, vide :
 * c'est le signe visible d'une population qui baisse.
 */
export class Houses {
  /** Occupant de chaque emplacement déjà construit ; null = maison vide. */
  readonly owners: (number | null)[] = [];
  private readonly slotOf = new Map<number, number>();

  /** Met à jour l'attribution après une saison. Ordre déterministe : celui des villageois du moteur. */
  update(villagers: readonly Villager[], isAdult: (v: Villager) => boolean): void {
    const byId = new Map(villagers.map((v) => [v.id, v]));
    const needsOwnHouse = (v: Villager) => {
      if (isAdult(v)) return true;
      const parent = v.parentId === null ? undefined : byId.get(v.parentId);
      return parent === undefined;
    };
    for (const [id, slot] of this.slotOf) {
      const v = byId.get(id);
      if (!v || !needsOwnHouse(v)) {
        this.owners[slot] = null;
        this.slotOf.delete(id);
      }
    }
    for (const v of villagers) {
      if (!needsOwnHouse(v) || this.slotOf.has(v.id)) continue;
      let slot = this.owners.indexOf(null);
      if (slot === -1) {
        slot = this.owners.length;
        this.owners.push(null);
      }
      this.owners[slot] = v.id;
      this.slotOf.set(v.id, slot);
    }
  }

  /** Où vit ce villageois : sa maison, sinon celle de son parent. */
  homeOf(v: Villager): Point {
    const own = this.slotOf.get(v.id);
    const slot = own ?? (v.parentId === null ? undefined : this.slotOf.get(v.parentId));
    return slotPosition(slot ?? 0);
  }
}

export function slotPosition(slot: number): Point {
  const p = HOUSE_SLOTS[slot];
  if (p) return p;
  // Au-delà des emplacements prévus (n'arrive pas avec les réglages actuels) : on empile au bord.
  const last = HOUSE_SLOTS[HOUSE_SLOTS.length - 1] ?? HOUSES_CENTER;
  return { x: last.x, y: last.y };
}
