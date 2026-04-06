// @ts-check
import { visit } from 'unist-util-visit';

/**
 * A markdown link definition `[//]: # 'quick-nav-exclude'` renders no visible output.
 * When placed immediately before a heading, this plugin marks that heading with
 * `data-exclude-quick-nav` so `rehypeQuickNav` omits it from the TOC.
 *
 * @returns {function(*): void}
 */
export function remarkQuickNavExcludeHeading() {
  return (tree) => {
    visit(tree, 'definition', (node, index, parent) => {
      if (
        node.url === '#' &&
        node.identifier === '//' &&
        node.title === 'quick-nav-exclude' &&
        parent &&
        index != null
      ) {
        const next = parent.children[index + 1];
        if (next?.type === 'heading') {
          if (!next.data) {
            next.data = {};
          }
          next.data.hProperties = { ...next.data.hProperties, 'data-exclude-quick-nav': '' };
        }
      }
    });
  };
}
