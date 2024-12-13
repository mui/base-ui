// @ts-check
/**
 * @import {Nodes} from 'hast'
 */
import { createMdxElement } from 'docs/src/mdx/createMdxElement.mjs';
import { toString } from 'hast-util-to-string';

const ROOT = 'QuickNav.Root';
const TITLE = 'QuickNav.Title';
const LIST = 'QuickNav.List';
const ITEM = 'QuickNav.Item';
const LINK = 'QuickNav.Link';
const DOC_DEMO = 'Demo';
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
    /** @type {TocEntry[]} */
    const toc = file.data.toc;
    const root = createMdxElement({
      name: ROOT,
      children: toc.flatMap(getNodeFromEntry).filter(Boolean),
    });

    if (!toc?.length) {
      return;
    }

    // Determine the placement of Quick Nav up next

    /** @type {{ tagName?: string; name?: string; attributes?: Record<string, string>[] }[]} */
    const contentNodes = tree.children.filter(
      /** @param {Nodes} child */
      (child) => {
        return (
          // Filter out nodes that don't produce text
          (('children' in child || 'value' in child) && toString(child).trim()) ||
          ('name' in child && child.name === 'Demo')
        );
      },
    );

    const h1 = tree.children.find(
      /** @param {{ tagName: string; }} node */
      (node) => node.tagName === 'h1',
    );

    const subtitle = contentNodes.find((node, i) => {
      const prev = contentNodes[i - 1];
      return node.name === DOC_SUBTITLE && prev === h1;
    });

    let nodeBefore = contentNodes.find((node, i) => {
      const prev = contentNodes[i - 1];
      return node.name === DOC_DEMO && prev === subtitle;
    });

    // Add a styling hook if a `<Demo>` element was found
    if (nodeBefore) {
      nodeBefore.attributes ??= [];
      nodeBefore.attributes.push({
        type: 'mdxJsxAttribute',
        name: 'data-before-quick-nav',
        value: '',
      });
    } else {
      // Otherwise, place the Quick Nav node after a fallback
      nodeBefore = subtitle ?? h1;
    }

    const index = tree.children.indexOf(nodeBefore) + 1;
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
