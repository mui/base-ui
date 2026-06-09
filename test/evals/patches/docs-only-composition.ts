/**
 * Docs-only composition: a fictional `Combobox.RecentSearches` part whose
 * canonical placement (inside `Combobox.Empty`) is documented only in the
 * bundled docs. Types accept the part anywhere; a baseline agent has no
 * way to know where to put it.
 *
 * Two mutations land in different artifacts:
 *
 * - **Types**: add the part's `.d.ts` + a stub `.js` runtime in both module
 *   trees (CJS and ESM), and register the export in `index.parts.{d.ts,js}`.
 *   Patterned on `patches/new-component.ts`, but the new part lives inside
 *   the existing `combobox` subpath rather than at a new subpath.
 * - **Docs** (`patchDocs`): edit the staged copy of
 *   `docs/react/components/combobox.md` to (a) add `<Combobox.RecentSearches>`
 *   inside `<Combobox.Empty>` in the Anatomy block and (b) append a "Recent
 *   searches" section explaining the placement rule.
 * - **Inline .d.ts** (`patchInlineDts`): replace the default `DTS` JSDoc on
 *   `ComboboxRecentSearches` with a version that documents the placement
 *   rule directly. This is the content the `inline-dts-agents-md`
 *   mechanism ships in place of the markdown overlay.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { editFile, writeNewFile } from './util.js';

const DTS = `import * as React from 'react';
/**
 * Surface for recently-used search terms inside an empty state.
 * Renders a \`<div>\` element. Pairs with \`Combobox.Empty\` — see the
 * bundled docs for the recommended placement.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxRecentSearches: React.ForwardRefExoticComponent<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & React.RefAttributes<HTMLDivElement>
>;
`;

const ESM_JS = `import * as React from 'react';
export const ComboboxRecentSearches = React.forwardRef(function ComboboxRecentSearches(props, ref) {
  return React.createElement('div', { ...props, ref, 'data-recent-searches': '' });
});
`;

const CJS_JS = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboboxRecentSearches = void 0;
const React = require("react");
exports.ComboboxRecentSearches = React.forwardRef(function ComboboxRecentSearches(props, ref) {
  return React.createElement('div', { ...props, ref, 'data-recent-searches': '' });
});
`;

const NEW_PART_TYPE_EXPORT =
  '\nexport { ComboboxRecentSearches as RecentSearches } from "./recent-searches/ComboboxRecentSearches.js";';

const NEW_PART_ESM_JS_EXPORT =
  '\nexport { ComboboxRecentSearches as RecentSearches } from "./recent-searches/ComboboxRecentSearches.js";\n';

const NEW_PART_CJS_PROPERTY = `Object.defineProperty(exports, "RecentSearches", {
  enumerable: true,
  get: function () {
    return _ComboboxRecentSearches.ComboboxRecentSearches;
  }
});
`;

const NEW_PART_CJS_REQUIRE =
  '\nvar _ComboboxRecentSearches = require("./recent-searches/ComboboxRecentSearches");\n';

export function apply(builtPackages: Record<string, string>): void {
  const root = builtPackages['@base-ui/react'];
  if (!root) {
    throw new Error('docs-only-composition patch: @base-ui/react build dir not provided');
  }

  // ESM tree.
  writeNewFile(join(root, 'esm/combobox/recent-searches/ComboboxRecentSearches.d.ts'), DTS);
  writeNewFile(join(root, 'esm/combobox/recent-searches/ComboboxRecentSearches.js'), ESM_JS);
  // The ESM index.parts.{d.ts,js} are pure ES modules — append a re-export line.
  appendLine(join(root, 'esm/combobox/index.parts.d.ts'), NEW_PART_TYPE_EXPORT);
  appendLine(join(root, 'esm/combobox/index.parts.js'), NEW_PART_ESM_JS_EXPORT);

  // CJS tree.
  writeNewFile(join(root, 'combobox/recent-searches/ComboboxRecentSearches.d.ts'), DTS);
  writeNewFile(join(root, 'combobox/recent-searches/ComboboxRecentSearches.js'), CJS_JS);
  appendLine(join(root, 'combobox/index.parts.d.ts'), NEW_PART_TYPE_EXPORT);
  // The CJS parts.js uses Object.defineProperty + require — append both.
  appendLine(
    join(root, 'combobox/index.parts.js'),
    '\n' + NEW_PART_CJS_PROPERTY + NEW_PART_CJS_REQUIRE,
  );
}

function appendLine(file: string, text: string): void {
  const content = readFileSync(file, 'utf8');
  writeFileSync(file, content + text);
}

/**
 * Edit the staged docs tree (per-variant copy) so the combobox reference now
 * documents the `Combobox.RecentSearches` placement rule. The agent only
 * learns *where* to put the part by reading this — types accept any position.
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

  // Place `<Combobox.RecentSearches />` inside the existing `<Combobox.Empty />`
  // self-closing tag in the Anatomy block.
  editFile(
    comboboxMd,
    /        <Combobox\.Status \/>\n        <Combobox\.Empty \/>/,
    `        <Combobox.Status />
        <Combobox.Empty>
          <Combobox.RecentSearches />
        </Combobox.Empty>`,
  );

  // Append a Recent searches section explaining the placement rule.
  const addendum = `

## Recent searches

Render \`Combobox.RecentSearches\` **inside** \`Combobox.Empty\` to show the
user's recent search terms when the typed filter has no matches. The part is
only meaningful in that position — placing it outside the empty region has no
effect and the filter's empty state will not surface it.

\`\`\`jsx
<Combobox.Empty>
  <Combobox.RecentSearches>{/* recent terms */}</Combobox.RecentSearches>
</Combobox.Empty>
\`\`\`
`;
  const before = readFileSync(comboboxMd, 'utf8');
  writeFileSync(comboboxMd, before + addendum);
}

const DTS_WITH_PLACEMENT_RULE = `import * as React from 'react';
/**
 * Surface for recently-used search terms inside an empty state.
 * Renders a \`<div>\` element.
 *
 * **Placement:** render \`Combobox.RecentSearches\` **inside**
 * \`Combobox.Empty\` so it surfaces when the typed filter has no matches.
 * The part is only meaningful in that position — placing it outside the
 * empty region has no effect.
 *
 * \`\`\`jsx
 * <Combobox.Empty>
 *   <Combobox.RecentSearches>{/* recent terms */}</Combobox.RecentSearches>
 * </Combobox.Empty>
 * \`\`\`
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxRecentSearches: React.ForwardRefExoticComponent<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & React.RefAttributes<HTMLDivElement>
>;
`;

/**
 * Two mutations on the inline-dts overlay:
 *
 * 1. Overwrite `ComboboxRecentSearches.d.ts` so its JSDoc documents the
 *    placement rule (the default `DTS` from `apply` only mentions the
 *    part exists).
 * 2. Edit the anatomy preamble the pack pipeline has prepended to
 *    `combobox/index.parts.d.ts` so the JSX tree shows
 *    `<Combobox.RecentSearches />` nested inside `<Combobox.Empty>` —
 *    mirroring what `patchDocs` does for the markdown Anatomy block.
 */
export function patchInlineDts(reactBuildDir: string): void {
  for (const dir of ['combobox', 'esm/combobox']) {
    const recentSearches = join(reactBuildDir, dir, 'recent-searches/ComboboxRecentSearches.d.ts');
    writeFileSync(recentSearches, DTS_WITH_PLACEMENT_RULE);

    const partsDts = join(reactBuildDir, dir, 'index.parts.d.ts');
    const before = readFileSync(partsDts, 'utf8');
    const anatomyAnchor = ' *         <Combobox.Status />\n *         <Combobox.Empty />\n';
    if (!before.includes(anatomyAnchor)) {
      throw new Error(
        `docs-only-composition patchInlineDts: anatomy preamble missing Empty anchor in ${partsDts}`,
      );
    }
    const replacement =
      ' *         <Combobox.Status />\n' +
      ' *         <Combobox.Empty>\n' +
      ' *           <Combobox.RecentSearches />\n' +
      ' *         </Combobox.Empty>\n';
    writeFileSync(partsDts, before.replace(anatomyAnchor, replacement));
  }
}
