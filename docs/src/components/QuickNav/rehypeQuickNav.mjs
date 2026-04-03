// @ts-check
import { createMdxElement } from 'docs/src/mdx/createMdxElement.mjs';

const ROOT = 'QuickNav.Root';
const TITLE = 'QuickNav.Title';
const CONTENT = 'QuickNav.Content';
const LIST = 'QuickNav.List';
const ITEM = 'QuickNav.Item';
const LINK = 'QuickNav.Link';

/**
 * @typedef {Object} TocEntry
 * @property {string} value
 * @property {number} depth
 * @property {string} [id]
 * @property {TocEntry[]} [children]
 */

/**
 * @returns {function(*, *): void}
 */
export function rehypeQuickNav() {
  return (tree, file) => {
    /** @type {TocEntry[]} */
    const toc = file.data.toc ?? [];
    const content = createMdxElement({
      name: CONTENT,
      children: tree.children,
    });

    if (!toc.length) {
      tree.children = [content];
      return;
    }

    const root = createMdxElement({
      name: ROOT,
      children: toc.flatMap(getNodeFromEntry).filter(Boolean),
    });
    tree.children = [root, content];
  };
}

/**
 * @param {TocEntry} entry
 * @returns {Record<string, unknown> | Record<string, unknown>[]}
 */
function getNodeFromEntry({ value, depth, id, children }) {
  const sub = createMdxElement({
    name: LIST,
    children: [],
  });

  // Ignore <h4>'s and below
  if (depth < 3 && children?.length) {
    sub.children = children.map(getNodeFromEntry);
  }

  if (depth === 1) {
    // Insert "(Top)" link
    sub.children?.unshift(getNodeFromEntry({ value: '(Top)', id: '', depth: 2 }));

    return [
      // Insert a top-level title
      createMdxElement({
        name: TITLE,
        children: [{ type: 'text', value }],
      }),
      sub,
    ];
  }

  const link = createMdxElement({
    name: LINK,
    children: [{ type: 'text', value }],
    props: {
      href: `#${id}`,
    },
  });

  return createMdxElement({
    name: ITEM,
    children: [link, sub],
  });
}
