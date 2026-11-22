/**
 * Le village, en formes provisoires. La scène lit le moteur à travers la session,
 * ne le modifie jamais, et ne fait que dessiner ce que la chorégraphie lui dit.
 */
import * as Phaser from 'phaser';
import { isAdult, type Villager } from '../../sim';
import { GRANARY_WINDOW, POND_WINDOW, SANCTION_WINDOW, levelAt, positionAt } from '../core/choreography';
import { NO_WALK_SPEED } from '../core/display';
import { FIELD, GRANARY, Houses, POND, WORLD, slotPosition } from '../core/layout';
import type { GameSession, SeasonRecord } from '../core/session';
import { hash01 } from '../core/visualHash';

export interface VillageBridge {
  session: GameSession;
  /** Villageois dont la fiche est ouverte. */
  selected: number | null;
  /** Appelé à chaque image où au moins une saison a été calculée. */
  onSeasons(records: SeasonRecord[]): void;
  onSelect(id: number): void;
}

const COLORS = {
  ground: [0x86b36b, 0x9fb35c, 0xae9255, 0xc7d0cf],
  crops: [0x5f9a3c, 0xd2b04a, 0x9a6a33, 0xb9c2c0],
  soil: 0x7a5a3a,
  house: 0xd9b48a,
  roof: 0x8f4a37,
  emptyHouse: 0x9a8f80,
  granary: 0x8a6a4a,
  grain: 0xe8c860,
  waterFull: 0x3b7cc0,
  waterEmpty: 0x7d7752,
  fish: 0xf0f4f8,
  villager: 0xf6ead2,
  outline: 0x2b2b2b,
  selected: 0xffffff,
  sanction: 0xd8432f,
};
const FISH_DOTS = 24;

export class VillageScene extends Phaser.Scene {
  private readonly bridge: VillageBridge;
  private readonly houses = new Houses();
  private readonly sprites = new Map<number, Phaser.GameObjects.Arc>();
  private byId = new Map<number, Villager>();
  private ground!: Phaser.GameObjects.Rectangle;
  private fieldGfx!: Phaser.GameObjects.Graphics;
  private houseGfx!: Phaser.GameObjects.Graphics;
  private granaryFill!: Phaser.GameObjects.Rectangle;
  private pond!: Phaser.GameObjects.Ellipse;
  private fish: Phaser.GameObjects.Arc[] = [];
  private sanctionGfx!: Phaser.GameObjects.Graphics;
  private ring!: Phaser.GameObjects.Arc;
  private granaryFrom = 0;
  private granaryTo = 0;
  private pondFrom = 1;
  private pondTo = 1;
  private seasonIndex = 0;
  private lastFrame: number | null = null;

  constructor(bridge: VillageBridge) {
    super('village');
    this.bridge = bridge;
  }

  create(): void {
    this.ground = this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, COLORS.ground[0]);
    this.fieldGfx = this.add.graphics();
    this.houseGfx = this.add.graphics();

    this.add.rectangle(GRANARY.x + GRANARY.width / 2, GRANARY.y + GRANARY.height / 2, GRANARY.width, GRANARY.height, COLORS.granary).setStrokeStyle(3, COLORS.outline);
    this.granaryFill = this.add.rectangle(GRANARY.x + 8, GRANARY.y + GRANARY.height - 8, GRANARY.width - 16, 0, COLORS.grain).setOrigin(0, 1);
    this.add.triangle(GRANARY.x + GRANARY.width / 2, GRANARY.y - 14, 0, 28, GRANARY.width / 2 + 10, 0, GRANARY.width + 20, 28, COLORS.roof).setStrokeStyle(2, COLORS.outline);

    this.pond = this.add.ellipse(POND.x, POND.y, POND.rx * 2, POND.ry * 2, COLORS.waterFull).setStrokeStyle(3, 0x2d5a86);
    for (let i = 0; i < FISH_DOTS; i++) {
      const angle = 2 * Math.PI * hash01(i, 21);
      const r = 0.75 * Math.sqrt(hash01(i, 22));
      this.fish.push(this.add.circle(POND.x + POND.rx * r * Math.cos(angle), POND.y + POND.ry * r * Math.sin(angle), 3, COLORS.fish));
    }

    this.ring = this.add.circle(0, 0, 12).setStrokeStyle(2, COLORS.selected).setVisible(false).setDepth(5);
    this.sanctionGfx = this.add.graphics().setDepth(6);

    this.drawField();
    this.syncVillagers(null);
    this.drawLevels(0);
  }

  update(): void {
    // Temps réel écoulé, mesuré ici : le delta de Phaser est lissé et sous-estime les images lentes.
    const now = performance.now();
    const delta = this.lastFrame === null ? 0 : now - this.lastFrame;
    this.lastFrame = now;
    const records = this.bridge.session.tick(delta);
    if (records.length > 0) this.applySeasons(records);
    this.drawFrame();
  }

  /** « Passer 10 ans » : calcul sans animation. */
  skip(years: number): void {
    const records = this.bridge.session.skipYears(years);
    if (records.length > 0) this.applySeasons(records);
    this.drawFrame();
  }

  private applySeasons(records: SeasonRecord[]): void {
    for (const r of records) {
      this.granaryFrom = this.granaryTo;
      this.granaryTo = r.granaryFill;
      this.pondFrom = this.pondTo;
      this.pondTo = r.metrics.pond;
    }
    // Plusieurs saisons dans la même image (×32) : seule la transition de la dernière est montrée.
    const last = records[records.length - 1]!;
    this.seasonIndex = (last.metrics.season - 1) % 4;
    this.ground.setFillStyle(COLORS.ground[this.seasonIndex]);
    this.drawField();
    this.syncVillagers(records);
    this.bridge.onSeasons(records);
  }

  /** Crée et retire les formes des villageois, et redessine les maisons. */
  private syncVillagers(records: SeasonRecord[] | null): void {
    const state = this.bridge.session.sim.state;
    const adult = (v: Villager) => isAdult(v, state.params);
    this.houses.update(state.villagers, adult);
    this.byId = new Map(state.villagers.map((v) => [v.id, v]));

    const died = new Set(records?.flatMap((r) => r.died) ?? []);
    for (const [id, sprite] of this.sprites) {
      if (this.byId.has(id)) continue;
      this.sprites.delete(id);
      if (died.has(id)) this.tweens.add({ targets: sprite, alpha: 0, duration: 400, onComplete: () => sprite.destroy() });
      else sprite.destroy();
    }
    for (const v of state.villagers) {
      let sprite = this.sprites.get(v.id);
      if (!sprite) {
        sprite = this.add.circle(0, 0, 7, COLORS.villager).setStrokeStyle(2, COLORS.outline).setDepth(4);
        sprite.setInteractive({ useHandCursor: true });
        sprite.on('pointerdown', () => this.bridge.onSelect(v.id));
        if (records) {
          sprite.setAlpha(0);
          this.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
        }
        this.sprites.set(v.id, sprite);
      }
      sprite.setRadius(adult(v) ? 7 : 4);
    }
    this.drawHouses();
  }

  private drawFrame(): void {
    const session = this.bridge.session;
    const t = session.progress;
    const walking = session.speed > 0 && session.speed < NO_WALK_SPEED;
    const params = session.sim.state.params;
    for (const [id, sprite] of this.sprites) {
      const v = this.byId.get(id);
      if (!v) continue;
      const p = positionAt(this.houses.homeOf(v), id, isAdult(v, params), t, walking);
      sprite.setPosition(p.x, p.y);
    }
    this.drawLevels(t);
    this.drawSanctions(t, walking);
    const selected = this.bridge.selected === null ? undefined : this.sprites.get(this.bridge.selected);
    this.ring.setVisible(selected !== undefined);
    if (selected) this.ring.setPosition(selected.x, selected.y);
  }

  private drawLevels(t: number): void {
    const fill = levelAt(this.granaryFrom, this.granaryTo, t, GRANARY_WINDOW);
    // setSize, pas .height : il faut aussi recalculer la forme et son origine.
    this.granaryFill.setSize(GRANARY.width - 16, (GRANARY.height - 16) * Math.min(1, Math.max(0, fill)));
    const pond = levelAt(this.pondFrom, this.pondTo, t, POND_WINDOW);
    const water = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLORS.waterEmpty),
      Phaser.Display.Color.ValueToColor(COLORS.waterFull),
      100,
      Math.round(100 * Math.min(1, Math.max(0, pond))),
    );
    this.pond.setFillStyle(Phaser.Display.Color.GetColor(water.r, water.g, water.b));
    const visible = Math.round(pond * FISH_DOTS);
    this.fish.forEach((f, i) => f.setVisible(i < visible));
  }

  /** Une petite marque rouge au-dessus de chaque villageois sanctionné cette saison. */
  private drawSanctions(t: number, walking: boolean): void {
    const g = this.sanctionGfx;
    g.clear();
    if (walking && (t < SANCTION_WINDOW[0] || t > SANCTION_WINDOW[1])) return;
    g.fillStyle(COLORS.sanction, 1);
    for (const [id, sprite] of this.sprites) {
      const v = this.byId.get(id);
      if (!v) continue;
      const n = v.last.sanctionsReceived + v.last.pondSanctionsReceived;
      if (n === 0) continue;
      g.fillTriangle(sprite.x - 5, sprite.y - 20, sprite.x + 5, sprite.y - 20, sprite.x, sprite.y - 11);
    }
  }

  private drawField(): void {
    const g = this.fieldGfx;
    g.clear();
    g.fillStyle(COLORS.soil, 1).fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);
    g.fillStyle(COLORS.crops[this.seasonIndex] ?? COLORS.crops[0]!, 1);
    for (let y = FIELD.y + 12; y < FIELD.y + FIELD.height - 6; y += 22) g.fillRect(FIELD.x + 10, y, FIELD.width - 20, 9);
    g.lineStyle(3, COLORS.outline, 1).strokeRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);
  }

  private drawHouses(): void {
    const g = this.houseGfx;
    g.clear();
    this.houses.owners.forEach((owner, slot) => {
      const { x, y } = slotPosition(slot);
      const empty = owner === null;
      g.fillStyle(empty ? COLORS.emptyHouse : COLORS.house, empty ? 0.45 : 1).fillRect(x - 10, y - 6, 20, 14);
      g.fillStyle(empty ? COLORS.emptyHouse : COLORS.roof, empty ? 0.45 : 1).fillTriangle(x - 13, y - 6, x + 13, y - 6, x, y - 17);
      if (!empty) g.lineStyle(1, COLORS.outline, 0.6).strokeRect(x - 10, y - 6, 20, 14);
    });
  }
}
