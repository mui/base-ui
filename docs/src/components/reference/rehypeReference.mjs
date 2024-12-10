// @ts-check
import { readFileSync, existsSync } from 'node:fs';
import { visitParents } from 'unist-util-visit-parents';
import kebabCase from 'lodash/kebabCase.js';
import startCase from 'lodash/startCase.js';
import { join } from 'path';
import { createMdxElement } from 'docs/src/mdx/createMdxElement.mjs';
import { createHast } from 'docs/src/mdx/createHast.mjs';

// The "<Reference />" component name as used in MDX
const REFERENCE = 'Reference';

// The corresponding components exposed in "mdx-components.tsx"
const ATTRIBUTES_TABLE = 'AttributesTable';
const CSS_VARIABLES_TABLE = 'CssVariablesTable';
const PROPS_TABLE = 'PropsTable';

/**
 * Finds `<Reference />` in the MDX and transforms it into
 * API reference content for the specified component.
 *
 * @returns {function(*, *): void}
 */
export function rehypeReference() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      if (node.name !== REFERENCE) {
        return;
      }

      /** @type {string | undefined} */
      const component = node.attributes.find(
        /** @param {{ name: string; }} attr */
        (attr) => attr.name === 'component',
      )?.value;

      /** @type {string | undefined} */
      const parts = node.attributes.find(
        /** @param {{ name: string; }} attr */
        (attr) => attr.name === 'parts',
      )?.value;

      if (!component) {
        throw new Error(`Missing "component" prop on the "<Reference />" component.`);
      }

      /** @type {import('./types').ComponentDef[]} */
      let componentDefs = [];

      if (parts) {
        componentDefs = parts.split(/,\s*/).map((part) => {
          let filename = `${kebabCase(component)}-${kebabCase(part)}.json`;
          let pathname = join(process.cwd(), 'reference/generated', filename);

          if (!existsSync(pathname)) {
            filename = `${kebabCase(part)}.json`;
            pathname = join(process.cwd(), 'reference/generated', filename);
          }

          const jsonContents = readFileSync(pathname, 'utf-8');
          return JSON.parse(jsonContents);
        });
      } else {
        const filename = `${kebabCase(component)}.json`;
        const pathname = join(process.cwd(), 'reference/generated', filename);
        const jsonContents = readFileSync(pathname, 'utf-8');
        componentDefs = [JSON.parse(jsonContents)];
      }

      const parent = ancestors.slice(-1)[0];
      const index = parent.children.indexOf(node);

      // Replace "<Reference />" with content
      parent.children.splice(
        index,
        1,
        ...componentDefs.flatMap((def) => {
          const subtree = [];
          const name =
            parts && def.name.startsWith(component)
              ? startCase(def.name.substring(component.length))
              : startCase(def.name);

          // Insert an <h3> with the part name and parse descriptions as markdown.
          // Single-part components headings and descriptions aren't displayed
          // because they duplicate the page title and subtitle anyway.
          if (parts) {
            subtree.push(
              createMdxElement({
                name: 'h3',
                children: [{ type: 'text', value: name }],
              }),
            );

            if (parts && def.description) {
              subtree.push(...createHast(def.description).children);
            }
          }

          subtree.push(
            createMdxElement({
              name: PROPS_TABLE,
              props: { data: def.props },
            }),
          );

          if (def.attributes) {
            subtree.push(
              createMdxElement({
                name: ATTRIBUTES_TABLE,
                props: { data: def.attributes },
              }),
            );
          }

          if (def.cssVariables) {
            subtree.push(
              createMdxElement({
                name: CSS_VARIABLES_TABLE,
                props: { data: def.cssVariables },
              }),
            );
          }

          return subtree;
        }),
      );
    });
  };
}
