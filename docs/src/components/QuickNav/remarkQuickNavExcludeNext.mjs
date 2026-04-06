// @ts-check
import { visit } from 'unist-util-visit';

/**
 * `[//]: # (quick-nav-exclude)` (link reference, no output) marks the next heading with
 * `data-exclude-quick-nav` for `rehypeQuickNav` to omit from the TOC.
 *
 * @returns {(tree: import('mdast').Root) => void}
 */
export function remarkQuickNavExcludeNext() {
  return (tree) => {
    let skipNext = false;
    visit(tree, (node) => {
      if (
        node.type === 'definition' &&
        node.url === '#' &&
        node.identifier === '//' &&
        node.title === 'quick-nav-exclude'
      ) {
        skipNext = true;
        return;
      }
      if (node.type === 'heading') {
        if (skipNext) {
          if (!node.data) {
            node.data = {};
          }
          const { data } = node;
          data.hProperties = { ...data.hProperties, 'data-exclude-quick-nav': '' };
        }
        skipNext = false;
      }
    });
  };
}
