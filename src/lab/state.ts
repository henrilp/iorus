/** État partagé du labo : les paramètres courants et la langue d'affichage. */
import { DEFAULT_PARAMS, type SimParams, type Text } from '../sim';

export const LANG: keyof Text = 'fr';
export const t = (text: Text): string => text[LANG];

export const params: SimParams = { ...DEFAULT_PARAMS };
export const PARAM_KEYS = Object.keys(DEFAULT_PARAMS) as (keyof SimParams)[];

type Listener = (key: keyof SimParams) => void;
const listeners: Listener[] = [];

export function onParamChange(listener: Listener): void {
  listeners.push(listener);
}

export function setParam<K extends keyof SimParams>(key: K, value: SimParams[K]): void {
  params[key] = value;
  listeners.forEach((l) => l(key));
}

export function resetParams(): void {
  for (const key of PARAM_KEYS) setParam(key, DEFAULT_PARAMS[key]);
}

export function isModified(key: keyof SimParams): boolean {
  return params[key] !== DEFAULT_PARAMS[key];
}

const numberFormat = new Intl.NumberFormat(LANG === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 3 });

export function formatValue(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? (LANG === 'fr' ? 'oui' : 'yes') : LANG === 'fr' ? 'non' : 'no';
  return numberFormat.format(value);
}
