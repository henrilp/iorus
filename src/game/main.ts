/**
 * Le jeu : réglage en HTML, puis le village dans un canevas Phaser, avec le bandeau du temps
 * et la fiche d'un villageois en HTML par-dessus (fiche 0019).
 */
import * as Phaser from 'phaser';
import { getLang, onLangChange, setLang, tr } from '../i18n';
import { SKIP_YEARS } from './core/display';
import { WORLD } from './core/layout';
import { GameSession } from './core/session';
import { VillageScene, type VillageBridge } from './scenes/VillageScene';
import { el } from './ui/dom';
import { renderHud, type Hud } from './ui/hud';
import { defaultSetup, renderSetup, toConfig, type SetupState } from './ui/setup';
import { renderSheet } from './ui/sheet';

const topbar = document.querySelector<HTMLElement>('#topbar')!;
const setupRoot = document.querySelector<HTMLElement>('#setup')!;
const villageRoot = document.querySelector<HTMLElement>('#village')!;
const hudRoot = document.querySelector<HTMLElement>('#hud')!;
const canvasRoot = document.querySelector<HTMLElement>('#canvas')!;
const sheetRoot = document.querySelector<HTMLElement>('#sheet')!;

const setup: SetupState = defaultSetup();
let game: Phaser.Game | null = null;
let scene: VillageScene | null = null;
let bridge: VillageBridge | null = null;
let hud: Hud | null = null;

function renderTopbar(): void {
  const lang = el('button', { type: 'button', class: 'link', lang: getLang() === 'fr' ? 'en' : 'fr' }, tr('lang.switch'));
  lang.addEventListener('click', () => setLang(getLang() === 'fr' ? 'en' : 'fr'));
  topbar.replaceChildren(el('h1', {}, tr('title')), el('nav', {}, el('a', { href: '../' }, tr('lab.link')), lang));
  document.documentElement.lang = getLang();
}

function showSetup(): void {
  game?.destroy(true);
  game = scene = bridge = hud = null;
  villageRoot.hidden = true;
  setupRoot.hidden = false;
  renderSetup(setupRoot, setup, startVillage);
}

function refreshSheet(): void {
  if (!bridge) return;
  renderSheet(sheetRoot, bridge.session, bridge.selected, () => {
    if (bridge) bridge.selected = null;
    refreshSheet();
  });
}

function mountHud(session: GameSession): void {
  hud = renderHud(hudRoot, session, {
    setSpeed: (speed) => {
      session.speed = speed;
      hud?.refresh();
    },
    skip: () => scene?.skip(SKIP_YEARS),
    newSetup: showSetup,
  });
}

function startVillage(s: SetupState): void {
  setupRoot.hidden = true;
  villageRoot.hidden = false;
  const session = new GameSession(toConfig(s), s.duration);
  bridge = {
    session,
    selected: null,
    onSeasons: () => {
      hud?.refresh();
      if (bridge?.selected !== null) refreshSheet();
    },
    onSelect: (id) => {
      if (!bridge) return;
      bridge.selected = id;
      refreshSheet();
    },
  };
  scene = new VillageScene(bridge);
  mountHud(session);
  refreshSheet();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: canvasRoot,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: '#2b2b2b',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [scene],
    banner: false,
  });
}

onLangChange(() => {
  renderTopbar();
  if (bridge) {
    // Le village continue : on ne retraduit que l'interface HTML.
    mountHud(bridge.session);
    refreshSheet();
  } else {
    renderSetup(setupRoot, setup, startVillage);
  }
});

renderTopbar();
showSetup();
