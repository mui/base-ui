import { visit } from 'unist-util-visit';
import { join, dirname } from 'path';
import camelCase from 'lodash/camelCase.js';
import upperFirst from 'lodash/upperFirst.js';

/**
 * Enhances `<Demo>` components in MDX:
 * - Converts `path` prop value into an absolute pathname
 * - Adds `scope` prop based on the `path` value
 * - Adds corresponding import statements for the live demo components
 *
 * Example input:
 * ```
 * <Demo path="./foo/bar" />
 * ```
 *
 * Corresponding output:
 * ```
 * import * as FooBar from './foo/bar';
 * <Demo path="/absolute/path/to/foo/bar" scope={FooBar} />
 * ```
 */
export function rehypeDemos() {
  return (tree, file) => {
    const paths = [];

    visit(tree, (node) => {
      if (node.name === 'Demo' && node.attributes) {
        const path = node.attributes.find(({ name }) => name === 'path');

        if (!path?.value) {
          return;
        }

        paths.push(path.value);
        const importName = upperFirst(camelCase(path.value));
        path.value = join(dirname(file.path), path.value);

        // Add `scope` prop
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'scope',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: importName,
            data: {
              estree: {
                type: 'Program',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'Identifier',
                      name: importName,
                    },
                  },
                ],
                sourceType: 'module',
                comments: [],
              },
            },
          },
        });
      }
    });

    // For each path we saw, insert import statements at the start of the file
    for (const value of paths) {
      const importName = upperFirst(camelCase(value));
      tree.children.unshift({
        type: 'mdxjsEsm',
        value: `import * as ${importName} from '${value}';`,
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [
                  {
                    type: 'ImportNamespaceSpecifier',
                    local: {
                      type: 'Identifier',
                      name: importName,
                    },
                  },
                ],
                source: {
                  type: 'Literal',
                  value: `${value}`,
                  raw: `'${value}'`,
                },
              },
            ],
            sourceType: 'module',
            comments: [],
          },
        },
      });
    }
  };
}
