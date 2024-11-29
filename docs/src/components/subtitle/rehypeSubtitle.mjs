import { toString } from 'hast-util-to-string';
import { visitParents } from 'unist-util-visit-parents';

/**
 * Unwrap potential paragraphs inside `<Subtitle>`
 */
export function rehypeSubtitle() {
  return (tree) => {
    visitParents(tree, (node, ancestors) => {
      const parent = ancestors.slice(-1)[0];

      if (node.tagName === 'p') {
        console.log(parent?.name, node.tagName, !parent?.name !== 'Subtitle', node.tagName !== 'p');
      }

      if (parent?.name !== 'Subtitle' || node.tagName !== 'p') {
        return;
      }

      const index = parent.children.indexOf(node);
      parent.children.splice(index, 1, ...node.children);
    });
  };
}
