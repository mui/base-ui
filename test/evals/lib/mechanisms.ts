/**
 * Knowledge mechanisms — the independent variable of the eval matrix.
 *
 * Each mechanism is a `setup` function that runs in the sandbox before
 * `npm install`. It injects the files that make the agent aware of Base UI in
 * one particular way. Payloads live in `lib/assets/` and reflect *current
 * published* Base UI — they are never hand-patched to a synthetic change.
 *
 * The lookup is keyed by agent so a future Codex arm can supply its own
 * skill/MCP payloads (Codex does not read `.claude/skills` or `.mcp.json`).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentType, SetupFunction } from '@vercel/agent-eval';

export type Mechanism = 'baseline' | 'agents-md' | 'skill' | 'bundled-docs' | 'mcp';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'assets');

function asset(relativePath: string): string {
  return readFileSync(join(ASSETS_DIR, relativePath), 'utf8');
}

function isClaudeCode(agent: AgentType): boolean {
  return agent === 'claude-code' || agent === 'vercel-ai-gateway/claude-code';
}

/**
 * Resolve the `setup` function for an (agent, mechanism) pair.
 * Returns `undefined` for the baseline (no setup needed).
 */
export function getMechanismSetup(agent: AgentType, mechanism: Mechanism): SetupFunction | undefined {
  if (!isClaudeCode(agent)) {
    throw new Error(
      `Mechanism setups are only implemented for Claude Code; got "${agent}". ` +
        'Add agent-specific payloads to lib/mechanisms.ts before running other agents.',
    );
  }

  switch (mechanism) {
    case 'baseline':
      return undefined;

    case 'agents-md':
      return async (sandbox) => {
        await sandbox.writeFiles({
          'AGENTS.md': asset('agents-md/AGENTS.md'),
          // Mirror the base-ui repo convention so Claude Code reliably loads it.
          'CLAUDE.md': '@AGENTS.md\n',
        });
      };

    case 'skill':
      return async (sandbox) => {
        await sandbox.writeFiles({
          '.claude/skills/base-ui/SKILL.md': asset('skill/SKILL.md'),
        });
      };

    case 'bundled-docs':
      // PR #4761 ships the docs/ markdown inside @base-ui/react's package.
      // pack.ts emits the docs as a separate `.docs-overlay.tar` rather than
      // bloating every fixture's `.deps.tar`; here we layer it onto the
      // already-populated `node_modules/@base-ui/react/docs/`. The rehydrate
      // wrapper deletes the tarball after this runs.
      return async (sandbox) => {
        const result = await sandbox.runCommand('tar', ['-xf', '.docs-overlay.tar']);
        if (result.exitCode !== 0) {
          throw new Error(
            'bundled-docs setup: failed to extract .docs-overlay.tar ' +
              `(exit ${result.exitCode}):\n${result.stdout}\n${result.stderr}`,
          );
        }
      };

    case 'mcp':
      return async (sandbox) => {
        await sandbox.writeFiles({ '.mcp.json': asset('mcp/mcp.json') });
      };

    default: {
      const exhaustive: never = mechanism;
      throw new Error(`Unknown mechanism: ${exhaustive}`);
    }
  }
}
