import { visitParents } from 'unist-util-visit-parents';

/**
 * - Adds a `data-inline-code` attribute to distinguish inline code from code blocks
 * - Tweaks how syntax highlighting works for tags
 */
export function rehypeInlineCode() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      const name = node.tagName || node.name;
      if (name !== 'code' || ancestors.find(({ tagName }) => tagName === 'pre')) {
        return;
      }

      if (node.type === 'element') {
        node.properties ??= {};
        node.properties['data-inline-code'] = '';
      } else if (node.type === 'mdxJsxTextElement') {
        node.attributes ??= [];
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'data-inline-code',
          value: '',
        });
      }

      // TODO Tweak how syntax highlighting works for tags
    });
  };
}
