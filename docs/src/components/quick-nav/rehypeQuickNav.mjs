// @ts-check
import { createMdxElement } from 'docs/src/mdx/createMdxElement.mjs';

const ROOT = 'QuickNav.Root';
const TITLE = 'QuickNav.Title';
const LIST = 'QuickNav.List';
const ITEM = 'QuickNav.Item';
const LINK = 'QuickNav.Link';
const DOC_SUBTITLE = 'Subtitle';

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
    const h1 = tree.children.find(
      /** @param {{ tagName: string; }} node */
      (node) => node.tagName === 'h1',
    );

    /** @type {TocEntry[]} */
    const toc = file.data.toc;
    const root = createMdxElement({
      name: ROOT,
      children: toc.flatMap(getNodeFromEntry).filter(Boolean),
    });

    if (!toc.length) {
      return;
    }

    // Place quick nav after the `<Subtitle>` that immediately follows the first `<h1>`,
    // or after the first `<h1>` if a matching `<Subtitle>` wasn't found.
    let index = tree.children.indexOf(h1) + 2; // Adding "2" because there's also a line break below h1
    index = tree.children[index]?.name === DOC_SUBTITLE ? index + 1 : index;
    tree.children.splice(index, 0, root);
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
