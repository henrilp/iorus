/**
 * Aléa purement visuel (où se place un villageois dans le champ, sur la rive…).
 *
 * Il ne passe jamais par le `Rng` du moteur : tirer dans le générateur de la simulation
 * pour l'affichage changerait la partie selon la vitesse ou la taille de l'écran.
 * Ici, le « hasard » est une fonction fixe de l'identifiant : même villageois, même place.
 */
export function hash01(id: number, salt: number): number {
  let h = (Math.imul(id + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0x100000000;
}
