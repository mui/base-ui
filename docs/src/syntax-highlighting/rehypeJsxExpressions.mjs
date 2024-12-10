import { toString } from 'hast-util-to-string';
import { visitParents } from 'unist-util-visit-parents';

/** Remove the annoying trailing semicolon from solo JSX expressions, like in Anatomy code blocks */
export function rehypeJsxExpressions() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      // First, filter out nodes that seem like a potential match
      if (node.value?.includes('>;')) {
        const line = ancestors.find((ancestor) => ancestor.properties?.['data-line'] !== undefined);

        // Verify that the line passes a stricter check
        if (/^\s*<.+>;\s*$/.test(toString(line))) {
          node.value = node.value.replace('>;', '>');
        }
      }
    });
  };
}
