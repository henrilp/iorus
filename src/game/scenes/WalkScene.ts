/**
 * Le village où l'on se promène (fiche 0030). La scène lit la session, ne décide de rien et ne tire jamais dans
 * le hasard du moteur : elle dessine le plan, fait marcher les villageois selon leur journée, déplace le joueur
 * et dit à l'interface où il se trouve et à côté de qui.
 */
import * as Phaser from 'phaser';
import { tr } from '../../i18n';
import { isAdult } from '../../sim';
import { villagerName } from '../../vie/names';
import type { WalkSession } from '../core/walk';
import { atGranary, atPond, hasGiven, walkPose } from '../core/walkChoreo';
import {
  blocked,
  doorPoint,
  housePoint,
  moveBody,
  placeAt,
  polar,
  type Place,
  type Point,
  type VillageMap,
} from '../core/villageMap';
import { hash01 } from '../core/visualHash';
import { PALETTE, makeArt, villagerLook } from './art';

export interface WalkContext {
  place: Place;
  /** Le villageois le plus proche, à portée de parole. */
  near: number | null;
}

export interface WalkBridge {
  session: WalkSession;
  /** Vrai quand un panneau ou une carte est ouvert : le joueur ne bouge plus et le temps s'arrête. */
  busy(): boolean;
  onContext(ctx: WalkContext): void;
  /** Touche E (ou Espace) : parler, ou agir là où l'on est. */
  onInteract(): void;
  /** Une saison vient d'être calculée (ou un chapitre commence). */
  onSeason(): void;
  /** Clic sur un villageois. */
  onPick(id: number): void;
  /** À chaque image, pour la jauge de la saison. */
  onFrame(): void;
}

interface Body {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  head: Phaser.GameObjects.Image;
  hair: Phaser.GameObjects.Image;
  eye: Phaser.GameObjects.Image;
  mark: Phaser.GameObjects.Image;
  carried: Phaser.GameObjects.Image;
  rod: Phaser.GameObjects.Graphics;
  last: Point;
  facing: number;
}

const SPEED = 120; // pixels du monde par seconde
const TALK_RANGE = 34;
/** Largeur du monde visible à l'écran, en pixels du monde (le zoom s'en déduit). */
const ZOOM_WIDTH = 430;

export class WalkScene extends Phaser.Scene {
  private readonly bridge: WalkBridge;
  private map!: VillageMap;
  /** Tout le décor dessiné par `rebuild`, pour pouvoir le refaire. */
  private decor: Phaser.GameObjects.GameObject[] = [];
  private grass!: Phaser.GameObjects.TileSprite;
  private field!: Phaser.GameObjects.TileSprite;
  private pondGfx!: Phaser.GameObjects.Graphics;
  private trees: Phaser.GameObjects.Image[] = [];
  private flowers: Phaser.GameObjects.Image[] = [];
  private houses: Phaser.GameObjects.Image[] = [];
  private huts: Phaser.GameObjects.Image[] = [];
  private granaryPile: Phaser.GameObjects.Image[] = [];
  private granaryLabel!: Phaser.GameObjects.Text;
  private fish: Phaser.GameObjects.Ellipse[] = [];
  private night!: Phaser.GameObjects.Rectangle;
  private nameLabel!: Phaser.GameObjects.Text;
  private readonly bodies = new Map<number, Body>();
  private player!: Body;
  private playerPos: Point = { x: 0, y: 0 };
  private target: Point | null = null;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private context: WalkContext = { place: null, near: null };
  private seasonShown = -1;
  private chapterShown = -1;
  private mapShown: VillageMap | null = null;
  private floated = new Set<number>();
  private castUntil = 0;
  private minimap: Phaser.Cameras.Scene2D.Camera | null = null;
  private minimapDot!: Phaser.GameObjects.Arc;
  /** Ce que la petite carte ne montre pas (textes, nuit). */
  private hudOnly: Phaser.GameObjects.GameObject[] = [];

  constructor(bridge: WalkBridge) {
    super('walk');
    this.bridge = bridge;
  }

  create(): void {
    makeArt(this);
    this.cameras.main.setZoom(this.zoomFor(this.scale.width));
    this.cameras.main.setRoundPixels(true);
    this.scale.on('resize', (size: Phaser.Structs.Size) => {
      this.cameras.main.setZoom(this.zoomFor(size.width));
      this.night.setSize(size.width * 2, size.height * 2).setPosition(size.width / 2, size.height / 2);
      this.placeMinimap();
    });

    this.night = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 2, this.scale.height * 2, 0x0b1630, 0);
    this.night.setScrollFactor(0).setDepth(10_000);
    this.nameLabel = this.add
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#fffaf0', stroke: '#2b2420', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(9_000);
    this.hudOnly.push(this.night, this.nameLabel);
    // Sur la petite carte, le joueur est un point bien visible.
    this.minimapDot = this.add.circle(0, 0, 38, PALETTE.player).setStrokeStyle(14, 0xffffff).setDepth(9_800);
    this.cameras.main.ignore(this.minimapDot);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys('W,A,S,D,Z,Q,E,SPACE', false) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-SPACE', () => this.interact());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.bridge.busy()) return;
      if (over.length > 0) return;
      this.target = { x: pointer.worldX, y: pointer.worldY };
    });

    this.rebuild();
  }

  /** Assez près pour lire les personnages, assez loin pour voir autour de soi. */
  private zoomFor(width: number): number {
    return Math.max(1.6, Math.min(3, width / ZOOM_WIDTH));
  }

  /** Recrée le décor : au lancement, et quand de nouvelles maisons s'ajoutent à l'anneau. */
  private rebuild(): void {
    const session = this.bridge.session;
    this.map = session.map;
    this.mapShown = this.map;
    for (const o of [...this.decor, ...this.huts, ...this.granaryPile]) o.destroy();
    this.decor = [];
    this.trees = [];
    this.flowers = [];
    this.houses = [];
    this.huts = [];
    this.granaryPile = [];
    this.fish = [];
    for (const b of this.bodies.values()) b.root.destroy(true);
    this.bodies.clear();
    this.player?.root.destroy(true);

    const map = this.map;
    const season = session.seasonOfYear;
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    const existing = new Set(this.children.list);

    this.grass = this.add.tileSprite(0, 0, map.width, map.height, `grass-${season}`).setOrigin(0).setDepth(-100);
    const ground = this.add.graphics().setDepth(-90);
    this.drawGround(ground);

    this.field = this.add.tileSprite(map.field.x, map.field.y, map.field.width, map.field.height, `field-${season}`).setOrigin(0).setDepth(-80);
    const fence = this.add.graphics().setDepth(-79);
    fence.lineStyle(2, PALETTE.woodDark, 1).strokeRect(map.field.x - 3, map.field.y - 3, map.field.width + 6, map.field.height + 6);
    for (let x = map.field.x; x <= map.field.x + map.field.width; x += 16) {
      if (Math.abs(x - map.center.x) < 24) continue;
      this.add.image(x, map.field.y - 4, 'fence').setDepth(map.field.y - 4);
      this.add.image(x, map.field.y + map.field.height + 2, 'fence').setDepth(map.field.y + map.field.height + 2);
    }

    this.pondGfx = this.add.graphics().setDepth(-70);
    for (let i = 0; i < 18; i++) {
      const fish = this.add.ellipse(0, 0, 7, 3, PALETTE.fish, 0.55).setDepth(-69);
      this.fish.push(fish);
    }

    for (const t of map.trees) {
      const v = t.size < 0.35 ? 0 : t.size < 0.75 ? 1 : 2;
      const img = this.add.image(t.x, t.y, `tree-${season}-${v}`).setOrigin(0.5, 0.92);
      img.setDepth(t.y).setData('v', v);
      this.trees.push(img);
    }
    // Fleurs et cailloux sur la place et autour.
    for (let i = 0; i < 260; i++) {
      const a = 2 * Math.PI * hash01(i, 61);
      const r = map.roadRadius * Math.sqrt(hash01(i, 62)) * 0.92 + (hash01(i, 63) < 0.4 ? map.ringRadius * 0.55 : 0);
      const p = polar(map, a, r);
      if (((p.x - map.center.x) / 104) ** 2 + ((p.y - map.center.y - 10) / 80) ** 2 < 1) continue;
      const inField = p.x > map.field.x - 8 && p.x < map.field.x + map.field.width + 8 && p.y > map.field.y - 8 && p.y < map.field.y + map.field.height + 8;
      if (inField) continue;
      const rock = hash01(i, 64) < 0.08;
      const img = this.add.image(p.x, p.y, rock ? 'rock' : `flower-${season}`).setDepth(-60);
      if (!rock) this.flowers.push(img);
    }

    this.add.image(map.center.x, map.center.y + 4, 'granary').setOrigin(0.5, 0.92).setDepth(map.center.y + 4);
    this.add.image(map.center.x - 120, map.center.y + 70, 'well').setOrigin(0.5, 0.9).setDepth(map.center.y + 70);
    this.granaryLabel = this.add
      .text(map.center.x, map.granary.y - 18, '', { fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#fffaf0', stroke: '#2b2420', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(8_000);

    for (let h = 0; h < map.houseCount; h++) {
      const p = housePoint(map, h);
      const img = this.add.image(p.x, p.y + 10, 'house').setOrigin(0.5, 0.9).setDepth(p.y + 10);
      // En bas de l'anneau, la porte donne vers le chemin, donc au nord : on voit la maison de dos.
      img.setData('side', p.y > map.center.y + 40 ? '-back' : '');
      this.houses.push(img);
    }
    this.decor = this.children.list.filter((o) => !existing.has(o));
    this.hudOnly.push(this.granaryLabel);

    this.player = this.makeBody(session.playerId, true);
    this.placePlayerAtHome();
    this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
    this.syncHouses();
    this.seasonShown = -1;
    this.placeMinimap();
  }

  /** La petite carte, en bas à droite : tout le village, et où l'on est. Cachée sur les petits écrans. */
  private placeMinimap(): void {
    if (!this.map) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const show = w >= 720 && h >= 420;
    const size = Math.round(Math.min(190, w * 0.18));
    const height = Math.round((size * this.map.height) / this.map.width);
    if (!this.minimap) {
      this.minimap = this.cameras.add(0, 0, size, height, false, 'minimap');
      this.minimap.setBackgroundColor(0x1d2a1a);
    }
    const cam = this.minimap;
    cam.setVisible(show);
    cam.setViewport(w - size - 12, h - height - 12, size, height);
    cam.setZoom(size / this.map.width);
    cam.centerOn(this.map.width / 2, this.map.height / 2);
    this.hudOnly = this.hudOnly.filter((o) => o.scene);
    cam.ignore(this.hudOnly);
  }

  private drawGround(g: Phaser.GameObjects.Graphics): void {
    const map = this.map;
    const c = map.center;
    // Chemins vers le champ et l'étang.
    g.fillStyle(PALETTE.roadEdge, 1);
    g.fillRect(c.x - 15, map.field.y + map.field.height, 30, c.y - map.roadRadius - map.field.y - map.field.height + 10);
    g.fillRect(c.x + map.roadRadius - 10, c.y - 15, map.pond.x - map.pond.rx - c.x - map.roadRadius + 30, 30);
    g.fillStyle(PALETTE.road, 1);
    g.fillRect(c.x - 12, map.field.y + map.field.height, 24, c.y - map.roadRadius - map.field.y - map.field.height + 10);
    g.fillRect(c.x + map.roadRadius - 10, c.y - 12, map.pond.x - map.pond.rx - c.x - map.roadRadius + 30, 24);
    // Le chemin qui fait le tour du village.
    g.lineStyle(30, PALETTE.roadEdge, 1).strokeCircle(c.x, c.y, map.roadRadius);
    g.lineStyle(24, PALETTE.road, 1).strokeCircle(c.x, c.y, map.roadRadius);
    // La place du grenier.
    g.fillStyle(PALETTE.roadEdge, 1).fillEllipse(c.x, c.y + 10, 196, 150);
    g.fillStyle(PALETTE.road, 1).fillEllipse(c.x, c.y + 10, 188, 142);
    g.lineStyle(14, PALETTE.road, 1).lineBetween(c.x, c.y - 60, c.x, c.y - map.roadRadius);
    g.lineBetween(c.x + 90, c.y, c.x + map.roadRadius, c.y);
    // Chaque maison a son petit chemin jusqu'au grand.
    g.lineStyle(8, PALETTE.road, 1);
    for (let h = 0; h < map.houseCount; h++) {
      const d = doorPoint(map, h);
      const angle = Math.atan2(d.y - c.y, d.x - c.x);
      const r = polar(map, angle, map.roadRadius);
      g.lineBetween(d.x, d.y + 6, r.x, r.y);
    }
  }

  private makeBody(id: number, isPlayer: boolean): Body {
    const look = villagerLook(id);
    const body = this.add.image(0, 1, 'body-0').setOrigin(0.5, 1).setTint(isPlayer ? PALETTE.player : look.tunic);
    const head = this.add.image(0, 1, 'head').setOrigin(0.5, 1).setTint(look.skin);
    const hair = this.add.image(0, 1, 'hair').setOrigin(0.5, 1).setTint(look.hair);
    const eye = this.add.image(0, -27, 'eye').setVisible(false);
    const mark = this.add.image(isPlayer ? 0 : 8, isPlayer ? -30 : -24, isPlayer ? 'player-mark' : 'sanction-mark').setVisible(isPlayer);
    const carried = this.add.image(8, -9, 'sack').setVisible(false);
    const rod = this.add.graphics();
    const root = this.add.container(0, 0, [body, head, hair, carried, rod, eye, mark]);
    root.setSize(16, 24);
    if (!isPlayer) {
      root.setInteractive(new Phaser.Geom.Rectangle(-8, -23, 16, 24), Phaser.Geom.Rectangle.Contains);
      root.on('pointerdown', () => {
        if (!this.bridge.busy()) this.bridge.onPick(id);
      });
    }
    return { root, body, head, hair, eye, mark, carried, rod, last: { x: 0, y: 0 }, facing: 1 };
  }

  private placePlayerAtHome(): void {
    const s = this.bridge.session;
    // Un peu en avant de la porte, côté chemin, pour ne pas être caché derrière son parent.
    const d = doorPoint(this.map, s.homeOf(s.playerId));
    const a = Math.atan2(d.y - this.map.center.y, d.x - this.map.center.x);
    const front = { x: d.x - 12 * Math.cos(a) + 10, y: d.y - 12 * Math.sin(a) + 6 };
    this.playerPos = blocked(this.map, front) ? polar(this.map, a, this.map.roadRadius) : front;
    this.target = null;
    this.player.root.setPosition(this.playerPos.x, this.playerPos.y);
  }

  update(_time: number, delta: number): void {
    const session = this.bridge.session;
    if (session.map !== this.mapShown) this.rebuild();
    const busy = this.bridge.busy();
    const dt = Math.min(delta, 100);
    if (!busy && session.tick(dt)) this.bridge.onSeason();
    if (session.chapter !== this.chapterShown && session.phase === 'chapter') {
      this.chapterShown = session.chapter;
      this.placePlayerAtHome();
    }
    if (session.sim.state.season !== this.seasonShown) this.onNewSeason();
    if (!busy) this.movePlayer(dt);
    this.drawVillagers();
    this.drawPlayer(busy ? 0 : dt);
    this.drawTime();
    this.drawPond();
    this.updateContext();
    this.bridge.onFrame();
  }

  private onNewSeason(): void {
    const session = this.bridge.session;
    this.seasonShown = session.sim.state.season;
    const s = session.seasonOfYear;
    this.grass.setTexture(`grass-${s}`);
    this.field.setTexture(`field-${s}`);
    for (const t of this.trees) t.setTexture(`tree-${s}-${t.getData('v') as number}`);
    for (const f of this.flowers) f.setTexture(`flower-${s}`);
    this.floated.clear();
    this.syncHouses();
  }

  /** Maisons habitées, vides, et une petite maison de plus par adulte au-delà du premier. */
  private syncHouses(): void {
    const session = this.bridge.session;
    const params = session.p;
    const adultsByHome = new Map<number, number>();
    for (const v of session.sim.state.villagers) {
      if (!adultsByHome.has(v.home)) adultsByHome.set(v.home, 0);
      if (isAdult(v, params)) adultsByHome.set(v.home, adultsByHome.get(v.home)! + 1);
    }
    for (const h of this.huts) h.destroy();
    this.huts = [];
    this.houses.forEach((img, h) => {
      const lived = adultsByHome.has(h);
      img.setData('lived', lived);
      img.setTexture(`house${img.getData('side') as string}${lived ? '' : '-empty'}`);
      const extra = Math.min(2, Math.max(0, (adultsByHome.get(h) ?? 0) - 1));
      const p = housePoint(this.map, h);
      const angle = Math.atan2(p.y - this.map.center.y, p.x - this.map.center.x);
      for (let i = 0; i < extra; i++) {
        // Derrière la maison, côté extérieur de l'anneau.
        const side = i === 0 ? -1 : 1;
        const q = polar(this.map, angle + side * 0.035, this.map.ringRadius + 26);
        this.huts.push(this.add.image(q.x, q.y + 8, 'hut').setOrigin(0.5, 0.9).setDepth(q.y + 8));
      }
    });
  }

  private movePlayer(dt: number): void {
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || k.A!.isDown || k.Q!.isDown) dx -= 1;
    if (this.cursors.right.isDown || k.D!.isDown) dx += 1;
    if (this.cursors.up.isDown || k.W!.isDown || k.Z!.isDown) dy -= 1;
    if (this.cursors.down.isDown || k.S!.isDown) dy += 1;
    if (dx !== 0 || dy !== 0) this.target = null;
    else if (this.target) {
      const tx = this.target.x - this.playerPos.x;
      const ty = this.target.y - this.playerPos.y;
      const d = Math.hypot(tx, ty);
      if (d < 3) this.target = null;
      else {
        dx = tx / d;
        dy = ty / d;
      }
    }
    if (dx === 0 && dy === 0) return;
    const len = Math.hypot(dx, dy);
    const step = (SPEED * dt) / 1000;
    const occupied = new Set(this.houses.map((_, h) => h));
    const next = moveBody(this.map, this.playerPos, (dx / len) * step, (dy / len) * step, occupied);
    if (next.x === this.playerPos.x && next.y === this.playerPos.y) this.target = null;
    this.playerPos = next;
  }

  private animate(b: Body, x: number, y: number, moving: boolean, phase: number, working = false): void {
    const dx = x - b.last.x;
    if (Math.abs(dx) > 0.05) b.facing = dx < 0 ? -1 : 1;
    b.last = { x, y };
    b.root.setPosition(Math.round(x), Math.round(y));
    b.root.setDepth(y);
    const frame = moving && Math.floor(phase / 140) % 2 === 1 ? 1 : 0;
    b.body.setTexture(`body-${frame}`).setFlipX(b.facing < 0);
    // En marchant, la tête monte d'un pixel une image sur deux ; au champ, elle se penche de temps en temps.
    const bob = moving && frame === 1 ? -1 : working && Math.floor(phase / 600) % 3 === 0 ? 2 : 0;
    b.head.setY(1 + bob);
    b.hair.setY(1 + bob);
    b.hair.setFlipX(b.facing < 0);
  }

  private drawVillagers(): void {
    const session = this.bridge.session;
    const state = session.sim.state;
    const params = state.params;
    const t = session.progress;
    const live = new Set<number>();
    const observed = new Set(session.observed().map((v) => v.id));
    const now = this.time.now;
    for (const v of state.villagers) {
      if (v.id === session.playerId) continue;
      live.add(v.id);
      let b = this.bodies.get(v.id);
      if (!b) {
        b = this.makeBody(v.id, false);
        this.bodies.set(v.id, b);
      }
      const adult = isAdult(v, params);
      const pose = walkPose(this.map, v.home, v.id, adult, t);
      b.root.setScale(adult ? 1 : 0.75);
      this.animate(b, pose.x, pose.y, pose.moving, now + v.id * 37, pose.working);
      b.eye.setVisible(observed.has(v.id));
      b.mark.setVisible(v.last.sanctionsReceived + v.last.pondSanctionsReceived > 0);
      const f = session.forecastOf(v.id);
      const carrying = adult && !!f && f.harvest > 0 && t > 0.3 && !hasGiven(v.id, t);
      b.carried.setVisible(carrying);
      this.drawRod(b, adult && atPond(v.id, t) && (f?.effort ?? 0) > 0.05, now + v.id * 91);
      if (adult && f && atGranary(v.id, t) && !this.floated.has(v.id)) {
        this.floated.add(v.id);
        this.floatText(pose.x, pose.y - 26, `${Math.round(f.contributed)}/${Math.round(f.harvest)}`);
      }
    }
    for (const [id, b] of this.bodies) {
      if (live.has(id)) continue;
      b.root.destroy(true);
      this.bodies.delete(id);
    }
    this.drawGranaryPile(t);
  }

  private drawRod(b: Body, fishing: boolean, phase: number): void {
    b.rod.clear();
    if (!fishing) return;
    const dir = b.facing;
    const bob = Math.sin(phase / 300) * 1.5;
    b.rod.lineStyle(1, PALETTE.woodDark, 1).lineBetween(4 * dir, -10, 14 * dir, -20);
    b.rod.lineStyle(1, 0xf4f0e0, 0.7).lineBetween(14 * dir, -20, 20 * dir, -6 + bob);
  }

  private drawPlayer(dt: number): void {
    const p = this.playerPos;
    this.minimapDot?.setPosition(p.x, p.y);
    // Après la mort, on regarde le village sans y être.
    const alive = !!this.bridge.session.player;
    this.player.root.setVisible(alive);
    this.minimapDot?.setVisible(alive);
    const moving = dt > 0 && (Math.abs(p.x - this.player.last.x) > 0.01 || Math.abs(p.y - this.player.last.y) > 0.01);
    this.animate(this.player, p.x, p.y, moving, this.time.now);
    const session = this.bridge.session;
    const adult = session.playerAdult;
    this.player.root.setScale(adult ? 1 : 0.85);
    this.player.mark.setY(-30 + Math.sin(this.time.now / 250));
    const carrying = session.given === null && session.sacks > 0 && session.progress > 0.2;
    this.player.carried.setVisible(carrying);
    this.drawRod(this.player, this.time.now < this.castUntil, this.time.now);
  }

  /**
   * Les sacs versés cette saison, en deux tas de part et d'autre de la porte du grenier. Au-delà de 20 sacs,
   * un sac dessiné en vaut plusieurs ; le nombre exact est écrit sur le toit.
   */
  private drawGranaryPile(t: number): void {
    const session = this.bridge.session;
    let sacks = 0;
    for (const v of session.adults()) {
      if (v.id === session.playerId) continue;
      const f = session.forecastOf(v.id);
      if (f && hasGiven(v.id, t)) sacks += f.contributed;
    }
    sacks += session.given ?? 0;
    const n = Math.round(sacks);
    const shown = n <= 20 ? n : Math.min(20, 10 + Math.round((n - 10) / 4));
    if (this.granaryPile.length !== shown) {
      for (const s of this.granaryPile) s.destroy();
      this.granaryPile = [];
      const base = this.map.granary.y + this.map.granary.height + 2;
      for (let i = 0; i < shown; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const k = Math.floor(i / 2);
        // Une pyramide de 4, 3, 2 et 1 sacs de chaque côté.
        const row = k < 4 ? 0 : k < 7 ? 1 : k < 9 ? 2 : 3;
        const first = [0, 4, 7, 9][row]!;
        const count = [4, 3, 2, 1][row]!;
        const col = k - first;
        const x = this.map.center.x + side * (24 + (col - (count - 1) / 2) * 7);
        const y = base - row * 5;
        this.granaryPile.push(this.add.image(x, y, 'sack').setOrigin(0.5, 1).setDepth(base - 1 + row * 0.01));
      }
    }
    this.granaryLabel.setText(n > 0 ? String(n) : '');
  }

  private floatText(x: number, y: number, text: string): void {
    const cam = this.cameras.main;
    if (!cam.worldView.contains(x, y)) return;
    const label = this.add
      .text(x, y, text, { fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#f6d77a', stroke: '#2b2420', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(9_500);
    this.minimap?.ignore(label);
    this.tweens.add({ targets: label, y: y - 14, alpha: 0, duration: 2600, ease: 'Sine.easeOut', onComplete: () => label.destroy() });
  }

  /** Le jour qui passe : l'aube, la journée, le soir, la nuit ; les fenêtres s'allument. */
  private drawTime(): void {
    const t = this.bridge.session.progress;
    let alpha = 0;
    let color = 0x0b1630;
    if (t < 0.05) alpha = 0.35 * (1 - t / 0.05);
    else if (t > 0.8 && t <= 0.9) {
      alpha = 0.25 * ((t - 0.8) / 0.1);
      color = 0x5a2a20;
    } else if (t > 0.9) alpha = 0.25 + 0.2 * ((t - 0.9) / 0.1);
    this.night.setFillStyle(color, alpha);
    const lit = t > 0.86 || t < 0.04;
    for (const h of this.houses) if (h.getData('lived')) h.setTexture(`house${h.getData('side') as string}${lit ? '-lit' : ''}`);
  }

  private drawPond(): void {
    const session = this.bridge.session;
    const map = this.map;
    const level = session.pondBefore + (session.pondNow - session.pondBefore) * Math.min(1, session.progress * 4);
    const g = this.pondGfx;
    const e = map.pond;
    const low = Phaser.Display.Color.ValueToColor(PALETTE.waterLow);
    const full = Phaser.Display.Color.ValueToColor(PALETTE.water);
    const mix = Phaser.Display.Color.Interpolate.ColorWithColor(low, full, 100, Math.round(100 * Math.max(0, Math.min(1, level))));
    const water = Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b);
    g.clear();
    g.fillStyle(PALETTE.roadEdge, 1).fillEllipse(e.x, e.y, e.rx * 2 + 16, e.ry * 2 + 14);
    g.fillStyle(PALETTE.road, 1).fillEllipse(e.x, e.y, e.rx * 2 + 8, e.ry * 2 + 6);
    g.fillStyle(water, 1).fillEllipse(e.x, e.y, e.rx * 2, e.ry * 2);
    g.fillStyle(PALETTE.waterDeep, 0.35).fillEllipse(e.x + 10, e.y + 8, e.rx * 1.3, e.ry * 1.2);
    // Reflets qui bougent doucement.
    const now = this.time.now / 1000;
    for (let i = 0; i < 9; i++) {
      const a = 2 * Math.PI * hash01(i, 71);
      const r = 0.7 * Math.sqrt(hash01(i, 72));
      const x = e.x + e.rx * r * Math.cos(a) + Math.sin(now * 0.6 + i) * 6;
      const y = e.y + e.ry * r * Math.sin(a);
      g.fillStyle(PALETTE.waterLight, 0.35).fillRect(Math.round(x), Math.round(y), 10 + (i % 3) * 4, 1);
    }
    // Poissons : autant d'ombres que de poissons dans l'étang.
    const visible = Math.round(level * this.fish.length);
    this.fish.forEach((f, i) => {
      const a = 2 * Math.PI * hash01(i, 21) + now * (0.08 + 0.06 * hash01(i, 23));
      const r = 0.25 + 0.5 * hash01(i, 22);
      f.setPosition(e.x + e.rx * r * Math.cos(a), e.y + e.ry * r * Math.sin(a));
      f.setRotation(a + Math.PI / 2);
      f.setVisible(i < visible);
    });
  }

  private updateContext(): void {
    const session = this.bridge.session;
    const p = this.playerPos;
    let near: number | null = null;
    let best = TALK_RANGE;
    for (const [id, b] of this.bodies) {
      const d = Math.hypot(b.root.x - p.x, b.root.y - p.y);
      if (d < best) {
        best = d;
        near = id;
      }
    }
    const place = placeAt(this.map, p, session.homeOf(session.playerId));
    if (near !== null) {
      const b = this.bodies.get(near)!;
      const v = session.byId(near);
      const rel = v ? session.relation(v) : null;
      const label = rel ? tr(rel.key, rel.vars) : villagerName(near);
      this.nameLabel.setText(label).setPosition(b.root.x, b.root.y - (b.eye.visible ? 33 : 26)).setVisible(true);
    } else this.nameLabel.setVisible(false);
    if (near !== this.context.near || place !== this.context.place) {
      this.context = { place, near };
      this.bridge.onContext(this.context);
    }
  }

  private interact(): void {
    if (this.bridge.busy()) return;
    this.bridge.onInteract();
  }

  get currentContext(): WalkContext {
    return this.context;
  }

  // --- Animations demandées par l'interface ---

  /** Le joueur dépose n sacs au grenier. */
  animateGive(n: number): void {
    const from = this.playerPos;
    for (let i = 0; i < n; i++) {
      const s = this.add.image(from.x, from.y - 12, 'sack').setDepth(9_000);
      this.tweens.add({
        targets: s,
        x: this.map.center.x + (hash01(i, 81) - 0.5) * 30,
        y: this.map.granary.y + this.map.granary.height + 8,
        duration: 380,
        delay: i * 90,
        ease: 'Quad.easeIn',
        onComplete: () => s.destroy(),
      });
    }
  }

  /** Le joueur lance sa ligne une fois. */
  animateCast(): void {
    this.castUntil = this.time.now + 900;
    const dir = this.player.facing;
    const bob = this.add.image(this.playerPos.x + 22 * dir, this.playerPos.y - 4, 'bobber').setDepth(this.playerPos.y);
    this.tweens.add({ targets: bob, y: bob.y + 2, yoyo: true, repeat: 2, duration: 150, onComplete: () => bob.destroy() });
  }

  /** Va vers un villageois (clic sur lui alors qu'il est loin). */
  walkTo(id: number): void {
    const b = this.bodies.get(id);
    if (b) this.target = { x: b.root.x, y: b.root.y + 6 };
  }

  distanceTo(id: number): number {
    const b = this.bodies.get(id);
    return b ? Math.hypot(b.root.x - this.playerPos.x, b.root.y - this.playerPos.y) : Infinity;
  }
}
