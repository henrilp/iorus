/**
 * Outil de robustesse : quels résultats du modèle tiennent quand on fait varier les hypothèses ?
 * Lancé par `pnpm robustness` (voir scripts/robustness.mjs), qui écrit le rapport Markdown
 * sur la sortie standard et la progression sur la sortie d'erreur.
 *
 * Options :
 *   --params a,b      ne balayer que ces paramètres
 *   --factors 0.5,2   facteurs appliqués aux valeurs par défaut (défaut : 0.5,0.75,1.5,2)
 *   --seeds 10        nombre de graines (défaut : 5, comme les tests)
 *   --only sweep|pond ne produire qu'une partie du rapport
 */
import { type Condition, holds, SEEDS } from '../checks/helpers';
import type { SimParams } from '../sim/params';
import { STATUS_LABELS } from '../sim/paramSpec';
import { pondGrid, POND_GROWTHS, POND_RATIOS, POND_SCENARIOS } from './pond';
import { ALL_CHECKS, DEFAULT_FACTORS, evaluate, EXCLUDED, sweep, sweepableParams, type Variation } from './sweep';

const num = (x: number, digits = 2) => x.toFixed(digits).replace('.', ',').replace('-', '−');
const factorLabel = (f: number) => `×${num(f, 2).replace(/,?0+$/, '')}`;
const statusLabel = (s: keyof typeof STATUS_LABELS) => STATUS_LABELS[s].fr;

function parseArgs(args: string[]) {
  const get = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const seedCount = Number(get('seeds') ?? SEEDS.length);
  return {
    params: get('params')?.split(',') as (keyof SimParams)[] | undefined,
    factors: get('factors')?.split(',').map(Number) ?? DEFAULT_FACTORS,
    seeds: Array.from({ length: seedCount }, (_, i) => i + 1),
    only: get('only') as 'sweep' | 'pond' | undefined,
  };
}

function describeCondition(c: Condition): string {
  return `${c.label} = ${num(c.value)} (attendu ${c.op} ${num(c.threshold)})`;
}

function sweepReport(variations: Variation[], factors: number[], seeds: number[]): string[] {
  const lines: string[] = [];
  const codes = ALL_CHECKS.map(({ kind }, i) => (kind === 'fait' ? `F${i + 1}` : `H${i + 1 - ALL_CHECKS.filter((c) => c.kind === 'fait').length}`));
  const baseline = evaluate({}, seeds);

  lines.push('## Balayage un paramètre à la fois', '');
  lines.push(
    `Chaque paramètre est multiplié par ${factors.map(factorLabel).join(', ')}, borné par les limites du registre et arrondi s'il est entier ; les autres gardent leur valeur par défaut. Une variation qui retombe sur la valeur par défaut ou sur une valeur déjà testée est sautée.`,
    '',
  );
  lines.push('Paramètres exclus :', '');
  for (const [k, why] of Object.entries(EXCLUDED)) lines.push(`- \`${k}\` : ${why}.`);
  lines.push('', '### Vérifications', '');
  lines.push('| Code | Vérification | Avec les valeurs par défaut | Marge | Casse sous |', '|---|---|---|---|---|');
  ALL_CHECKS.forEach(({ check, kind }, i) => {
    const base = baseline[i]!;
    const broken = variations.filter((v) => !v.outcomes[i]!.ok).length;
    lines.push(
      `| ${codes[i]} | ${kind === 'fait' ? 'Fait' : 'Hypothèse'} : ${check.title} | ${base.ok ? 'tient' : '**casse**'} | ${num(base.margin)} | ${broken} / ${variations.length} variations |`,
    );
  });

  lines.push('', '### Matrice', '');
  lines.push(
    'Une ligne par variation. « ok » : la vérification tient ; « ✗ » : elle casse. La marge (entre parenthèses quand ça casse) est la distance au seuil de la condition la plus juste.',
    '',
  );
  lines.push(`| Paramètre | Statut | Valeur | ${codes.join(' | ')} |`, `|---|---|---|${codes.map(() => '---').join('|')}|`);
  for (const v of variations) {
    const cells = v.outcomes.map((o) => (o.ok ? 'ok' : `✗ (${num(o.margin)})`));
    lines.push(`| \`${v.param}\` | ${statusLabel(v.status)} | ${num(v.value, 3).replace(/,?0+$/, '')} (${factorLabel(v.factor)}) | ${cells.join(' | ')} |`);
  }

  lines.push('', '### Ce qui casse, en détail', '');
  ALL_CHECKS.forEach(({ check }, i) => {
    const broken = variations.filter((v) => !v.outcomes[i]!.ok);
    lines.push(`**${codes[i]}. ${check.title}**`, '');
    if (broken.length === 0) {
      const minMargin = Math.min(...variations.map((v) => v.outcomes[i]!.margin));
      lines.push(`Tient sous toutes les variations (marge la plus faible : ${num(minMargin)}).`, '');
      return;
    }
    for (const v of broken) {
      const failing = v.outcomes[i]!.conditions.filter((c) => !holds(c)).map(describeCondition);
      lines.push(`- \`${v.param}\` = ${num(v.value, 3).replace(/,?0+$/, '')} (${factorLabel(v.factor)}, ${statusLabel(v.status)}) : ${failing.join(' ; ')}`);
    }
    lines.push('');
  });
  return lines;
}

function pondReport(seeds: number[]): string[] {
  const lines: string[] = ['## L’étang peut-il s’éteindre ?', ''];
  lines.push(
    'Seuil d’extinction, en adultes qui ne se modèrent pas du tout : ρ × taille de départ, avec ρ = croissance × capacité par villageois ÷ pêche maximale (valeur par défaut : ρ = 3,75). La grille fait varier ρ par la pêche maximale, pour trois croissances de l’étang. Village de 30, 100 ans ; mesures sur les 20 dernières années.',
    '',
    'Chaque case : étang moyen (fraction de la capacité), nombre de graines où il est épuisé, adultes moyens.',
    '',
  );
  for (const scenario of POND_SCENARIOS) {
    const cells = pondGrid(scenario.composition, seeds);
    lines.push(`### ${scenario.label}`, '');
    lines.push(`| ρ (seuil en adultes) | ${POND_GROWTHS.map((g) => `croissance ${num(g)}`).join(' | ')} |`, `|---|${POND_GROWTHS.map(() => '---').join('|')}|`);
    for (const ratio of POND_RATIOS) {
      const row = POND_GROWTHS.map((growth) => {
        const c = cells.find((x) => x.ratio === ratio && x.growth === growth)!;
        return `${num(c.pond)} · ${c.depleted}/${c.seeds} épuisé · ${Math.round(c.adults)} ad. (pêche max ${num(c.maxCatch, 1)})`;
      });
      lines.push(`| ${num(ratio)} (${Math.round(ratio * 30)}) | ${row.join(' | ')} |`);
    }
    lines.push('');
  }
  return lines;
}

/** Produit le rapport. `progress` reçoit des messages d'avancement (le module reste sans dépendance à Node). */
export function main(argv: string[], progress: (message: string) => void = () => {}): string {
  const opts = parseArgs(argv);
  const started = Date.now();
  const lines: string[] = ['# Robustesse du modèle', ''];
  lines.push(
    `Graines : ${opts.seeds.length}. Les vérifications sont exactement celles des tests (src/checks/), avec les mêmes seuils.`,
    '',
  );

  if (opts.only !== 'pond') {
    const params = opts.params ?? sweepableParams();
    const variations = sweep(params, opts.factors, opts.seeds, (done, total) => {
      progress(`\rbalayage : ${done}/${total}${done === total ? '\n' : ''}`);
    });
    lines.push(...sweepReport(variations, opts.factors, opts.seeds));
  }
  if (opts.only !== 'sweep') {
    progress('grille de l’étang…\n');
    lines.push(...pondReport(opts.seeds));
  }
  progress(`terminé en ${Math.round((Date.now() - started) / 1000)} s\n`);
  return lines.join('\n');
}
