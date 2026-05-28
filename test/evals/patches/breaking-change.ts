/**
 * Breaking change: the combobox part `Clear` is renamed to `Reset`.
 *
 * A model relying on training writes `<Combobox.Clear>` → `tsc` fails. Only
 * code that discovers the renamed part (`<Combobox.Reset>`) from the package
 * types builds. Patches the `index.parts.d.ts` type entry in both module
 * trees; the runtime `.js` is intentionally left alone (evals only type-check).
 *
 * `patchDocs` mirrors the rename in the bundled docs so doc-pointer arms
 * read a `combobox.md` that already says `Combobox.Reset`. Without it, the
 * docs would still say `Combobox.Clear` and contradict the patched types.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { editFileIfExists } from './util.js';

const PARTS_FILES = ['esm/combobox/index.parts.d.ts', 'combobox/index.parts.d.ts'];

export function apply(builtPackages: Record<string, string>): void {
  const root = builtPackages['@base-ui/react'];
  if (!root) {
    throw new Error('breaking-change patch: @base-ui/react build dir not provided');
  }

  let patched = 0;
  for (const relativePath of PARTS_FILES) {
    if (
      editFileIfExists(join(root, relativePath), 'ComboboxClear as Clear', 'ComboboxClear as Reset')
    ) {
      patched += 1;
    }
  }

  if (patched === 0) {
    throw new Error('breaking-change patch: combobox index.parts.d.ts not found in build output');
  }
}

// API tokens we rewrite in the docs. Order matters: longer/more-specific
// strings come first so that, e.g., `### Clear.Props` is renamed before
// `### Clear\n` would otherwise eat its `### Clear` prefix.
//
// Deliberately excluded: CSS class selectors (`.Clear`) and user-facing
// strings (`aria-label="Clear selection"`) — those aren't API surface and
// a real docs PR following the rename would leave them.
const DOC_RENAMES: Array<[string, string]> = [
  ['### Clear.Props', '### Reset.Props'],
  ['### Clear.State', '### Reset.State'],
  ['### Clear\n', '### Reset\n'],
  ['**Clear Props:**', '**Reset Props:**'],
  ['**Clear Data Attributes:**', '**Reset Data Attributes:**'],
  ['[Clear](/react/components/combobox.md)', '[Reset](/react/components/combobox.md)'],
  ['Combobox.Clear', 'Combobox.Reset'],
  ['ComboboxClear', 'ComboboxReset'],
];

/**
 * Mutate the staged copy of `docs/react/components/combobox.md` so every
 * API-level reference to the `Clear` part becomes `Reset`. Each rename
 * asserts at least one match — a docs restructure that drops one of these
 * anchors fails the bake step rather than silently shipping half-renamed
 * docs.
 */
export function patchDocs(stagedDocsDir: string): void {
  const comboboxMd = join(
    stagedDocsDir,
    'node_modules',
    '@base-ui',
    'react',
    'docs',
    'react',
    'components',
    'combobox.md',
  );

  let content = readFileSync(comboboxMd, 'utf8');
  for (const [from, to] of DOC_RENAMES) {
    if (!content.includes(from)) {
      throw new Error(`breaking-change patchDocs: anchor not found in combobox.md: ${from}`);
    }
    content = content.split(from).join(to);
  }
  writeFileSync(comboboxMd, content);
}
