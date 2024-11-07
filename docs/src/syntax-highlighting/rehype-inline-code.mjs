import { visitParents } from 'unist-util-visit-parents';

/** Adds basic syntax highlighting to inline `<code>` elements */
export function rehypeInlineCode() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      if (node.tagName !== 'code' || ancestors.find(({ tagName }) => tagName === 'pre')) {
        return;
      }

      const [child] = node.children;

      if (child?.type !== 'text') {
        return;
      }

      // HTML tags
      if (child.value.match(/^<[a-z].*>$/)) {
        node.properties ??= {};
        node.properties.className = 'syntax-tag';
        return;
      }

      // Everything else
      node.properties ??= {};
      node.properties.className = 'syntax-constant';
    });
  };
}
