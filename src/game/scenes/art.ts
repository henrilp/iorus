/**
 * Les graphismes du village à pied, dessinés au lancement (aucune image à charger) : de petites formes en pixels,
 * propres à ce jeu. Chaque texture est dessinée une fois puis réutilisée.
 *
 * Les variations (teintes des habits, place des fleurs) viennent de `hash01`, jamais du hasard du moteur.
 */
import * as Phaser from 'phaser';
import { hash01 } from '../core/visualHash';

export const SEASON_COUNT = 4;

/** Couleurs du village, par saison quand elles changent (printemps, été, automne, hiver). */
export const PALETTE = {
  grass: [0x79ad5f, 0x93b153, 0xae9a52, 0xdfe6e6],
  grassDark: [0x5f9449, 0x7d9a40, 0x957f3e, 0xc4ced0],
  grassLight: [0x98c87a, 0xb0c96b, 0xc8b46a, 0xf4f8f8],
  flower: [0xf2e9a0, 0xf6c0c8, 0xe58f4f, 0xffffff],
  leaves: [0x3f7d3a, 0x4d7f2f, 0xc0672b, 0x8a9a8c],
  leavesLight: [0x5b9c4a, 0x6b9a3a, 0xdc8a3a, 0xf2f6f6],
  crops: [0x6aa84f, 0xd9b44a, 0x9a6a33, 0xcfd6d4],
  soil: 0x7a5a3a,
  soilDark: 0x5e4329,
  road: 0xc2a074,
  roadEdge: 0x9e7e55,
  wall: 0xe0bf92,
  wallShade: 0xc39f72,
  timber: 0x6b4a30,
  roof: 0x9a4b36,
  roofDark: 0x6e3326,
  door: 0x5a3a24,
  window: 0x2f3b46,
  windowLit: 0xf6d77a,
  stone: 0x8d8a82,
  stoneDark: 0x6c6962,
  wood: 0x8a6440,
  woodDark: 0x5e4129,
  grain: 0xe8c860,
  sack: 0xd8c08a,
  sackDark: 0xa98f5c,
  water: 0x3b7cc0,
  waterDeep: 0x2d5f9a,
  waterLow: 0x7d7752,
  waterLight: 0x8cc4ec,
  fish: 0x1f3f63,
  outline: 0x2b2420,
  skin: [0xf1c9a5, 0xd9a07a, 0xae7451, 0x7a4e33],
  hair: [0x2b2420, 0x6b4a30, 0xb88a4a, 0xd8d0c0, 0x8a3b26],
  tunic: [0x4f6d8f, 0x8f5a4f, 0x5f8a5a, 0x9a7d3a, 0x6f5a8a, 0x3f7d7d, 0xa0603a, 0x7a7a6a],
  player: 0xd4553a,
  mark: 0xd8432f,
  eye: 0xffffff,
} as const;

type G = Phaser.GameObjects.Graphics;

function px(g: G, color: number, x: number, y: number, w = 1, h = 1, alpha = 1): void {
  g.fillStyle(color, alpha).fillRect(x, y, w, h);
}

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Toutes les textures du village. */
export function makeArt(scene: Phaser.Scene): void {
  for (let s = 0; s < SEASON_COUNT; s++) {
    grassTile(scene, s);
    for (let v = 0; v < 3; v++) tree(scene, s, v);
    fieldTile(scene, s);
  }
  for (const side of ['', '-back']) {
    house(scene, `house${side}`, false, false, side !== '');
    house(scene, `house${side}-lit`, true, false, side !== '');
    house(scene, `house${side}-empty`, false, true, side !== '');
  }
  hut(scene);
  granary(scene);
  sack(scene);
  person(scene);
  marks(scene);
  decor(scene);
}

function grassTile(scene: Phaser.Scene, s: number): void {
  make(scene, `grass-${s}`, 64, 64, (g) => {
    px(g, PALETTE.grass[s]!, 0, 0, 64, 64);
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(hash01(i, 101) * 64);
      const y = Math.floor(hash01(i, 102) * 64);
      const c = hash01(i, 103) < 0.5 ? PALETTE.grassDark[s]! : PALETTE.grassLight[s]!;
      px(g, c, x, y, 1, hash01(i, 104) < 0.4 ? 2 : 1);
    }
  });
}

function fieldTile(scene: Phaser.Scene, s: number): void {
  // Un sillon de 16 px : terre, puis une rangée de plants qui changent avec la saison.
  make(scene, `field-${s}`, 16, 16, (g) => {
    px(g, PALETTE.soil, 0, 0, 16, 16);
    px(g, PALETTE.soilDark, 0, 11, 16, 2);
    const crop = PALETTE.crops[s]!;
    if (s === 3) {
      // Hiver : terre gelée, quelques chaumes.
      for (let x = 1; x < 16; x += 4) px(g, crop, x, 4, 1, 3);
      return;
    }
    const tall = s === 1 ? 7 : s === 0 ? 4 : 5;
    for (let x = 1; x < 16; x += 3) {
      px(g, crop, x, 9 - tall, 2, tall);
      px(g, PALETTE.outline, x, 9, 2, 1, 0.25);
      if (s === 1) px(g, 0xf0d870, x, 9 - tall, 2, 2);
    }
  });
}

function tree(scene: Phaser.Scene, s: number, v: number): void {
  const size = [22, 28, 34][v]!;
  make(scene, `tree-${s}-${v}`, size + 4, size + 12, (g) => {
    const cx = (size + 4) / 2;
    // Ombre, tronc, puis feuillage en couches.
    g.fillStyle(0x000000, 0.18).fillEllipse(cx, size + 8, size * 0.8, 6);
    px(g, PALETTE.woodDark, cx - 2, size * 0.55, 4, size * 0.5);
    if (s === 3 && v === 0) {
      // Un arbre nu en hiver.
      px(g, PALETTE.woodDark, cx - 6, size * 0.35, 2, 8);
      px(g, PALETTE.woodDark, cx + 4, size * 0.3, 2, 9);
      px(g, PALETTE.woodDark, cx - 1, size * 0.15, 2, 12);
      return;
    }
    const dark = PALETTE.leaves[s]!;
    const light = PALETTE.leavesLight[s]!;
    g.fillStyle(PALETTE.outline, 0.35).fillCircle(cx, size * 0.45 + 1, size * 0.46);
    g.fillStyle(dark, 1).fillCircle(cx, size * 0.45, size * 0.45);
    g.fillStyle(light, 1).fillCircle(cx - size * 0.12, size * 0.36, size * 0.26);
    g.fillStyle(dark, 1).fillCircle(cx + size * 0.18, size * 0.52, size * 0.2);
    if (s === 3) g.fillStyle(0xffffff, 0.9).fillEllipse(cx - 2, size * 0.2, size * 0.6, size * 0.18);
  });
}

/** Une maison vue de face (porte au sud) ou de dos (pour celles du bas de l'anneau, dont la porte donne au nord). */
function house(scene: Phaser.Scene, key: string, lit: boolean, empty: boolean, back = false): void {
  make(scene, key, 44, 44, (g) => {
    const a = empty ? 0.55 : 1;
    g.fillStyle(0x000000, 0.2).fillEllipse(22, 40, 40, 7);
    // Murs.
    px(g, PALETTE.outline, 4, 17, 36, 23, a);
    px(g, PALETTE.wall, 5, 18, 34, 21, a);
    px(g, PALETTE.wallShade, 5, 33, 34, 6, a);
    px(g, PALETTE.timber, 5, 24, 34, 1, a);
    px(g, PALETTE.timber, 12, 18, 1, 21, a);
    px(g, PALETTE.timber, 31, 18, 1, 21, a);
    // Porte et fenêtre (de dos : une seconde fenêtre à la place de la porte).
    if (back) {
      px(g, PALETTE.outline, 15, 26, 7, 6, a);
      px(g, lit ? PALETTE.windowLit : PALETTE.window, 16, 27, 5, 4, a);
      px(g, PALETTE.outline, 18, 27, 1, 4, a);
    } else {
      px(g, PALETTE.door, 18, 27, 8, 12, a);
      px(g, PALETTE.outline, 18, 27, 8, 1, a);
      px(g, 0xd8b060, 24, 33, 1, 1, a);
    }
    px(g, PALETTE.outline, 31, 26, 7, 6, a);
    px(g, lit ? PALETTE.windowLit : PALETTE.window, 32, 27, 5, 4, a);
    px(g, PALETTE.outline, 34, 27, 1, 4, a);
    // Toit.
    const roof = empty ? 0x7a7068 : PALETTE.roof;
    const roofDark = empty ? 0x5a524c : PALETTE.roofDark;
    g.fillStyle(PALETTE.outline, a).fillTriangle(0, 19, 44, 19, 22, 1);
    g.fillStyle(roof, a).fillTriangle(3, 18, 41, 18, 22, 3);
    for (let y = 8; y < 18; y += 3) px(g, roofDark, 22 - (y - 3) * 1.15, y, (y - 3) * 2.3, 1, a);
    if (empty) {
      // Toit percé : la maison n'est plus habitée.
      px(g, PALETTE.outline, 14, 10, 6, 4, 0.8);
      px(g, PALETTE.outline, 26, 13, 4, 3, 0.8);
    } else {
      px(g, PALETTE.stoneDark, 30, 4, 4, 8);
      px(g, PALETTE.stone, 30, 4, 4, 2);
    }
  });
}

function hut(scene: Phaser.Scene): void {
  make(scene, 'hut', 26, 28, (g) => {
    g.fillStyle(0x000000, 0.2).fillEllipse(13, 25, 24, 5);
    px(g, PALETTE.outline, 3, 12, 20, 13);
    px(g, PALETTE.wall, 4, 13, 18, 11);
    px(g, PALETTE.wallShade, 4, 20, 18, 4);
    px(g, PALETTE.door, 10, 17, 6, 7);
    g.fillStyle(PALETTE.outline, 1).fillTriangle(0, 14, 26, 14, 13, 1);
    g.fillStyle(PALETTE.roof, 1).fillTriangle(2, 13, 24, 13, 13, 3);
  });
}

function granary(scene: Phaser.Scene): void {
  make(scene, 'granary', 84, 84, (g) => {
    g.fillStyle(0x000000, 0.22).fillEllipse(42, 79, 80, 10);
    // Socle de pierre.
    px(g, PALETTE.outline, 5, 62, 74, 16);
    for (let x = 6; x < 78; x += 9) {
      px(g, PALETTE.stone, x, 63, 8, 6);
      px(g, PALETTE.stoneDark, x + 4, 70, 8, 7);
    }
    // Murs de planches.
    px(g, PALETTE.outline, 8, 30, 68, 33);
    px(g, PALETTE.wood, 9, 31, 66, 31);
    for (let x = 9; x < 75; x += 6) px(g, PALETTE.woodDark, x, 31, 1, 31);
    // Grande porte.
    px(g, PALETTE.outline, 30, 38, 24, 25);
    px(g, PALETTE.woodDark, 31, 39, 22, 24);
    g.lineStyle(2, PALETTE.wood, 1).lineBetween(31, 39, 53, 62).lineBetween(53, 39, 31, 62);
    // Toit.
    g.fillStyle(PALETTE.outline, 1).fillTriangle(0, 33, 84, 33, 42, 2);
    g.fillStyle(PALETTE.roof, 1).fillTriangle(4, 31, 80, 31, 42, 5);
    for (let y = 12; y < 31; y += 4) px(g, PALETTE.roofDark, 42 - (y - 5) * 1.45, y, (y - 5) * 2.9, 1);
    // Lucarne et gerbe.
    px(g, PALETTE.outline, 36, 16, 12, 10);
    px(g, PALETTE.grain, 37, 17, 10, 8);
    px(g, PALETTE.woodDark, 41, 17, 2, 8);
  });
}

function sack(scene: Phaser.Scene): void {
  make(scene, 'sack', 9, 10, (g) => {
    px(g, PALETTE.outline, 1, 2, 7, 8);
    px(g, PALETTE.sack, 2, 3, 5, 6);
    px(g, PALETTE.sackDark, 2, 7, 5, 2);
    px(g, PALETTE.outline, 3, 0, 3, 2);
    px(g, PALETTE.sackDark, 4, 1, 1, 2);
  });
}

/**
 * Un villageois en trois couches teintables (corps, tête, cheveux), avec deux images de marche.
 * Les trois couches ont la même taille (16 × 24) et la même origine : on les superpose telles quelles.
 * Elles sont en gris clair, cernées de sombre : la teinte de chaque villageois les colore.
 */
function person(scene: Phaser.Scene): void {
  const line = 0x303030;
  for (let f = 0; f < 2; f++) {
    make(scene, `body-${f}`, 16, 24, (g) => {
      g.fillStyle(0x000000, 0.25).fillEllipse(8, 22.5, 12, 3);
      // Jambes : l'une avance quand l'autre recule.
      const l = f === 0 ? 0 : 1;
      px(g, line, 4, 18, 4, 5 - l);
      px(g, line, 8, 18, 4, 4 + l);
      px(g, 0x8a8a8a, 5, 18, 2, 4 - l);
      px(g, 0x8a8a8a, 9, 18, 2, 3 + l);
      // Tunique, ceinture, bras.
      px(g, line, 3, 10, 10, 10);
      px(g, 0xffffff, 4, 11, 8, 8);
      px(g, 0xc8c8c8, 4, 16, 8, 1);
      px(g, 0xdedede, 4, 17, 8, 2);
      px(g, line, 1, 11 + l, 3, 6);
      px(g, 0xe8e8e8, 2, 12 + l, 1, 4);
      px(g, line, 12, 12 - l, 3, 6);
      px(g, 0xe8e8e8, 13, 13 - l, 1, 4);
    });
  }
  make(scene, 'head', 16, 24, (g) => {
    px(g, line, 4, 3, 8, 8);
    px(g, 0xffffff, 5, 4, 6, 6);
    px(g, 0xe6e6e6, 5, 9, 6, 1);
    px(g, 0x2b2420, 6, 6, 1, 2);
    px(g, 0x2b2420, 9, 6, 1, 2);
  });
  make(scene, 'hair', 16, 24, (g) => {
    px(g, line, 4, 2, 8, 3);
    px(g, 0xffffff, 5, 3, 6, 2);
    px(g, 0xffffff, 4, 4, 1, 3);
    px(g, 0xffffff, 11, 4, 1, 2);
  });
}

function marks(scene: Phaser.Scene): void {
  // Le repère du joueur.
  make(scene, 'player-mark', 9, 7, (g) => {
    g.fillStyle(PALETTE.outline, 1).fillTriangle(0, 0, 9, 0, 4.5, 7);
    g.fillStyle(0xf6d77a, 1).fillTriangle(1.5, 1, 7.5, 1, 4.5, 5);
  });
  // La marque d'une sanction reçue.
  make(scene, 'sanction-mark', 7, 11, (g) => {
    px(g, PALETTE.outline, 1, 0, 5, 11);
    px(g, PALETTE.mark, 2, 1, 3, 6);
    px(g, PALETTE.mark, 2, 8, 3, 2);
  });
  // Un œil : un voisin que le joueur observe.
  make(scene, 'eye', 11, 7, (g) => {
    g.fillStyle(PALETTE.outline, 1).fillEllipse(5.5, 3.5, 11, 7);
    g.fillStyle(PALETTE.eye, 1).fillEllipse(5.5, 3.5, 9, 5);
    g.fillStyle(0x3b6ea0, 1).fillCircle(5.5, 3.5, 2);
    px(g, PALETTE.outline, 5, 3, 1, 1);
  });
  // Une ligne lancée à l'étang.
  make(scene, 'bobber', 5, 5, (g) => {
    g.fillStyle(0xffffff, 1).fillCircle(2.5, 2.5, 2.5);
    g.fillStyle(PALETTE.mark, 1).fillRect(0, 0, 5, 2.5);
  });
}

function decor(scene: Phaser.Scene): void {
  for (let s = 0; s < SEASON_COUNT; s++) {
    make(scene, `flower-${s}`, 5, 5, (g) => {
      if (s === 3) {
        px(g, 0xb8c4c6, 1, 3, 3, 1);
        return;
      }
      px(g, PALETTE.leaves[s]!, 2, 2, 1, 3);
      px(g, PALETTE.flower[s]!, 1, 0, 3, 2);
      px(g, 0xfff4c0, 2, 1, 1, 1);
    });
  }
  make(scene, 'rock', 10, 7, (g) => {
    g.fillStyle(PALETTE.outline, 1).fillEllipse(5, 4, 10, 6);
    g.fillStyle(PALETTE.stone, 1).fillEllipse(5, 3.5, 8, 4.5);
    px(g, 0xb0aca2, 3, 2, 2, 1);
  });
  make(scene, 'fence', 16, 10, (g) => {
    px(g, PALETTE.woodDark, 1, 1, 3, 9);
    px(g, PALETTE.woodDark, 12, 1, 3, 9);
    px(g, PALETTE.wood, 0, 3, 16, 2);
    px(g, PALETTE.wood, 0, 7, 16, 2);
  });
  make(scene, 'well', 22, 24, (g) => {
    g.fillStyle(0x000000, 0.2).fillEllipse(11, 21, 20, 5);
    px(g, PALETTE.outline, 2, 11, 18, 10);
    px(g, PALETTE.stone, 3, 12, 16, 8);
    px(g, PALETTE.stoneDark, 3, 16, 16, 1);
    px(g, PALETTE.waterDeep, 5, 12, 12, 3);
    px(g, PALETTE.woodDark, 3, 2, 2, 10);
    px(g, PALETTE.woodDark, 17, 2, 2, 10);
    px(g, PALETTE.roof, 1, 0, 20, 3);
  });
}

/** Teintes d'un villageois, tirées de son identifiant. */
export function villagerLook(id: number): { tunic: number; skin: number; hair: number } {
  const pick = <T,>(list: readonly T[], salt: number) => list[Math.floor(hash01(id, salt) * list.length)]!;
  return { tunic: pick(PALETTE.tunic, 41), skin: pick(PALETTE.skin, 42), hair: pick(PALETTE.hair, 43) };
}
