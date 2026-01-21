// @ts-check
import { readFileSync, existsSync } from 'node:fs';
import { visitParents } from 'unist-util-visit-parents';
import { kebabCase } from 'es-toolkit/string';
import { join } from 'path';
import { createMdxElement } from 'docs/src/mdx/createMdxElement.mjs';
import { createHast } from 'docs/src/mdx/createHast.mjs';
import {
  getAttributeValue,
  isComponentDef,
  isFunctionDef,
  normalizeReturnValue,
} from './referenceUtils.mjs';

// The "<Reference />" component name as used in MDX
const REFERENCE = 'Reference';

// The corresponding components exposed in "mdx-components.tsx"
const ATTRIBUTES_TABLE = 'AttributesReferenceTable';
const CSS_VARIABLES_TABLE = 'CssVariablesReferenceTable';

const PROPS_TABLE = 'PropsReferenceTable';
const PARAMETERS_TABLE = 'ParametersReferenceTable';
const RETURN_VALUE_TABLE = 'ReturnValueReferenceTable';
const PARAMETERS_HEADING = 'Parameters';
const RETURN_VALUE_HEADING = 'Return value';

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
      const component = getAttributeValue(node, 'component');

      /** @type {string | undefined} */
      const name = getAttributeValue(node, 'name');

      /** @type {string | undefined} */
      const parts = getAttributeValue(node, 'parts');

      /** @type {string | undefined} */
      const asParam = getAttributeValue(node, 'as');

      const referenceName = component ?? name;

      if (!referenceName) {
        throw new Error(`Missing "component" or "name" prop on the "<Reference />" component.`);
      }

      /** @type {import('./types').ComponentDef[]} */
      let componentDefs = [];
      /** @type {import('./types').FunctionDef | null} */
      let functionDef = null;

      if (parts) {
        componentDefs = parts.split(/,\s*/).map((part) => {
          let filename = `${kebabCase(referenceName)}-${kebabCase(part)}.json`;
          let pathname = join(process.cwd(), 'reference/generated', filename);

          if (!existsSync(pathname)) {
            filename = `${kebabCase(part)}.json`;
            pathname = join(process.cwd(), 'reference/generated', filename);
          }

          const jsonContents = readFileSync(pathname, 'utf-8');
          return JSON.parse(jsonContents);
        });
      } else {
        const filename = `${kebabCase(referenceName)}.json`;
        const pathname = join(process.cwd(), 'reference/generated', filename);
        const jsonContents = readFileSync(pathname, 'utf-8');
        const parsedDef = JSON.parse(jsonContents);

        if (isFunctionDef(parsedDef) && !isComponentDef(parsedDef)) {
          functionDef = parsedDef;
        } else {
          componentDefs = [parsedDef];
        }
      }

      const parent = ancestors.slice(-1)[0];
      const index = parent.children.indexOf(node);

      // Replace "<Reference />" with content
      const subtree = functionDef
        ? describeFunction(functionDef)
        : describeComponents(componentDefs, referenceName, parts, asParam);
      parent.children.splice(index, 1, ...subtree);
    });
  };
}

/**
 * Creates tables with components props descriptions.
 *
 * @param {import('./types').ComponentDef[]} componentDefs
 * @param {string} referenceName
 * @param {string | undefined} parts
 * @param {string | undefined} asParam
 */
function describeComponents(componentDefs, referenceName, parts, asParam) {
  return componentDefs.flatMap((def) => {
    const subtree = [];
    const partName =
      parts && def.name.startsWith(referenceName)
        ? def.name.substring(referenceName.length)
        : def.name;

    // Insert an <h3> with the part name and parse descriptions as markdown.
    // Single-part components headings and descriptions aren't displayed
    // because they duplicate the page title and subtitle anyway.
    if (parts) {
      subtree.push(
        createMdxElement({
          name: 'h3',
          children: [{ type: 'text', value: partName }],
          props: {
            id: kebabCase(partName),
          },
        }),
      );

      if (parts && def.description) {
        subtree.push(...createHast(def.description).children);
      }
    }

    if (Object.keys(def.props).length) {
      subtree.push(
        createMdxElement({
          name: PROPS_TABLE,
          props: {
            name:
              asParam && def.name.startsWith(referenceName)
                ? `${asParam}${def.name.substring(referenceName.length)}`
                : def.name,
            data: def.props,
            renameFrom: asParam ? referenceName : undefined,
            renameTo: asParam,
          },
        }),
      );
    }

    if (Object.keys(def.dataAttributes).length) {
      subtree.push(
        createMdxElement({
          name: ATTRIBUTES_TABLE,
          props: { data: def.dataAttributes },
        }),
      );
    }

    if (Object.keys(def.cssVariables).length) {
      subtree.push(
        createMdxElement({
          name: CSS_VARIABLES_TABLE,
          props: { data: def.cssVariables },
        }),
      );
    }

    return subtree;
  });
}

/**
 * Creates tables with function parameters and return value descriptions.
 *
 * @param {import('./types').FunctionDef} functionDef
 */
function describeFunction(functionDef) {
  const subtree = [];
  const parameters = functionDef.parameters ?? {};
  const returnValue = normalizeReturnValue(functionDef.returnValue);

  if (Object.keys(parameters).length) {
    subtree.push(
      createMdxElement({
        name: 'h4',
        children: [{ type: 'text', value: PARAMETERS_HEADING }],
        props: {
          id: `${kebabCase(functionDef.name)}-parameters`,
        },
      }),
    );

    subtree.push(
      createMdxElement({
        name: PARAMETERS_TABLE,
        props: {
          name: `${functionDef.name}-parameters`,
          data: parameters,
        },
      }),
    );
  }

  if (Object.keys(returnValue).length) {
    subtree.push(
      createMdxElement({
        name: 'h4',
        children: [{ type: 'text', value: RETURN_VALUE_HEADING }],
        props: {
          id: `${kebabCase(functionDef.name)}-return-value`,
        },
      }),
    );

    subtree.push(
      createMdxElement({
        name: RETURN_VALUE_TABLE,
        props: {
          name: `${functionDef.name}-return`,
          data: returnValue,
        },
      }),
    );
  }

  return subtree;
}
