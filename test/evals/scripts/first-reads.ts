/**
 * First-reads — for each (mechanism, eval) cell, show the first file the
 * agent touched under `@base-ui/react`. That single data point answers
 * "where did this mechanism send the agent first" — docs, types, or
 * something else.
 *
 * Reads `results/cc-<mechanism>-<model>/<latest>/<eval>/run-<n>/transcript-raw.jsonl`
 * and walks `tool_use` blocks in order until a tool-call detail contains a
 * path under `@base-ui/react/`. Renders the result as a colored
 * mechanism × eval matrix.
 *
 * Usage:
 *   tsx scripts/first-reads.ts                       # all mechanisms, all evals
 *   tsx scripts/first-reads.ts --eval new-prop
 *   tsx scripts/first-reads.ts --mechanism bundled-docs-agents-md
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESULTS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'results');
const MODEL_SUFFIX = /-(opus|sonnet|haiku)$/;
// Match a concrete file under @base-ui/react — must end in a recognised
// extension so we skip Glob patterns (`combobox/**/*`) and bare `ls`
// targets (`node_modules/@base-ui/react/.`). Allows multiple matches
// per call (e.g. a Bash command that `cat`s two files).
// Extension alternation is ordered longest-first within each prefix so e.g.
// `json` wins over `js` (otherwise `package.json` would partially match as
// `package.js`).
const BASE_UI_FILE_RE =
  /(?:node_modules\/)?@base-ui\/react\/([^\s"',()*]+\.(?:d\.ts|tsx|jsx|json|ts|js|md))(?!\w)/g;

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
}

function latestRunDir(experimentDir: string): string | undefined {
  const timestamps = listDirs(experimentDir).sort();
  return timestamps.length > 0 ? join(experimentDir, timestamps[timestamps.length - 1]) : undefined;
}

/**
 * Render every tool call into a single string we can grep for `@base-ui/react`
 * paths — Read.file_path, Bash.command, Glob.pattern, Grep.pattern+path all
 * collapse to one searchable line.
 */
function callText(name: string, input: Record<string, unknown>): string | undefined {
  switch (name) {
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit':
      return String(input.file_path ?? '');
    case 'Glob':
      return String(input.pattern ?? '');
    case 'Grep':
      return `${input.pattern ?? ''} ${input.path ?? ''}`;
    case 'Bash':
      return String(input.command ?? '');
    case 'Agent':
      return String(input.prompt ?? input.description ?? '');
    default:
      return undefined;
  }
}

/**
 * Walk a transcript's tool calls in order and return the first file the
 * agent reads under `@base-ui/react`. Returns the path suffix (e.g.
 * `combobox/root/ComboboxRoot.d.ts` or `docs/react/components/combobox.md`).
 *
 * Glob patterns and `ls` targets don't count — only references to a concrete
 * file path (extension required) do. A Bash one-liner that `cat`s several
 * files counts the first one named in the command.
 */
function firstBaseUiPath(transcriptPath: string): string | undefined {
  const lines = readFileSync(transcriptPath, 'utf8').trim().split('\n');
  for (const line of lines) {
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const content = obj?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c?.type !== 'tool_use') continue;
      const text = callText(c.name, c.input ?? {});
      if (!text) continue;
      // .exec on a /g regex preserves lastIndex across calls — reset it so
      // each tool-call string is matched from the start.
      BASE_UI_FILE_RE.lastIndex = 0;
      const match = BASE_UI_FILE_RE.exec(text);
      if (match) return match[1];
    }
  }
  return undefined;
}

interface MatrixKey {
  mechanism: string;
  model: string;
}

function parseExperimentName(dirName: string): MatrixKey | undefined {
  const stripped = dirName.replace(/^cc-/, '');
  const match = MODEL_SUFFIX.exec(stripped);
  if (!match) return undefined;
  return { mechanism: stripped.slice(0, -match[0].length), model: match[1] };
}

const COLOR = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const visibleLength = (s: string): number => s.replace(ANSI_RE, '').length;

function colorize(text: string, code: string): string {
  return COLOR ? `${code}${text}${ANSI.reset}` : text;
}

/**
 * Color the cell by what kind of artifact the agent landed on, so the matrix
 * is scannable at a glance: docs → green, types → cyan, package.json/index
 * stub → dim, anything else (an exploratory `ls`-style touch that didn't read
 * a file) → yellow.
 */
function colorPath(path: string): string {
  if (path.startsWith('docs/')) return colorize(path, ANSI.green);
  if (path.endsWith('.d.ts')) return colorize(path, ANSI.cyan);
  if (path === 'package.json' || path === 'index.d.ts') {
    return colorize(path, ANSI.dim);
  }
  return colorize(path, ANSI.yellow);
}

function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)));
}

function main(): void {
  const args = process.argv.slice(2);
  let evalFilter: string | undefined;
  let mechanismFilter: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--eval') evalFilter = args[++i];
    else if (args[i] === '--mechanism') mechanismFilter = args[++i];
  }

  const experiments = listDirs(RESULTS_ROOT)
    .filter((n) => n.startsWith('cc-'))
    .sort();
  if (experiments.length === 0) {
    console.log(`No experiment results found under ${RESULTS_ROOT}.`);
    return;
  }

  // Build (mechanism -> eval -> first path). One representative per cell —
  // when there's more than one run we pick run-1 (subsequent runs almost
  // always start identically; if they don't, that's a separate report).
  const matrix = new Map<string, Map<string, string>>();
  const evalNames = new Set<string>();

  for (const experiment of experiments) {
    const key = parseExperimentName(experiment);
    if (!key) continue;
    if (mechanismFilter && key.mechanism !== mechanismFilter) continue;
    const runDir = latestRunDir(join(RESULTS_ROOT, experiment));
    if (!runDir) continue;

    for (const evalName of listDirs(runDir)) {
      if (evalFilter && evalName !== evalFilter) continue;
      const evalDir = join(runDir, evalName);
      const firstRun = listDirs(evalDir)
        .filter((n) => n.startsWith('run-'))
        .sort()[0];
      if (!firstRun) continue;
      const transcript = join(evalDir, firstRun, 'transcript-raw.jsonl');
      if (!existsSync(transcript)) continue;
      const path = firstBaseUiPath(transcript) ?? '—';
      if (!matrix.has(key.mechanism)) matrix.set(key.mechanism, new Map());
      matrix.get(key.mechanism)!.set(evalName, path);
      evalNames.add(evalName);
    }
  }

  if (matrix.size === 0) {
    console.log('No transcripts found.');
    return;
  }

  const evals = [...evalNames].sort();
  const mechanisms = [...matrix.keys()].sort();

  const headers = ['Mechanism', ...evals];
  const rows = mechanisms.map((mech) => {
    const cells = matrix.get(mech)!;
    // Prefixed with `cc-` so the row reads as the experiment name you'd
    // paste into `pnpm eval`.
    return [`cc-${mech}`, ...evals.map((e) => cells.get(e) ?? '—')];
  });

  // Pad on visible width so ANSI codes don't break alignment.
  const widths = headers.map((h, col) => {
    let max = visibleLength(h);
    for (const row of rows) {
      const cellVisible = col === 0 ? row[col] : row[col];
      max = Math.max(max, visibleLength(cellVisible));
    }
    return max;
  });

  console.log(`# First file read under @base-ui/react (per mechanism × eval)\n`);
  console.log(
    `Legend: ${colorize('docs', ANSI.green)} · ${colorize('.d.ts', ANSI.cyan)} · ${colorize('other', ANSI.yellow)} · ${colorize('package.json/index stub', ANSI.dim)} · — none\n`,
  );
  console.log(headers.map((h, i) => pad(h, widths[i])).join('  '));
  console.log(headers.map((_, i) => '-'.repeat(widths[i])).join('  '));
  for (const row of rows) {
    const colored = row.map((cell, i) => (i === 0 ? cell : colorPath(cell)));
    console.log(colored.map((cell, i) => pad(cell, widths[i])).join('  '));
  }
}

main();
