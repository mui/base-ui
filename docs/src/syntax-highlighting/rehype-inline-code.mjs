import { visitParents } from 'unist-util-visit-parents';

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
      if (child.value.match(/^<[a-z].+>$/)) {
        node.properties ??= {};
        node.properties.style = { color: 'var(--syntax-tag)' };
        return;
      }

      // Everything else
      node.properties ??= {};
      node.properties.style = { color: 'var(--syntax-constant)' };
    });
  };
}
