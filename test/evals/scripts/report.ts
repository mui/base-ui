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
  return timestamps.length > 0 ? join(experimentDir, timestamps[timestamps.length - 1]) : undefined;
}

/**
 * Parse a results timestamp dir name back into a Date. The format
 * `YYYY-MM-DDTHH-mm-ss.sssZ` uses dashes instead of colons (filesystem
 * safety) — flip them back to make the string ISO-parsable.
 */
function timestampDirToDate(dirName: string): Date {
  const iso = dirName.replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3');
  return new Date(iso);
}

/** Compact relative age, e.g. `2h`, `3d`, `5m`. */
function relativeAge(then: Date, now: Date): string {
  const seconds = Math.max(0, (now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86_400 * 30) return `${Math.floor(seconds / 86_400)}d`;
  return `${Math.floor(seconds / (86_400 * 30))}mo`;
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

/**
 * Returns `undefined` for experiment dirs that don't end in a recognised model
 * suffix — those are legacy results from before `scripts/run.ts` started
 * writing per-model trees (`cc-<mechanism>-<model>/`). Ignoring them keeps the
 * matrix from sprouting stray `?` rows alongside the real per-model ones.
 */
function parseExperimentName(dirName: string): MatrixKey | undefined {
  const stripped = dirName.replace(/^cc-/, '');
  const match = MODEL_SUFFIX.exec(stripped);
  if (!match) {
    return undefined;
  }
  return { mechanism: stripped.slice(0, -match[0].length), model: match[1] };
}

interface TableRow {
  headers: string[];
  cells: string[];
}

// ANSI escapes only emit when writing to a TTY so the markdown stays clean
// when piped to a file or pasted into a doc.
const COLOR = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const visibleLength = (s: string): number => s.replace(ANSI_RE, '').length;

function colorize(text: string, code: string): string {
  return COLOR ? `${code}${text}${ANSI.reset}` : text;
}

/** Colour a pass-rate cell so the matrix is scannable at a glance. */
function passRateCell(rate: number): string {
  const text = `${rate.toFixed(0)}%`;
  if (rate >= 100) return colorize(text, ANSI.green);
  if (rate > 0) return colorize(text, ANSI.yellow);
  return colorize(text, ANSI.red);
}

function renderTable(
  title: string,
  headerColumns: string[],
  dataColumns: string[],
  rows: TableRow[],
): string {
  const allColumns = [...headerColumns, ...dataColumns];
  // Pad each column to its widest cell so the table is readable in a terminal
  // (still valid markdown; renderers ignore the extra spaces). Padding works
  // on *visible* width so ANSI escape codes don't throw off alignment.
  const widths = allColumns.map((heading, columnIndex) => {
    let max = visibleLength(heading);
    for (const row of rows) {
      const cell = [...row.headers, ...row.cells][columnIndex] ?? '';
      const length = visibleLength(cell);
      if (length > max) max = length;
    }
    return Math.max(max, 3); // separator row needs at least `---`
  });
  const pad = (cell: string, width: number): string =>
    cell + ' '.repeat(width - visibleLength(cell));
  const formatRow = (cells: string[]): string =>
    `| ${cells.map((cell, columnIndex) => pad(cell, widths[columnIndex])).join(' | ')} |`;

  const lines = [`### ${title}`, ''];
  lines.push(formatRow(allColumns));
  lines.push(`| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`);
  for (const row of rows) {
    lines.push(formatRow([...row.headers, ...row.cells]));
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
    runAt: Date;
    meanPassRate: number;
  }
  const collected: Row[] = [];
  const evalNames = new Set<string>();
  for (const experiment of experiments) {
    const key = parseExperimentName(experiment);
    if (!key) {
      continue;
    }
    const runDir = latestRunDir(join(RESULTS_ROOT, experiment));
    if (!runDir) {
      continue;
    }
    const aggregates = collectRun(runDir);
    if (aggregates.size === 0) {
      continue;
    }
    const rates = [...aggregates.values()].map((a) => a.passRate);
    const meanPassRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    collected.push({
      key,
      collected: aggregates,
      runAt: timestampDirToDate(runDir.split('/').pop() ?? ''),
      meanPassRate,
    });
    for (const evalName of aggregates.keys()) {
      evalNames.add(evalName);
    }
  }

  // Top performers first; ties break on mechanism for stable output.
  collected.sort((a, b) => {
    if (a.meanPassRate !== b.meanPassRate) {
      return b.meanPassRate - a.meanPassRate;
    }
    if (a.key.mechanism !== b.key.mechanism) {
      return a.key.mechanism.localeCompare(b.key.mechanism);
    }
    return a.key.model.localeCompare(b.key.model);
  });

  // "Stale" = row's latest run is more than a day older than the newest row.
  // Dim the entire row so a quick scan separates fresh comparable data from
  // archive cruft.
  const newest = collected.reduce((acc, r) => (r.runAt > acc ? r.runAt : acc), new Date(0));
  const now = new Date();
  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const isStale = (row: Row): boolean =>
    newest.getTime() - row.runAt.getTime() > STALE_THRESHOLD_MS;

  const columns = [...evalNames].sort();
  const headerColumns = ['Mechanism', 'Model', 'Age'];
  const row = (formatter: (aggregate: EvalAggregate) => string): TableRow[] =>
    collected.map((r) => {
      const ageText = relativeAge(r.runAt, now);
      const stale = isStale(r);
      const dim = (s: string): string => (stale ? colorize(s, ANSI.dim) : s);
      return {
        // Prefixed with `cc-` so the row reads as the experiment name
        // you'd paste into `pnpm eval`.
        headers: [dim(`cc-${r.key.mechanism}`), dim(r.key.model), dim(ageText)],
        cells: columns.map((name) => {
          const a = r.collected.get(name);
          return dim(a ? formatter(a) : '–');
        }),
      };
    });

  console.log(`# Base UI agent-knowledge matrix\n`);
  if (collected.some(isStale)) {
    console.log(
      `Rows older than 24h relative to the newest result are dimmed — they're not directly comparable to fresh runs.\n`,
    );
  }
  console.log(
    renderTable(
      'Pass rate',
      headerColumns,
      columns,
      row((a) => passRateCell(a.passRate)),
    ),
  );
  console.log(
    renderTable(
      'Mean duration (s)',
      headerColumns,
      columns,
      row((a) => a.meanDuration.toFixed(0)),
    ),
  );
  console.log(
    renderTable(
      'Mean cost (USD)',
      headerColumns,
      columns,
      row((a) => `$${a.meanCostUSD.toFixed(3)}`),
    ),
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
    const passDelta = ea && eb ? `${ea.passRate.toFixed(0)}% → ${eb.passRate.toFixed(0)}%` : '–';
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
