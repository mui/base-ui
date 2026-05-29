/**
 * Synthetic patches — the post-cutoff API changes.
 *
 * A patch transforms the *built output* of one or more workspace packages so
 * the installed package diverges from what the model's training and the public
 * docs describe. Documentation is deliberately left untouched: the eval
 * measures whether the agent discovers the real API from package types and
 * `tsc` errors when docs are stale.
 *
 * Evals with no entry here install the unpatched package.
 */
import * as breakingChange from './breaking-change.js';
import * as docsOnlyComposition from './docs-only-composition.js';
import * as newComponent from './new-component.js';
import * as newProp from './new-prop.js';

export interface Patch {
  /** Mutate built packages. Keys are workspace package names, values are build dirs. */
  apply(builtPackages: Record<string, string>): void;
  /**
   * Mutate the staged bundled-docs tree before it's tarred into this eval's
   * `.docs-overlay.tar`. The `stagedDocsDir` is a per-variant copy of the
   * shared docs root (i.e. files live under
   * `<stagedDocsDir>/node_modules/@base-ui/react/docs/react/...`).
   *
   * Only set this when the eval needs synthetic docs that aren't in the
   * real `docs/public/` tree (e.g. a fictional part whose placement rule
   * lives only in docs). Patches without this hook reuse the shared,
   * unpatched docs overlay.
   */
  patchDocs?(stagedDocsDir: string): void;
  /**
   * Mutate a per-variant copy of the built `@base-ui/react` tree (the
   * argument is that copy's root, same layout as a published package).
   * Used by the `inline-dts-agents-md` mechanism to add JSDoc preambles to
   * specific .d.ts files — anything written here lands in the eval's
   * `.inline-dts-overlay.tar`.
   *
   * Common per-component anatomy preambles are applied separately by the
   * pack pipeline before this hook runs, so a patch only needs to add
   * *patch-specific* prose (e.g. `docs-only-composition` documents that
   * `RecentSearches` must nest inside `Empty`).
   */
  patchInlineDts?(reactBuildDir: string): void;
}

export const patches: Record<string, Patch> = {
  'new-component': newComponent,
  'breaking-change': breakingChange,
  'new-prop': newProp,
  'docs-only-composition': docsOnlyComposition,
};
