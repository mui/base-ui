import { visitParents } from 'unist-util-visit-parents';

/** Move line breaks from outside of empty [data-line] elements inside them for styling purposes */
export function rehypeEmptyLines() {
  return (tree) => {
    // Insert line breaks into empty [data-line] elements
    visitParents(tree, (node) => {
      if (node.properties?.['data-line'] === '' && node.children?.length === 0) {
        node.children.push({ type: 'text', value: '\n' });
      }
    });

    // Remove line breaks from elements that don't belong to lines
    visitParents(tree, (node, ancestors) => {
      if (
        node.type === 'text' &&
        node.value === '\n' &&
        ancestors.find(({ tagName }) => tagName === 'pre') &&
        !ancestors.find((ancestor) => ancestor.properties?.['data-line'])
      ) {
        const parent = ancestors.slice(-1)[0];
        const index = parent.children.indexOf(node);
        parent.children.splice(index, 1);
      }
    });
  };
}
