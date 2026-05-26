/**
 * Shared factory for experiment configs. Each `experiments/*.ts` file is a
 * thin call into this — one experiment per (agent, mechanism) pair, so result
 * trees stay cleanly comparable (`results/<experiment-name>/...`).
 */
import type { AgentType, ExperimentConfig } from '@vercel/agent-eval';
import { withCostMetrics } from './cost.js';
import { masqueradeSetup } from './masquerade.js';
import { getMechanismSetup, type Mechanism } from './mechanisms.js';

export interface ExperimentOptions {
  agent: AgentType;
  mechanism: Mechanism;
  /**
   * Models to compare. `scripts/run.ts` runs the eval grid once per model and
   * writes each model's results under `cc-<mechanism>-<model>/`. Override per
   * invocation with `--models` on the runner. @default ['opus', 'sonnet']
   */
  models?: string[];
  /**
   * Runs per eval. `earlyExit` is off so every run is sampled — needed for
   * meaningful pass-rate and mean-cost comparison. @default 3
   */
  runs?: number;
}

/**
 * Last `@anthropic-ai/claude-code` version we've confirmed running green
 * end-to-end. The framework installs `latest` unpinned, and 2.1.149+ regressed
 * with a `JSON.parse` error at an 8 KiB stream boundary that surfaces as
 * `result.json.error = "Bad control character ... at position 8192"`. Bump
 * after re-verifying a newer release in a smoke run.
 */
const CLAUDE_CODE_CLI_VERSION = '2.1.148';

export function defineExperiment(options: ExperimentOptions): ExperimentConfig {
  return {
    agent: options.agent,
    model: options.models ?? ['opus', 'sonnet'],
    runs: options.runs ?? 3,
    earlyExit: false,
    scripts: ['build'],
    timeout: 600,
    copyFiles: 'changed',
    // Masquerade is parked — turning it on causes the Claude CLI to fail with
    // a `Bad control character ... at position 8192` JSON parse error after
    // ~30s on every run. Bisected to the package.json rewrite step; root
    // cause not yet pinned (suspect node_modules state after the framework's
    // subsequent `npm install` against the rewritten spec).
    setup: getMechanismSetup(options.agent, options.mechanism),
    onRunComplete: withCostMetrics,
    agentOptions: {
      cliPackage: `@anthropic-ai/claude-code@${CLAUDE_CODE_CLI_VERSION}`,
    },
  };
}
