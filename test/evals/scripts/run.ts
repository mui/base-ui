/**
 * Concurrency-capped experiment runner.
 *
 * The `agent-eval` CLI launches every (experiment × eval × run) attempt at
 * once — only a hardcoded start-*rate* limiter, no cap on how many sandboxes
 * run in parallel. This runner drives the same evals through the framework's
 * programmatic API (`runSingleEval`) behind a real concurrency limiter, then
 * writes results in the layout `report.ts` and the playground expect.
 *
 * Per (mechanism, model) pair gets its own result tree
 * (`results/cc-<mechanism>-<model>/<timestamp>/<eval>/`), so models are
 * directly comparable in the report.
 *
 * Usage:
 *   tsx scripts/run.ts [experiment...] [--concurrency N] [--runs N] [--models LIST]
 *     experiment     experiment name(s), e.g. cc-skill (default: all experiments/)
 *     --concurrency  max sandboxes running at once (default: 4)
 *     --runs         override runs-per-eval from the experiment config
 *     --models       comma-separated model list, overrides the experiment config
 *                    (e.g. `--models opus`, `--models opus,sonnet`)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEvalSummary,
  createExperimentResults,
  getAgent,
  loadAllFixtures,
  loadConfig,
  resolveEvalNames,
  runSingleEval,
  saveResults,
  type EvalRunData,
} from '@vercel/agent-eval';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPERIMENTS_DIR = join(ROOT, 'experiments');
const EVALS_DIR = join(ROOT, 'evals');
const RESULTS_DIR = join(ROOT, 'results');

/** Minimal `.env` loader (first value wins) — avoids a dotenv dependency. */
function loadEnvFile(file: string): void {
  if (!existsSync(file)) {
    return;
  }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** Run async tasks with at most `max` in flight at once. */
function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
      queue.shift()?.();
    }
  };
}

interface CliArgs {
  experiments: string[];
  concurrency: number;
  runs?: number;
  models?: string[];
}

function parseArgs(argv: string[]): CliArgs {
  const experiments: string[] = [];
  let concurrency = 4;
  let runs: number | undefined;
  let models: string[] | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      // Tolerate the `pnpm run <script> -- <args>` separator passed through verbatim.
      continue;
    }
    if (arg === '--concurrency') {
      concurrency = Number(argv[(i += 1)]);
    } else if (arg === '--runs') {
      runs = Number(argv[(i += 1)]);
    } else if (arg === '--models') {
      models = argv[(i += 1)]
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      experiments.push(arg.replace(/\.ts$/, ''));
    }
  }
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new Error('--concurrency must be a positive integer');
  }
  if (runs !== undefined && (!Number.isInteger(runs) || runs < 1)) {
    throw new Error('--runs must be a positive integer');
  }
  if (models !== undefined && models.length === 0) {
    throw new Error('--models must list at least one model');
  }
  if (experiments.length === 0) {
    experiments.push(
      ...readdirSync(EXPERIMENTS_DIR)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => file.replace(/\.ts$/, '')),
    );
  }
  return { experiments, concurrency, runs, models };
}

async function runExperimentCapped(
  experimentName: string,
  limit: <T>(task: () => Promise<T>) => Promise<T>,
  runsOverride: number | undefined,
  modelsOverride: string[] | undefined,
): Promise<void> {
  const configPath = join(EXPERIMENTS_DIR, `${experimentName}.ts`);
  if (!existsSync(configPath)) {
    throw new Error(`Experiment not found: ${configPath}`);
  }

  const config = await loadConfig(configPath);
  const agent = getAgent(config.agent);
  const apiKey = process.env[agent.getApiKeyEnvVar()] ?? process.env.VERCEL_OIDC_TOKEN;
  if (!apiKey) {
    throw new Error(`${agent.getApiKeyEnvVar()} (or VERCEL_OIDC_TOKEN) is not set`);
  }
  const configuredModels = Array.isArray(config.model)
    ? config.model
    : config.model
      ? [config.model]
      : ['opus'];
  const models = modelsOverride ?? configuredModels;
  const runs = runsOverride ?? config.runs;

  const { fixtures } = loadAllFixtures(EVALS_DIR, { validation: config.validation });
  const evalNames = resolveEvalNames(
    config.evals,
    fixtures.map((fixture) => fixture.name),
  );
  const selected = fixtures.filter((fixture) => evalNames.includes(fixture.name));

  console.log(
    `\n[${experimentName}] ${selected.length} eval(s) × ${runs} run(s) × ${models.length} model(s): ${models.join(', ')}`,
  );

  type AttemptKey = { model: string; fixture: (typeof selected)[number]; runIndex: number };
  const byModelFixture = new Map<string, Array<{ runIndex: number; data: EvalRunData }>>();
  const attempts: AttemptKey[] = [];
  for (const model of models) {
    for (const fixture of selected) {
      byModelFixture.set(`${model}::${fixture.name}`, []);
      for (let runIndex = 0; runIndex < runs; runIndex += 1) {
        attempts.push({ model, fixture, runIndex });
      }
    }
  }

  const startedAt = new Date();
  await Promise.all(
    attempts.map(({ model, fixture, runIndex }) =>
      limit(async () => {
        const label = `${experimentName}-${model}`;
        console.log(`[${label}] ▶ ${fixture.name} run ${runIndex + 1}/${runs}`);
        let data: EvalRunData;
        try {
          const result = await runSingleEval(fixture, {
            agent: config.agent,
            model,
            timeout: config.timeout,
            apiKey,
            setup: config.setup,
            scripts: config.scripts,
            validation: config.validation,
            sandbox: config.sandbox,
            agentOptions: config.agentOptions,
            editPrompt: config.editPrompt,
          });
          data = Array.isArray(result) ? result[0] : result;
        } catch (error) {
          data = {
            result: {
              status: 'failed',
              duration: 0,
              error: error instanceof Error ? error.message : String(error),
            },
          };
        }
        if (config.onRunComplete) {
          const runnableConfig = { ...config, model } as typeof config & { model: string };
          const updated = await config.onRunComplete({
            fixture,
            runIndex,
            config: runnableConfig,
            runData: data,
          });
          if (updated) {
            data = updated;
          }
        }
        byModelFixture.get(`${model}::${fixture.name}`)!.push({ runIndex, data });
        const { status, duration } = data.result;
        console.log(
          `[${label}] ${status === 'passed' ? '✓' : '✗'} ${fixture.name} ` +
            `run ${runIndex + 1} (${duration.toFixed(0)}s)`,
        );
      }),
    ),
  );

  const completedAt = new Date();
  for (const model of models) {
    const summaries = selected.map((fixture) => {
      const ordered = byModelFixture
        .get(`${model}::${fixture.name}`)!
        .sort((a, b) => a.runIndex - b.runIndex)
        .map((entry) => entry.data);
      return createEvalSummary(fixture.name, ordered);
    });

    const perModelConfig = { ...config, model } as typeof config & { model: string };
    const experimentResults = createExperimentResults(
      perModelConfig,
      summaries,
      startedAt,
      completedAt,
    );
    const perModelName = `${experimentName}-${model}`;
    saveResults(experimentResults, {
      resultsDir: RESULTS_DIR,
      experimentName: perModelName,
    });

    for (const summary of summaries) {
      console.log(
        `[${perModelName}] ${summary.name}: ${summary.passedRuns}/${summary.totalRuns} passed`,
      );
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile(join(ROOT, '.env.local'));
  loadEnvFile(join(ROOT, '.env'));

  const { experiments, concurrency, runs, models } = parseArgs(process.argv.slice(2));
  console.log(
    `Running ${experiments.length} experiment(s) at concurrency ${concurrency}: ` +
      `${experiments.join(', ')}` +
      (models ? ` — models override: ${models.join(', ')}` : ''),
  );

  const limit = createLimiter(concurrency);
  for (const experimentName of experiments) {
    await runExperimentCapped(experimentName, limit, runs, models);
  }
  console.log('\nDone. Run `pnpm report` for the matrix.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
