/**
 * New component: a `Callout` component is added at `@base-ui/react/callout`.
 *
 * The component does not exist in any published Base UI release, so a model
 * cannot know the subpath or name from training. It must discover the new
 * `exports` entry / types from the installed package. The component is
 * authored self-contained (no dependency on Base UI internals) so the patch
 * stays robust across build-layout changes.
 */
import { join } from 'node:path';
import { editJson, writeNewFile } from './util.js';

const DTS = `import * as React from 'react';
/**
 * Callout — a prominent, boxed message used to draw attention to information.
 * Renders a \`<div>\` element.
 *
 * Documentation: [Base UI Callout](https://base-ui.com/react/components/callout)
 */
export declare const Callout: React.ForwardRefExoticComponent<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & React.RefAttributes<HTMLDivElement>
>;
`;

const ESM_JS = `import * as React from 'react';
export const Callout = React.forwardRef(function Callout(props, ref) {
  return React.createElement('div', { ...props, ref });
});
`;

const CJS_JS = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callout = void 0;
const React = require("react");
exports.Callout = React.forwardRef(function Callout(props, ref) {
  return React.createElement('div', { ...props, ref });
});
`;

export function apply(builtPackages: Record<string, string>): void {
  const root = builtPackages['@base-ui/react'];
  if (!root) {
    throw new Error('new-component patch: @base-ui/react build dir not provided');
  }

  // ESM module tree.
  writeNewFile(join(root, 'esm/callout/index.d.ts'), DTS);
  writeNewFile(join(root, 'esm/callout/index.js'), ESM_JS);
  // CommonJS module tree.
  writeNewFile(join(root, 'callout/index.d.ts'), DTS);
  writeNewFile(join(root, 'callout/index.js'), CJS_JS);

  // Expose the new subpath in the package `exports` map (mirrors existing entries).
  editJson(join(root, 'package.json'), (pkg) => {
    if (!pkg.exports || typeof pkg.exports !== 'object') {
      throw new Error('new-component patch: package.json has no exports map');
    }
    pkg.exports['./callout'] = {
      require: { types: './callout/index.d.ts', default: './callout/index.js' },
      import: { types: './esm/callout/index.d.ts', default: './esm/callout/index.js' },
      default: { types: './esm/callout/index.d.ts', default: './esm/callout/index.js' },
    };
  });
}
