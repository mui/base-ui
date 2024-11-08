import { visitParents } from 'unist-util-visit-parents';

/** Adds basic syntax highlighting to inline `<code>` elements */
export function rehypeInlineCode() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      const name = node.tagName || node.name;
      if (name !== 'code' || ancestors.find(({ tagName }) => tagName === 'pre')) {
        return;
      }

      const [child] = node.children;

      if (child?.type !== 'text') {
        return;
      }

      // Default class
      let className = 'syntax-constant';

      // HTML tags
      if (child.value.match(/^<[a-z].*>$/)) {
        className = 'syntax-tag';
      }

      if (node.type === 'element') {
        node.properties ??= {};
        node.properties.className = className;
      } else if (node.type === 'mdxJsxTextElement') {
        node.attributes ??= [];
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'className',
          value: className,
        });
      }
    });
  };
}
