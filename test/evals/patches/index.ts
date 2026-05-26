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
import * as newComponent from './new-component.js';
import * as newProp from './new-prop.js';

export interface Patch {
  /** Mutate built packages. Keys are workspace package names, values are build dirs. */
  apply(builtPackages: Record<string, string>): void;
}

export const patches: Record<string, Patch> = {
  'new-component': newComponent,
  'breaking-change': breakingChange,
  'new-prop': newProp,
};
