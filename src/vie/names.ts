/**
 * Des noms pour les villageois, tirés de leur identifiant : toujours le même nom pour le même villageois,
 * sans tirer dans le hasard du moteur. Trois syllabes donnent 1 728 noms différents.
 *
 * Les identifiants sont mélangés avant d'en faire un nom, et tous les noms ont la même forme : sinon des
 * villageois nés ou arrivés ensemble (identifiants qui se suivent) partageraient la même fin de nom, comme
 * une famille ou un clan, et les derniers venus se reconnaîtraient à la longueur de leur nom.
 */
const SYLLABLES = ['ma', 'lo', 'ri', 'ta', 'be', 'no', 'sa', 'li', 've', 'du', 'ka', 'mi'];
const N = SYLLABLES.length;
const COUNT = N * N * N;

export function villagerName(id: number): string {
  // Multiplier par un nombre premier avec 1 728 mélange les identifiants sans jamais en confondre deux.
  const k = (id * 1031) % COUNT;
  const name = SYLLABLES[k % N]! + SYLLABLES[Math.floor(k / N) % N]! + SYLLABLES[Math.floor(k / (N * N))]!;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
