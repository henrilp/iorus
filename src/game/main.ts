/**
 * Le jeu. Un accueil propose deux façons d'entrer au village :
 * - vivre une vie, à pied (fiche 0030) ;
 * - régler un village et le regarder : réglage en HTML, puis le village dans un canevas Phaser, avec le bandeau
 *   du temps et la fiche d'un villageois en HTML par-dessus (fiche 0019).
 */
import * as Phaser from 'phaser';
import { getLang, onLangChange, setLang, tr } from '../i18n';
import { SKIP_YEARS } from './core/display';
import { WORLD } from './core/layout';
import { GameSession } from './core/session';
import { WalkSession } from './core/walk';
import { VillageScene, type VillageBridge } from './scenes/VillageScene';
import { WalkScene } from './scenes/WalkScene';
import { defaultLife, renderHome, type LifeChoice } from './ui/home';
import { LifeUI } from './ui/life';
import { el } from './ui/dom';
import { renderHud, type Hud } from './ui/hud';
import { defaultSetup, renderSetup, toConfig, type SetupState } from './ui/setup';
import { renderSheet } from './ui/sheet';

const topbar = document.querySelector<HTMLElement>('#topbar')!;
const homeRoot = document.querySelector<HTMLElement>('#home')!;
const lifeRoot = document.querySelector<HTMLElement>('#life')!;
const lifeCanvas = document.querySelector<HTMLElement>('#life-canvas')!;
const lifeUiRoot = document.querySelector<HTMLElement>('#life-ui')!;
const setupRoot = document.querySelector<HTMLElement>('#setup')!;
const villageRoot = document.querySelector<HTMLElement>('#village')!;
const hudRoot = document.querySelector<HTMLElement>('#hud')!;
const canvasRoot = document.querySelector<HTMLElement>('#canvas')!;
const sheetRoot = document.querySelector<HTMLElement>('#sheet')!;

const setup: SetupState = defaultSetup();
const life: LifeChoice = defaultLife();
let game: Phaser.Game | null = null;
let lifeUi: LifeUI | null = null;
let walk: WalkSession | null = null;
let scene: VillageScene | null = null;
let bridge: VillageBridge | null = null;
let hud: Hud | null = null;

function renderTopbar(): void {
  const lang = el('button', { type: 'button', class: 'link', lang: getLang() === 'fr' ? 'en' : 'fr' }, tr('lang.switch'));
  lang.addEventListener('click', () => setLang(getLang() === 'fr' ? 'en' : 'fr'));
  topbar.replaceChildren(el('h1', {}, tr('title')), el('nav', {}, el('a', { href: '../' }, tr('lab.link')), lang));
  document.documentElement.lang = getLang();
}

function stopGame(): void {
  game?.destroy(true);
  lifeUi?.destroy();
  game = scene = bridge = hud = null;
  lifeUi = null;
  walk = null;
  villageRoot.hidden = true;
  lifeRoot.hidden = true;
  setupRoot.hidden = true;
  homeRoot.hidden = true;
}

function showHome(): void {
  stopGame();
  homeRoot.hidden = false;
  renderHome(homeRoot, life, startLife, showSetup);
}

function showSetup(): void {
  stopGame();
  setupRoot.hidden = false;
  renderSetupPage();
}

/** Le réglage du village regardé, avec un retour à l'accueil. */
function renderSetupPage(): void {
  renderSetup(setupRoot, setup, startVillage);
  const back = el('button', { type: 'button', class: 'link back' }, tr('home.back'));
  back.addEventListener('click', showHome);
  setupRoot.prepend(back);
}

/** Vivre une vie à pied, dans le village choisi sur l'accueil. */
function startLife(choice: LifeChoice): void {
  stopGame();
  lifeRoot.hidden = false;
  const session = new WalkSession(choice.settings());
  walk = session;
  // En développement seulement : pour inspecter la partie depuis la console.
  if (import.meta.env.DEV) Object.assign(globalThis, { iorusWalk: session });
  let walkScene: WalkScene | null = null;
  const ui = new LifeUI(lifeUiRoot, session, {
    give: (n) => walkScene?.animateGive(n),
    cast: () => walkScene?.animateCast(),
    walkTo: (id) => walkScene?.walkTo(id),
    distanceTo: (id) => walkScene?.distanceTo(id) ?? Infinity,
    replay: () => startLife(choice),
    newLife: () => {
      choice.seed = Math.floor(Math.random() * 1_000_000);
      showHome();
    },
  });
  lifeUi = ui;
  walkScene = new WalkScene({
    session,
    busy: () => ui.busy(),
    onContext: (ctx) => ui.setContext(ctx),
    onInteract: () => ui.interact(),
    onSeason: () => ui.seasonEnded(),
    onPick: (id) => ui.pick(id),
    onFrame: () => ui.tickBar(),
  });
  if (import.meta.env.DEV) Object.assign(globalThis, { iorusScene: walkScene, iorusUi: ui });
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: lifeCanvas,
    backgroundColor: '#1d2a1a',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: lifeCanvas.clientWidth || 960, height: lifeCanvas.clientHeight || 600 },
    scene: [walkScene],
    banner: false,
  });
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
    newSetup: showHome,
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
  } else if (walk) {
    lifeUi?.refresh();
  } else if (!setupRoot.hidden) {
    renderSetupPage();
  } else {
    renderHome(homeRoot, life, startLife, showSetup);
  }
});

renderTopbar();
showHome();
