/**
 * Shared factory for experiment configs. Each experiment file under
 * experiments/ is a thin call into this — one experiment per (agent,
 * mechanism) pair, so result trees stay cleanly comparable
 * (results/<experiment-name>/...).
 */
import type { AgentType, ExperimentConfig, SetupFunction } from '@vercel/agent-eval';
import { withCostMetrics } from './cost.js';
import { getMechanismSetup, type Mechanism } from './mechanisms.js';

/**
 * The framework's fixture upload excludes node_modules (and dereferences any
 * symlinks it does ship). The pack pipeline tars its pre-installed dependency
 * tree into `.deps.tar` and (for the bundled-docs arm) a `.docs-overlay.tar`
 * with the docs payload. We extract `.deps.tar` first so the mechanism setup
 * runs against a populated `node_modules`, then clean up both tarballs after
 * the mechanism runs — so by the time the agent sees the workspace, the
 * tarballs are gone but the docs overlay (if applied) is in node_modules.
 */
function rehydrateDeps(inner: SetupFunction | undefined): SetupFunction {
  return async (sandbox) => {
    const extract = await sandbox.runCommand('bash', [
      '-c',
      'rm -rf node_modules && tar -xf .deps.tar',
    ]);
    if (extract.exitCode !== 0) {
      throw new Error(
        'rehydrate: failed to extract .deps.tar ' +
          `(exit ${extract.exitCode}):\n${extract.stdout}\n${extract.stderr}`,
      );
    }
    if (inner) {
      await inner(sandbox);
    }
    const cleanup = await sandbox.runCommand('bash', [
      '-c',
      'rm -f .deps.tar .docs-overlay.tar',
    ]);
    if (cleanup.exitCode !== 0) {
      throw new Error(
        'rehydrate: failed to clean up tarballs ' +
          `(exit ${cleanup.exitCode}):\n${cleanup.stdout}\n${cleanup.stderr}`,
      );
    }
  };
}

export interface ExperimentOptions {
  agent: AgentType;
  mechanism: Mechanism;
  /**
   * Models to compare. `scripts/run.ts` runs the eval grid once per model and
   * writes each model's results under `cc-<mechanism>-<model>/`. Override per
   * invocation with `--model` on the runner. @default ['sonnet']
   */
  models?: string[];
  /**
   * Runs per eval. `earlyExit` is off so every run is sampled — needed for
   * meaningful pass-rate and mean-cost comparison. @default 3
   */
  runs?: number;
}

/**
 * Last @anthropic-ai/claude-code version we've confirmed running green
 * end-to-end. The framework installs latest unpinned, and 2.1.149+ regressed
 * with a JSON.parse error at an 8 KiB stream boundary that surfaces as
 * result.json.error = "Bad control character ... at position 8192". Bump
 * after re-verifying a newer release in a smoke run.
 */
const CLAUDE_CODE_CLI_VERSION = '2.1.148';

export function defineExperiment(options: ExperimentOptions): ExperimentConfig {
  return {
    agent: options.agent,
    model: options.models ?? ['sonnet'],
    runs: options.runs ?? 3,
    earlyExit: false,
    scripts: ['build'],
    timeout: 600,
    copyFiles: 'changed',
    setup: rehydrateDeps(getMechanismSetup(options.agent, options.mechanism)),
    onRunComplete: withCostMetrics,
    agentOptions: {
      cliPackage: `@anthropic-ai/claude-code@${CLAUDE_CODE_CLI_VERSION}`,
    },
  };
}
