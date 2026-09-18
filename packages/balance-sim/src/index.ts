import { generateWorld } from '@leyenda/worldgen';

import { aggregateReport } from './aggregate-report';
import { formatReport } from './format-report';
import { runSeasons } from './run-seasons';

const QUICK_SEASONS = 5;
const FULL_SEASONS = 50;
const DEFAULT_SEED = 1;
const SEASON_START_DATE = '2026-08-01';

interface CliArgs {
  quick: boolean;
  seed: number;
}

function parseArgs(argv: string[]): CliArgs {
  const quick = argv.includes('--quick');
  const seedArg = argv.find((arg) => arg.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.slice('--seed='.length)) : DEFAULT_SEED;
  return { quick, seed };
}

function main(): void {
  const { quick, seed } = parseArgs(process.argv.slice(2));
  const seasons = quick ? QUICK_SEASONS : FULL_SEASONS;

  // Progreso por stderr: así `pnpm balance > informe.txt` solo captura el informe.
  console.error(`Generando mundo (seed=${seed})...`);
  const world = generateWorld(seed);

  console.error(
    `Simulando ${seasons} temporada(s) de ${world.competitions.filter((c) => c.type === 'league').length} ligas...`
  );
  const results = runSeasons({
    world,
    seasons,
    baseSeed: seed,
    seasonStartDate: SEASON_START_DATE,
  });

  const report = aggregateReport(results, world);
  console.log(formatReport(report));
}

main();
