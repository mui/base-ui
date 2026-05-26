/**
 * New prop: `closeOnClear` is added to the combobox `Clear` part.
 *
 * A behaviour-only prompt asks for "clearing also dismisses the open list".
 * Without discovering the prop, a model either omits it or builds a wrapper
 * shim — both fail the grader. Patches the `ComboboxClearProps` interface in
 * both module trees' `.d.ts` (evals only type-check, so the runtime is left
 * alone — `tsc` accepting the prop is what the eval exercises).
 */
import { join } from 'node:path';
import { editFileIfExists } from './util.js';

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
