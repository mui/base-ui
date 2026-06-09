/**
 * Sync the canonical `evals/_EVAL.ts` into every fixture as `EVAL.ts`.
 *
 * Usage:
 *   tsx scripts/sync-evals.ts            # write any out-of-date EVAL.ts
 *   tsx scripts/sync-evals.ts --check    # exit non-zero on drift (CI)
 *
 * Per-fixture differences are gated inside `_EVAL.ts` via `test.skipIf`;
 * every fixture's EVAL.ts is byte-identical to the canonical file.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVALS_DIR = join(ROOT, 'evals');
const CANONICAL = join(EVALS_DIR, '_EVAL.ts');

const isCheck = process.argv.includes('--check');

const canonical = readFileSync(CANONICAL, 'utf8');
const fixtures = readdirSync(EVALS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
  .map((entry) => entry.name);

const touched: string[] = [];
const driftedNames: string[] = [];
let syncedCount = 0;

for (const name of fixtures) {
  const target = join(EVALS_DIR, name, 'EVAL.ts');
  // Skip directories that aren't real fixtures yet (e.g. `bare-install/`
  // scratch dir with no EVAL.ts of its own).
  if (!existsSync(target)) continue;
  syncedCount += 1;
  const current = readFileSync(target, 'utf8');
  if (current === canonical) continue;
  driftedNames.push(name);
  if (!isCheck) {
    writeFileSync(target, canonical);
    touched.push(name);
  }
}

if (isCheck) {
  if (driftedNames.length > 0) {
    console.error(
      `sync-evals --check: drift in ${driftedNames.length} fixture(s):\n  ${driftedNames.join('\n  ')}\nRun \`pnpm sync-evals\` to update.`,
    );
    process.exit(1);
  }
  console.log(`sync-evals --check: all ${syncedCount} fixtures in sync with _EVAL.ts`);
} else if (touched.length > 0) {
  console.log(`Wrote canonical EVAL.ts into:\n  ${touched.join('\n  ')}`);
} else {
  console.log(`All ${syncedCount} fixtures already in sync with _EVAL.ts`);
}
