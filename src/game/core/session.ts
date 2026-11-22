/**
 * Une partie en cours : le moteur, le temps qui passe et ce que l'affichage doit savoir de la saison jouée.
 *
 * Règle d'or : la vitesse ne décide que du nombre d'appels à `step()`, jamais de leur contenu.
 * « Passer 10 ans » et laisser tourner à ×32 donnent donc exactement le même état (testé).
 *
 * Pas de Phaser ni de DOM ici, pour pouvoir le tester sans navigateur.
 */
import { Simulation, type LastActions, type SeasonMetrics, type SimConfig } from '../../sim';
import { MAX_SEASONS_PER_TICK, SEASON_MS, type Speed } from './display';

/** Ce que l'affichage doit savoir d'une saison qui vient d'être calculée. */
export interface SeasonRecord {
  metrics: SeasonMetrics;
  /** Nés à la fin de la saison. */
  born: number[];
  /** Morts pendant la saison (ils ne sont déjà plus dans l'état du moteur). */
  died: number[];
  /** Part de la récolte du village versée au grenier : total versé / total récolté. */
  granaryFill: number;
}

export interface RecentSeason extends LastActions {
  season: number;
}

export type EndReason = 'extinct' | 'duration';

/** Nombre de saisons gardées pour la fiche d'un villageois. */
const RECENT_SEASONS = 4;

export class GameSession {
  readonly sim: Simulation;
  readonly config: SimConfig;
  /** Durée choisie, en années ; null = sans limite. */
  readonly durationYears: number | null;
  speed: Speed = 1;
  /** Saison en cours d'affichage (calculée au moment où elle commence). */
  current: SeasonRecord | null = null;
  ended: EndReason | null = null;
  /** Temps écoulé dans la saison affichée, en millisecondes à ×1. */
  private elapsed = 0;
  private readonly recent = new Map<number, RecentSeason[]>();

  constructor(config: SimConfig, durationYears: number | null) {
    this.config = config;
    this.durationYears = durationYears;
    this.sim = new Simulation(config);
  }

  /** Avancement dans la saison affichée, de 0 à 1. */
  get progress(): number {
    return this.current ? Math.min(1, this.elapsed / SEASON_MS) : 0;
  }

  /** Fait passer le temps réel : renvoie les saisons calculées pendant ce laps. */
  tick(dtMs: number): SeasonRecord[] {
    const out: SeasonRecord[] = [];
    if (this.ended || this.speed === 0) return out;
    if (!this.current) {
      if (this.isOver()) return this.end(out);
      out.push(this.advance());
    }
    this.elapsed += dtMs * this.speed;
    while (this.elapsed >= SEASON_MS) {
      if (this.isOver()) {
        this.elapsed = SEASON_MS;
        return this.end(out);
      }
      if (out.length >= MAX_SEASONS_PER_TICK) {
        // Trop de retard (onglet en arrière-plan) : on oublie le temps perdu plutôt que de figer la page.
        this.elapsed = SEASON_MS - 1;
        break;
      }
      this.elapsed -= SEASON_MS;
      out.push(this.advance());
    }
    return out;
  }

  /** Calcule des années d'un coup, sans animation, sans dépasser la durée choisie. */
  skipYears(years: number): SeasonRecord[] {
    const out: SeasonRecord[] = [];
    if (this.ended) return out;
    const seasons = years * this.sim.state.params.seasonsPerYear;
    for (let i = 0; i < seasons && !this.isOver(); i++) out.push(this.advance());
    this.elapsed = SEASON_MS;
    if (this.isOver()) this.end(out);
    return out;
  }

  /** Ce qu'un villageois a fait lors de ses dernières saisons de travail, pour sa fiche. */
  recentSeasons(id: number): RecentSeason[] {
    return this.recent.get(id) ?? [];
  }

  private isOver(): boolean {
    const s = this.sim.state;
    if (s.extinct) return true;
    return this.durationYears !== null && s.season >= this.durationYears * s.params.seasonsPerYear;
  }

  private end(out: SeasonRecord[]): SeasonRecord[] {
    this.ended = this.sim.state.extinct ? 'extinct' : 'duration';
    return out;
  }

  private advance(): SeasonRecord {
    const before = new Set(this.sim.state.villagers.map((v) => v.id));
    const metrics = this.sim.step();
    const villagers = this.sim.state.villagers;
    const now = new Set(villagers.map((v) => v.id));
    const born = villagers.filter((v) => !before.has(v.id)).map((v) => v.id);
    const died = [...before].filter((id) => !now.has(id));

    // Les morts sont déjà retirés de l'état : le total versé ne compte que les vivants.
    // C'est une mesure d'affichage, le moteur garde la sienne (meanShare).
    let harvest = 0;
    let given = 0;
    for (const v of villagers) {
      harvest += v.last.harvest;
      given += v.last.contributed;
      if (v.last.harvest > 0) {
        const list = this.recent.get(v.id) ?? [];
        list.push({ season: metrics.season, ...v.last });
        if (list.length > RECENT_SEASONS) list.shift();
        this.recent.set(v.id, list);
      }
    }
    for (const id of died) this.recent.delete(id);

    this.current = { metrics, born, died, granaryFill: harvest > 0 ? given / harvest : 0 };
    return this.current;
  }
}
