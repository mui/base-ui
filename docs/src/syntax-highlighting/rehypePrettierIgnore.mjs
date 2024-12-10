import { toString } from 'hast-util-to-string';
import { visitParents } from 'unist-util-visit-parents';

/** Remove code block line nodes that include "prettier-ignore" as text */
export function rehypePrettierIgnore() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      if (
        node.type === 'text' &&
        ancestors.find(({ tagName }) => tagName === 'pre') &&
        toString(node).includes('prettier-ignore')
      ) {
        const code = ancestors.slice(-3)[0];
        const line = ancestors.slice(-2)[0];
        const index = code.children.indexOf(line);
        // Remove the line and the line break after
        code.children.splice(index, 2);
      }
    });
  };
}
