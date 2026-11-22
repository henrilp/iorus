/**
 * Des noms pour les villageois, tirés de leur identifiant : toujours le même nom pour le même villageois,
 * sans tirer dans le hasard du moteur. Deux syllabes donnent 144 noms différents, trois au-delà.
 */
const SYLLABLES = ['ma', 'lo', 'ri', 'ta', 'be', 'no', 'sa', 'li', 've', 'du', 'ka', 'mi'];

export function villagerName(id: number): string {
  const n = SYLLABLES.length;
  let name = SYLLABLES[id % n]! + SYLLABLES[Math.floor(id / n) % n]!;
  if (id >= n * n) name += SYLLABLES[Math.floor(id / (n * n)) % n]!;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
