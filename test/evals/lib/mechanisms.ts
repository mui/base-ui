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
import type { AgentType, Sandbox, SetupFunction } from '@vercel/agent-eval';

export type Mechanism =
  | 'baseline'
  | 'agents-md'
  | 'skill'
  | 'bundled-docs'
  | 'mcp'
  // Discoverability ablation: docs in node_modules + a single pointer telling
  // the agent the docs are there. Each layers one pointer on top of the
  // bundled-docs setup so we can measure each pointer's marginal value.
  | 'bundled-docs-readme'
  | 'bundled-docs-dts'
  | 'bundled-docs-agents-md'
  | 'bundled-docs-skill'
  // Content-channel comparison: prose inlined as JSDoc on the .d.ts files
  // (composition/anatomy + patch-specific placement rules) instead of as a
  // separate markdown overlay. Pointer is a Next.js-style AGENTS.md.
  | 'inline-dts-agents-md';

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
export function getMechanismSetup(
  agent: AgentType,
  mechanism: Mechanism,
): SetupFunction | undefined {
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
      return async (sandbox) => {
        await extractDocsOverlay(sandbox);
      };

    case 'bundled-docs-readme':
      return async (sandbox) => {
        await extractDocsOverlay(sandbox);
        // Overwrite the package README with one that mentions docs/.
        await sandbox.writeFiles({
          'node_modules/@base-ui/react/README.md': asset('bundled-docs-readme/README.md'),
        });
      };

    case 'bundled-docs-dts':
      return async (sandbox) => {
        await extractDocsOverlay(sandbox);
        // Prepend a JSDoc @packageDocumentation block to the package's main
        // .d.ts so an agent reading types lands on the docs-location hint.
        const preamble = asset('bundled-docs-dts/preamble.txt');
        await sandbox.writeFiles({ '.docs-preamble.txt': preamble });
        const result = await sandbox.runCommand('bash', [
          '-c',
          'cat .docs-preamble.txt node_modules/@base-ui/react/index.d.ts ' +
            '> node_modules/@base-ui/react/index.d.ts.new && ' +
            'mv node_modules/@base-ui/react/index.d.ts.new ' +
            'node_modules/@base-ui/react/index.d.ts && ' +
            'rm .docs-preamble.txt',
        ]);
        if (result.exitCode !== 0) {
          throw new Error(
            'bundled-docs-dts setup: failed to prepend preamble ' +
              `(exit ${result.exitCode}):\n${result.stdout}\n${result.stderr}`,
          );
        }
      };

    case 'bundled-docs-agents-md':
      return async (sandbox) => {
        await extractDocsOverlay(sandbox);
        await sandbox.writeFiles({
          'AGENTS.md': asset('bundled-docs-agents-md/AGENTS.md'),
          'CLAUDE.md': '@AGENTS.md\n',
        });
      };

    case 'bundled-docs-skill':
      return async (sandbox) => {
        await extractDocsOverlay(sandbox);
        await sandbox.writeFiles({
          '.claude/skills/base-ui/SKILL.md': asset('bundled-docs-skill/SKILL.md'),
        });
      };

    case 'mcp':
      return async (sandbox) => {
        await sandbox.writeFiles({ '.mcp.json': asset('mcp/mcp.json') });
      };

    case 'inline-dts-agents-md':
      return async (sandbox) => {
        await extractInlineDtsOverlay(sandbox);
        await sandbox.writeFiles({
          'AGENTS.md': asset('inline-dts-agents-md/AGENTS.md'),
          'CLAUDE.md': '@AGENTS.md\n',
        });
      };

    default: {
      const exhaustive: never = mechanism;
      throw new Error(`Unknown mechanism: ${exhaustive}`);
    }
  }
}

/**
 * Layer the docs overlay onto the already-rehydrated node_modules. PR #4761
 * ships docs/*.md inside @base-ui/react's published tarball; we emit those as
 * a separate `.docs-overlay.tar` (rather than fattening every fixture's
 * `.deps.tar`) so only mechanisms that opt in pay for them. The `rehydrate`
 * wrapper deletes the tarball after the mechanism setup runs.
 */
async function extractDocsOverlay(sandbox: Sandbox): Promise<void> {
  const result = await sandbox.runCommand('tar', ['-xf', '.docs-overlay.tar']);
  if (result.exitCode !== 0) {
    throw new Error(
      'bundled-docs setup: failed to extract .docs-overlay.tar ' +
        `(exit ${result.exitCode}):\n${result.stdout}\n${result.stderr}`,
    );
  }
}

/**
 * Layer the inline-dts overlay onto the rehydrated node_modules. Mirrors
 * `extractDocsOverlay` but ships a different content channel: per-eval
 * .d.ts files with JSDoc preambles inlined (anatomy + patch-specific
 * placement rules). `tar -xf` overwrites the existing .d.ts files in
 * `node_modules/@base-ui/react/` in place.
 */
async function extractInlineDtsOverlay(sandbox: Sandbox): Promise<void> {
  const result = await sandbox.runCommand('tar', ['-xf', '.inline-dts-overlay.tar']);
  if (result.exitCode !== 0) {
    throw new Error(
      'inline-dts setup: failed to extract .inline-dts-overlay.tar ' +
        `(exit ${result.exitCode}):\n${result.stdout}\n${result.stderr}`,
    );
  }
}
