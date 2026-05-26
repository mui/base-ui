/**
 * Breaking change: the combobox part `Clear` is renamed to `Reset`.
 *
 * A model relying on training writes `<Combobox.Clear>` → `tsc` fails. Only
 * code that discovers the renamed part (`<Combobox.Reset>`) from the package
 * types builds. Patches the `index.parts.d.ts` type entry in both module
 * trees; the runtime `.js` is intentionally left alone (evals only type-check).
 */
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
    if (editFileIfExists(join(root, relativePath), 'ComboboxClear as Clear', 'ComboboxClear as Reset')) {
      patched += 1;
    }
  }

  if (patched === 0) {
    throw new Error('breaking-change patch: combobox index.parts.d.ts not found in build output');
  }
}
