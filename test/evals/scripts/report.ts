/**
 * Report — aggregates eval results into a mechanism × scenario matrix.
 *
 * Usage:
 *   tsx scripts/report.ts                     matrix across results/cc-*
 *   tsx scripts/report.ts --compare A B       diff two result timestamp dirs
 *
 * Result layout: results / experiment / timestamp / eval /
 * {summary.json, run-N/result.json}.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESULTS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'results');

interface EvalAggregate {
  passRate: number;
  meanDuration: number;
  meanCostUSD: number;
  meanWebFetches: number;
}

function readJson(file: string): any {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);
}

/** Newest `<timestamp>` directory under an experiment dir. */
function latestRunDir(experimentDir: string): string | undefined {
  // saveResults writes results/<experiment>/<timestamp>/<eval>/ for single-model runs.
  // ISO timestamps sort lexically; newest last.
  const timestamps = listDirs(experimentDir).sort();
  return timestamps.length > 0
    ? join(experimentDir, timestamps[timestamps.length - 1])
    : undefined;
}

/** Aggregate one eval's runs within a timestamp directory. */
function aggregateEval(evalDir: string): EvalAggregate | undefined {
  const summaryPath = join(evalDir, 'summary.json');
  if (!existsSync(summaryPath)) {
    return undefined;
  }
  const summary = readJson(summaryPath);
  const costs: number[] = [];
  const webFetches: number[] = [];
  for (const runDir of listDirs(evalDir).filter((name) => name.startsWith('run-'))) {
    const resultPath = join(evalDir, runDir, 'result.json');
    if (!existsSync(resultPath)) {
      continue;
    }
    const metadata = readJson(resultPath).metadata ?? {};
    if (typeof metadata.costUSD === 'number') {
      costs.push(metadata.costUSD);
    }
    if (metadata.webFetches && typeof metadata.webFetches.count === 'number') {
      webFetches.push(metadata.webFetches.count);
    }
  }
  const mean = (values: number[]): number =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    passRate: Number.parseFloat(String(summary.passRate)) || 0,
    meanDuration: summary.meanDuration ?? 0,
    meanCostUSD: mean(costs),
    meanWebFetches: mean(webFetches),
  };
}

/** Collect every eval aggregate for a timestamp directory. */
function collectRun(runDir: string): Map<string, EvalAggregate> {
  const result = new Map<string, EvalAggregate>();
  for (const evalName of listDirs(runDir)) {
    const aggregate = aggregateEval(join(runDir, evalName));
    if (aggregate) {
      result.set(evalName, aggregate);
    }
  }
  return result;
}

/**
 * Recognised trailing model suffix on an experiment directory name.
 * Mechanisms can contain hyphens (`agents-md`, `bundled-docs`), so split by
 * looking for an explicit model token rather than the last `-`.
 */
const MODEL_SUFFIX = /-(opus|sonnet|haiku)$/;

interface MatrixKey {
  mechanism: string;
  model: string;
}

function parseExperimentName(dirName: string): MatrixKey {
  const stripped = dirName.replace(/^cc-/, '');
  const match = MODEL_SUFFIX.exec(stripped);
  if (match) {
    return { mechanism: stripped.slice(0, -match[0].length), model: match[1] };
  }
  // Legacy / unknown model — keep the row visible but flag it.
  return { mechanism: stripped, model: '?' };
}

interface TableRow {
  headers: string[];
  cells: string[];
}

function renderTable(
  title: string,
  headerColumns: string[],
  dataColumns: string[],
  rows: TableRow[],
): string {
  const allColumns = [...headerColumns, ...dataColumns];
  const lines = [`### ${title}`, '', `| ${allColumns.join(' | ')} |`];
  lines.push(`| ${allColumns.map(() => '---').join(' | ')} |`);
  for (const row of rows) {
    lines.push(`| ${[...row.headers, ...row.cells].join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

function reportMatrix(): void {
  const experiments = listDirs(RESULTS_ROOT)
    .filter((name) => name.startsWith('cc-'))
    .sort();
  if (experiments.length === 0) {
    console.log(`No experiment results found under ${RESULTS_ROOT}.`);
    return;
  }

  interface Row {
    key: MatrixKey;
    collected: Map<string, EvalAggregate>;
  }
  const collected: Row[] = [];
  const evalNames = new Set<string>();
  for (const experiment of experiments) {
    const runDir = latestRunDir(join(RESULTS_ROOT, experiment));
    if (!runDir) {
      continue;
    }
    const aggregates = collectRun(runDir);
    collected.push({ key: parseExperimentName(experiment), collected: aggregates });
    for (const evalName of aggregates.keys()) {
      evalNames.add(evalName);
    }
  }

  collected.sort((a, b) => {
    if (a.key.mechanism !== b.key.mechanism) {
      return a.key.mechanism.localeCompare(b.key.mechanism);
    }
    return a.key.model.localeCompare(b.key.model);
  });

  const columns = [...evalNames].sort();
  const headerColumns = ['Mechanism', 'Model'];
  const row = (
    formatter: (aggregate: EvalAggregate) => string,
  ): TableRow[] =>
    collected.map(({ key, collected: aggregates }) => ({
      headers: [key.mechanism, key.model],
      cells: columns.map((name) => {
        const a = aggregates.get(name);
        return a ? formatter(a) : '–';
      }),
    }));

  console.log('# Base UI agent-knowledge matrix\n');
  console.log(
    renderTable(
      'Pass rate (mean duration)',
      headerColumns,
      columns,
      row((a) => `${a.passRate.toFixed(0)}% (${a.meanDuration.toFixed(0)}s)`),
    ),
  );
  console.log(
    renderTable('Mean cost (USD)', headerColumns, columns, row((a) => `$${a.meanCostUSD.toFixed(3)}`)),
  );
  console.log(
    renderTable(
      'Mean web fetches per run',
      headerColumns,
      columns,
      row((a) => a.meanWebFetches.toFixed(1)),
    ),
  );
}

function reportCompare(dirA: string, dirB: string): void {
  for (const dir of [dirA, dirB]) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new Error(`Compare target is not a directory: ${dir}`);
    }
  }
  const a = collectRun(dirA);
  const b = collectRun(dirB);
  const evalNames = [...new Set([...a.keys(), ...b.keys()])].sort();

  console.log(`# Compare\n\nA: ${dirA}\nB: ${dirB}\n`);
  const rows: TableRow[] = [];
  for (const name of evalNames) {
    const ea = a.get(name);
    const eb = b.get(name);
    const passDelta =
      ea && eb ? `${ea.passRate.toFixed(0)}% → ${eb.passRate.toFixed(0)}%` : '–';
    const costDelta =
      ea && eb ? `$${ea.meanCostUSD.toFixed(3)} → $${eb.meanCostUSD.toFixed(3)}` : '–';
    rows.push({ headers: [name], cells: [passDelta, costDelta] });
  }
  console.log(renderTable('A → B', ['Eval'], ['Pass rate', 'Mean cost'], rows));
}

const compareIndex = process.argv.indexOf('--compare');
if (compareIndex !== -1) {
  const [dirA, dirB] = process.argv.slice(compareIndex + 1);
  if (!dirA || !dirB) {
    throw new Error('Usage: tsx scripts/report.ts --compare <dirA> <dirB>');
  }
  reportCompare(dirA, dirB);
} else {
  reportMatrix();
}
