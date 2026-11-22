/**
 * Textes du jeu en français et en anglais. Aucun texte en dur dans le code du jeu :
 * tout passe par `tr`. Les textes qui décrivent le modèle (paramètres, règles) vivent,
 * eux, dans les registres de `src/sim/`, déjà bilingues : on les lit avec `text`.
 */
import type { Text } from '../sim';
import en from './en.json';
import fr from './fr.json';

export type Lang = keyof Text;
export type TextKey = keyof typeof fr;

const DICTS: Record<Lang, Record<TextKey, string>> = { fr, en };
const STORAGE_KEY = 'iorus.lang';

let lang: Lang = detectLang();
const listeners: (() => void)[] = [];

function detectLang(): Lang {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // Stockage indisponible (navigation privée, aperçu) : on se rabat sur le navigateur.
  }
  const nav = globalThis.navigator?.language ?? 'fr';
  return nav.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang): void {
  lang = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    // Le choix ne sera pas retenu d'une visite à l'autre ; ce n'est pas grave.
  }
  listeners.forEach((l) => l());
}

export function onLangChange(listener: () => void): void {
  listeners.push(listener);
}

/** Texte du jeu, avec ses variables : tr('hud.year', { year: 3 }). */
export function tr(key: TextKey, vars: Record<string, string | number> = {}): string {
  return DICTS[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** Texte bilingue venu des registres du moteur. */
export function text(t: Text): string {
  return t[lang];
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: digits }).format(value);
}

export const DICTIONARIES = DICTS;
