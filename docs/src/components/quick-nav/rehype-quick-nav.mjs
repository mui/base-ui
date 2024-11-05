// @ts-check

const ROOT = 'QuickNav.Root';
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
    const toc = file.data.toc;
    const root = createMdxElement({
      name: ROOT,
      children: [
        createMdxElement({
          name: LIST,
          children: [
            getNodeFromEntry({ value: '(Top)', id: '', depth: 2 }),
            ...toc.flatMap((entry) => entry.children?.map(getNodeFromEntry)),
          ],
        }),
      ],
    });

    // TODO first subtitle or first heading
    const index = tree.children.findLastIndex(
      /** @param {{ name: string; tagName: string; }} node */
      (node) => node.name === 'Subtitle' || node.tagName === 'h1',
    );
    tree.children.splice(index + 1, 0, root);
  };
}

/**
 * @param {TocEntry} entry
 * @returns {Object}
 */
function getNodeFromEntry({ value, id, children }) {
  const link = createMdxElement({
    name: LINK,
    children: [{ type: 'text', value }],
    props: {
      href: `#${id}`,
    },
  });

  let sub;

  if (children?.length) {
    sub = createMdxElement({
      name: LIST,
      children: children.map(getNodeFromEntry),
    });
  }

  return createMdxElement({
    name: ITEM,
    children: [link, sub].filter(Boolean),
  });
}

/**
 * @param {Object} args
 * @param {string} args.name
 * @param {unknown[]} args.children
 * @param {Record<string, unknown>} [args.props]
 * @returns {Object}
 */
function createMdxElement({ name, children, props = {} }) {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: [
      ...Object.entries(props).map(([attributeName, attributeValue]) => ({
        name: attributeName,
        type: 'mdxJsxAttribute',
        value: mdxAttributeValue(attributeValue),
      })),
    ],
    data: { _mdxExplicitJsx: true },
    children,
  };
}

/** @param {unknown} value */
function mdxAttributeValue(value) {
  if (typeof value === 'boolean' || value === null) {
    return {
      type: 'mdxJsxAttributeValueExpression',
      data: {
        estree: {
          sourceType: 'module',
          type: 'Program',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value,
              },
            },
          ],
        },
      },
    };
  }

  if (typeof value === 'object') {
    return {
      type: 'mdxJsxAttributeValueExpression',
      data: {
        estree: {
          type: 'Program',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'ObjectExpression',
                properties: Object.entries(value).map(([entryName, entryValue]) => ({
                  type: 'Property',
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    name: entryName,
                  },
                  value: {
                    type: 'Literal',
                    value: entryValue,
                  },
                  kind: 'init',
                })),
              },
            },
          ],
          sourceType: 'module',
        },
      },
    };
  }

  return value;
}
