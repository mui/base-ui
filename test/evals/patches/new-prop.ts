/**
 * New prop: `closeOnClear` is added to the combobox `Clear` part.
 *
 * A behaviour-only prompt asks for "clearing also dismisses the open list".
 * Without discovering the prop, a model either omits it or builds a wrapper
 * shim — both fail the grader. Patches the `ComboboxClearProps` interface in
 * both module trees' `.d.ts` (evals only type-check, so the runtime is left
 * alone — `tsc` accepting the prop is what the eval exercises).
 *
 * `patchDocs` mirrors the type change in the bundled docs so doc-pointer
 * arms (readme/dts/agents-md/skill) get a fair shot at discovering the
 * prop via the markdown the pointer leads them to. Without it, those arms
 * read stale docs that contradict the patched types.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { editFile, editFileIfExists } from './util.js';

const CLEAR_DTS_FILES = [
  'esm/combobox/clear/ComboboxClear.d.ts',
  'combobox/clear/ComboboxClear.d.ts',
];

// Matches the interface header up to its opening brace; `[^{]` spans newlines.
const INTERFACE_OPEN = /(export interface ComboboxClearProps[^{]*\{)/;

const NEW_MEMBER = `$1
  /**
   * When the field is cleared, also close the popup.
   * @default false
   */
  closeOnClear?: boolean | undefined;`;

export function apply(builtPackages: Record<string, string>): void {
  const root = builtPackages['@base-ui/react'];
  if (!root) {
    throw new Error('new-prop patch: @base-ui/react build dir not provided');
  }

  let patched = 0;
  for (const relativePath of CLEAR_DTS_FILES) {
    if (editFileIfExists(join(root, relativePath), INTERFACE_OPEN, NEW_MEMBER)) {
      patched += 1;
    }
  }

  if (patched === 0) {
    throw new Error('new-prop patch: ComboboxClear.d.ts not found in build output');
  }
}

// Anchor: the **Clear Props:** header through the table divider row. The
// header is unique in combobox.md ([\s\S] crosses the blank line and the
// `| Prop | … |` row). We re-emit the captured chunk and tack the new row
// onto it before the existing first data row.
const CLEAR_PROPS_TABLE_HEADER = /(\*\*Clear Props:\*\*\n\n\| Prop[^\n]*\n\| :-+[^\n]*\n)/;

const CLOSE_ON_CLEAR_ROW =
  '$1| closeOnClear | `boolean` | `false` | Whether the popup should close when the clear button is pressed. |\n';

const CLOSE_ON_CLEAR_SECTION = `

## Closing the popup on clear

Set \`closeOnClear\` on \`Combobox.Clear\` to close the open list when the
clear button is pressed. The default is \`false\` — clearing leaves the
popup open so the user can keep filtering.

\`\`\`jsx
<Combobox.Clear closeOnClear />
\`\`\`
`;

/**
 * Mutate the staged copy of `docs/react/components/combobox.md` so it
 * documents `closeOnClear` in both the Clear Props table and a trailing
 * behavior section.
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

  editFile(comboboxMd, CLEAR_PROPS_TABLE_HEADER, CLOSE_ON_CLEAR_ROW);

  const before = readFileSync(comboboxMd, 'utf8');
  writeFileSync(comboboxMd, before + CLOSE_ON_CLEAR_SECTION);
}
