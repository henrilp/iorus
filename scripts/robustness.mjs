// Lance l'outil de robustesse (src/robustness/main.ts) en exécutant le TypeScript par Vite,
// sans dépendance supplémentaire. Rapport sur la sortie standard, progression sur la sortie d'erreur.
import { runnerImport } from 'vite';

const { module } = await runnerImport('/src/robustness/main.ts');
const report = module.main(process.argv.slice(2), (message) => process.stderr.write(message));
process.stdout.write(report + '\n');
