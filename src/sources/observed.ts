/**
 * Faits observés que le jeu peut montrer au joueur (portrait de l'intro, « Comment ça marche ? »).
 *
 * Règle du projet : aucun chiffre n'est présenté comme un fait observé tant que sa source
 * n'est pas vérifiée. Chaque entrée dit où le chiffre se trouve dans la source et le cite.
 * Seules les entrées `verifie` peuvent être affichées ; `observed()` refuse les autres.
 * Les sources des paramètres du moteur, elles, sont dans la note de chaque paramètre (src/sim/paramSpec.ts).
 */
import type { Text } from '../sim/paramSpec';

export type SourceStatus = 'verifie' | 'non-verifie';

export interface ObservedFact {
  id: string;
  /** Phrase utilisable dans le jeu, sans jugement. */
  text: Text;
  reference: string;
  /** Où le chiffre se trouve dans la source (page, tableau, résumé). */
  where: string;
  /** Extrait de la source, court. */
  quote: string;
  status: SourceStatus;
  /** Limites à garder en tête avant de s'en servir. */
  caveat?: string;
}

const ENGEL = 'Engel, C. (2011). Dictator games: a meta study. Experimental Economics, 14(4), 583–610.';
const FG2010 =
  'Fischbacher, U., & Gächter, S. (2010). Social preferences, beliefs, and the dynamics of free riding in public goods experiments. American Economic Review, 100(1), 541–556.';
const FGF2001 =
  'Fischbacher, U., Gächter, S., & Fehr, E. (2001). Are people conditionally cooperative? Evidence from a public goods experiment. Economics Letters, 71(3), 397–404.';
const FG2002 = 'Fehr, E., & Gächter, S. (2002). Altruistic punishment in humans. Nature, 415, 137–140.';
const FG2000 =
  'Fehr, E., & Gächter, S. (2000). Cooperation and punishment in public goods experiments. American Economic Review, 90(4), 980–994.';
const OWG1991 =
  'Ostrom, E., Walker, J., & Gardner, R. (1991). Covenants with and without a sword: self-enforcement is possible. Version de conférence de l’article paru dans l’American Political Science Review, 86(2), 1992.';

export const OBSERVED: ObservedFact[] = [
  {
    id: 'dictateur-don-moyen',
    text: {
      fr: 'Quand on peut partager une somme avec un inconnu sans rien attendre en retour, on en donne en moyenne un peu plus d’un quart.',
      en: 'When people can share a sum with a stranger and expect nothing back, they give on average a little over a quarter of it.',
    },
    reference: ENGEL,
    where: 'section 3, p. 588 (moyenne de 616 traitements, 129 articles) ; méta-analyse à effets aléatoires : 28,3 %',
    quote: 'dictators on average give 28.35% of the pie',
    status: 'verifie',
    caveat: 'Très forte hétérogénéité entre études ; surtout des étudiants occidentaux. À effets fixes, la moyenne est de 20,4 %.',
  },
  {
    id: 'dictateur-repartition',
    text: {
      fr: 'Dans ces expériences, environ un tiers des gens ne donnent rien, et environ un sur six partage à parts égales.',
      en: 'In these experiments, about a third of people give nothing, and about one in six splits equally.',
    },
    reference: ENGEL,
    where: 'p. 589, Fig. 2 (20 813 observations individuelles) : 36,11 % ne donnent rien, 16,74 % partagent à égalité, 5,44 % donnent tout',
    quote: '36.11% of all participants give nothing to the recipient. 16.74% choose the equal split',
    status: 'verifie',
    caveat: 'Chez les Occidentaux, près de 40 % ne donnent rien ; dans les sociétés indigènes étudiées, le partage égal est le plus fréquent (p. 590).',
  },
  {
    id: 'cooperateurs-conditionnels',
    text: {
      fr: 'Environ la moitié des gens contribuent au groupe en fonction de ce que font les autres : plus les autres donnent, plus ils donnent.',
      en: 'About half of people contribute to the group according to what others do: the more others give, the more they give.',
    },
    reference: `${FGF2001} ; ${FG2010}`,
    where: 'FGF 2001, résumé : 50 % ; FG 2010, p. 542 : 55 % (140 participants, Zurich)',
    quote: '55 percent conditional cooperators who cooperate if others cooperate',
    status: 'verifie',
    caveat: 'Il s’agit de contribuer à un pot commun selon les autres, pas de rendre à une personne ce qu’elle a donné.',
  },
  {
    id: 'passagers-clandestins',
    text: {
      fr: 'Entre un quart et un tiers des gens ne contribuent pas au pot commun, quoi que fassent les autres.',
      en: 'Between a quarter and a third of people do not contribute to the common pot, whatever others do.',
    },
    reference: `${FG2010} ; ${FGF2001}`,
    where: 'FG 2010, p. 542 : 23 % ; FGF 2001, résumé : environ un tiers',
    quote: '23 percent free riders',
    status: 'verifie',
  },
  {
    id: 'cooperation-imparfaite',
    text: {
      fr: 'Ceux qui suivent les autres donnent en général un peu moins qu’eux.',
      en: 'Those who follow others generally give a little less than they do.',
    },
    reference: FG2010,
    where: 'p. 550 ; conclusion p. 554 (« imperfect conditional cooperators ») ; pente moyenne du barème, tous profils confondus : 0,425 (p. 552)',
    quote: 'most people’s elicited contribution preferences lie below the diagonal',
    status: 'verifie',
  },
  {
    id: 'declin-sans-sanction',
    text: {
      fr: 'Sans possibilité de sanctionner, la contribution au pot commun s’effrite au fil des tours : au dernier tour, une majorité ne donne plus rien.',
      en: 'Without the possibility of sanctions, contributions to the common pot erode round after round: in the last round, a majority gives nothing.',
    },
    reference: `${FG2002} ; ${FG2000}`,
    where: 'FG 2002, p. 138 : 58,9 % donnent 0 au dernier tour sans sanction ; FG 2000, Tableau 3, p. 985 : 1,3 à 2,3 jetons sur 20 au dernier tour',
    quote: 'In the final period of the no-punishment condition, 58.9% of the subjects contributed nothing',
    status: 'verifie',
  },
  {
    id: 'sanctionner',
    text: {
      fr: 'Quand c’est possible, la plupart des gens paient au moins une fois pour sanctionner quelqu’un qui contribue peu.',
      en: 'When they can, most people pay at least once to sanction someone who contributes little.',
    },
    reference: FG2002,
    where: 'p. 137 : 84,3 % sanctionnent au moins une fois ; 74,2 % des sanctions visent ceux qui donnent moins que la moyenne',
    quote: '84.3% of the subjects punished at least once',
    status: 'verifie',
    caveat: 'Groupes recomposés à chaque tour : sanctionner ne rapporte rien à celui qui le fait.',
  },
  {
    id: 'sanction-ressource-commune',
    text: {
      fr: 'Pour une ressource commune, la sanction seule limite la surexploitation mais coûte presque autant qu’elle rapporte ; se parler puis choisir ensemble une sanction marche beaucoup mieux.',
      en: 'For a common resource, sanctions alone limit overuse but cost almost as much as they bring; talking first and then choosing a sanction together works much better.',
    },
    reference: OWG1991,
    where: 'p. 34 : rendement net de −38 % à 36 % avec sanction imposée, gain de 11 % une fois les coûts déduits ; pp. 36–41 : efficacité de 70 % à 97 % et de 77 % à 96 % avec communication puis sanction choisie',
    quote: 'net yield rose from -38% before the imposition of sanctioning to 36% after',
    status: 'non-verifie',
    caveat: 'Lu dans la version de conférence de 1991 seulement ; les chiffres de l’article publié en 1992 n’ont pas été vérifiés.',
  },
];

/** Renvoie un fait observé affichable ; refuse ceux dont la source n'est pas vérifiée. */
export function observed(id: string): ObservedFact {
  const fact = OBSERVED.find((f) => f.id === id);
  if (!fact) throw new Error(`fait observé inconnu : ${id}`);
  if (fact.status !== 'verifie') throw new Error(`source non vérifiée pour ${id} : ne pas l’afficher`);
  return fact;
}
